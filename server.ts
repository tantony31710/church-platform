import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import path from 'path';
import { spawn } from 'child_process';
import { GoogleGenAI } from '@google/genai';
import { createViteServer } from 'vite';
import rateLimit from 'express-rate-limit';
import { getAdminAuth, getAdminDb } from './lib/firebase/admin';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const PYTHON_TIMEOUT_MS = 30_000;
const MAX_TOP_K = 5;

type AuthenticatedRequest = Request & {
  firebaseUser?: { uid: string; email?: string; admin?: boolean; [key: string]: unknown };
};

app.use(express.json({ limit: '256kb' }));

const allowedCorsOrigins = String(process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use((req, res, next) => {
  const requestOrigin = req.header('origin');
  if (!requestOrigin) return next();

  const isAllowedOrigin = allowedCorsOrigins.includes(requestOrigin);
  if (isAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '600');
    res.setHeader('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    return isAllowedOrigin
      ? res.sendStatus(204)
      : res.status(403).json({ error: 'Origin is not allowed.' });
  }
  return next();
});

const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
const analysisLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);
app.use(['/api/python', '/api/ai'], analysisLimiter);

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

function getBearerToken(req: Request) {
  const header = req.header('authorization') || '';
  return header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : null;
}

async function requireFirebaseUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ error: 'Firebase ID token required.' });
  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    return res.status(503).json({ error: 'Server Firebase Admin credentials are not configured.' });
  }

  try {
    req.firebaseUser = await adminAuth.verifyIdToken(token);
    return next();
  } catch (error) {
    console.warn('[API auth] Invalid Firebase ID token:', error instanceof Error ? error.message : error);
    return res.status(401).json({ error: 'Invalid or expired Firebase ID token.' });
  }
}

function configuredAdminEmails() {
  return String(process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function requireDesignatedAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const adminEmails = configuredAdminEmails();
  const user = req.firebaseUser;
  if (!adminEmails.length) return res.status(503).json({ error: 'ADMIN_EMAILS is not configured on the server.' });
  if (!user || !user.email || !adminEmails.includes(user.email.trim().toLowerCase()) || user.admin !== true || user.email_verified !== true) {
    return res.status(403).json({ error: 'Only the verified designated administrator can access this endpoint.' });
  }

  const adminDb = getAdminDb();
  if (!adminDb) return res.status(503).json({ error: 'Server Firebase Admin credentials are not configured.' });
  const profile = await adminDb.collection('users').doc(user.uid).get();
  if (profile.data()?.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator profile is not provisioned.' });
  }
  return next();
}

function runPythonEngine(action: string, payload: unknown): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python3', [path.join(process.cwd(), 'python_engine.py'), action], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => {
      pythonProcess.kill('SIGKILL');
      reject(new Error('Python analysis timed out.'));
    }, PYTHON_TIMEOUT_MS);

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      if (stdout.length > 2_000_000) pythonProcess.kill('SIGKILL');
    });
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    pythonProcess.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    pythonProcess.on('close', (code) => {
      clearTimeout(timeout);
      if (code !== 0 && !stdout) return reject(new Error(stderr || `Python process exited with code ${code}`));
      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error(stderr || 'Python engine returned invalid JSON.'));
      }
    });

    const serialized = JSON.stringify(payload);
    if (Buffer.byteLength(serialized, 'utf8') > 2_000_000) {
      pythonProcess.kill('SIGKILL');
      return reject(new Error('Analysis payload is too large.'));
    }
    pythonProcess.stdin.write(serialized);
    pythonProcess.stdin.end();
  });
}

function boundedTopK(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(MAX_TOP_K, Math.floor(parsed))) : 3;
}

async function readLiveDataset() {
  const adminDb = getAdminDb();
  if (!adminDb) throw new Error('Server Firebase Admin credentials are not configured.');
  const [usersSnapshot, tasksSnapshot, attendanceSnapshot] = await Promise.all([
    adminDb.collection('users').get(),
    adminDb.collection('tasks').get(),
    adminDb.collection('attendance').get(),
  ]);
  return {
    users: usersSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
    tasks: tasksSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
    attendance: attendanceSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
  };
}

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    pythonReady: true,
    apiAuthRequired: true,
    adminConfigured: configuredAdminEmails().length > 0,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

app.post('/api/python/rag-query', requireFirebaseUser, async (req, res) => {
  try {
    const query = typeof req.body?.query === 'string' ? req.body.query.trim().slice(0, 500) : '';
    if (!query) return res.status(400).json({ error: 'A non-empty query is required.' });
    res.json(await runPythonEngine('rag-search', { query, top_k: boundedTopK(req.body?.top_k) }));
  } catch (error: any) {
    console.error('Python RAG error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/python/churn-analysis', requireFirebaseUser, requireDesignatedAdmin, async (req, res) => {
  try {
    const dataset = await readLiveDataset();
    const volunteers = dataset.users.filter((user: any) => user.role === 'volunteer');
    res.json(await runPythonEngine('churn-analysis', { volunteers }));
  } catch (error: any) {
    console.error('Python churn error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/python/clustering', requireFirebaseUser, requireDesignatedAdmin, async (req, res) => {
  try {
    const dataset = await readLiveDataset();
    const volunteers = dataset.users.filter((user: any) => user.role === 'volunteer');
    res.json(await runPythonEngine('clustering', { volunteers }));
  } catch (error: any) {
    console.error('Python clustering error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/python/attendance-forecast', requireFirebaseUser, requireDesignatedAdmin, async (req, res) => {
  try {
    const dataset = await readLiveDataset();
    res.json(await runPythonEngine('attendance-forecast', { attendance: dataset.attendance }));
  } catch (error: any) {
    console.error('Python forecast error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/python/optimize-tasks', requireFirebaseUser, requireDesignatedAdmin, async (req, res) => {
  try {
    const dataset = await readLiveDataset();
    const tasks = dataset.tasks.filter((task: any) => task.status === 'open');
    const volunteers = dataset.users.filter((user: any) => user.role === 'volunteer');
    res.json(await runPythonEngine('optimize-tasks', { tasks, volunteers }));
  } catch (error: any) {
    console.error('Python optimization error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/python/run', requireFirebaseUser, requireDesignatedAdmin, async (req, res) => {
  try {
    const code = typeof req.body?.code === 'string' ? req.body.code : '';
    if (!code.trim()) return res.status(400).json({ error: 'Python code is required.' });
    const result = await runPythonEngine('run-script', {
      code,
      ...(await readLiveDataset()),
    });
    res.json(result);
  } catch (error: any) {
    console.error('Python workbench error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/ask-rag', requireFirebaseUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const question = typeof req.body?.question === 'string' ? req.body.question.trim().slice(0, 1000) : '';
    if (!question) return res.status(400).json({ error: 'Question is required.' });

    const ragResult = await runPythonEngine('rag-search', { query: question, top_k: 3 });
    const matchedDocs = Array.isArray(ragResult?.results) ? ragResult.results : [];
    const contextText = matchedDocs
      .map((d: any, idx: number) => `[Source ${idx + 1}: ${d.title} (${d.category})]\n${d.content}`)
      .join('\n\n');
    const ai = getGeminiClient();

    if (ai) {
      const prompt = `You are the Grace Community Church AI Ministry & Pastoral Assistant.
Use only the official retrieved policy documents below for operational claims. If the documents do not answer a question, say so and recommend contacting the ministry lead.

Official Retrieved Church Policy Documents:
${contextText || 'No specific document matched.'}

Authenticated User:
Email: ${req.firebaseUser?.email || 'authenticated volunteer'}

Question: "${question}"

Give a warm, concise, practical answer in no more than three short paragraphs. Cite the relevant policy title when applicable.`;
      const response = await ai.models.generateContent({ model: 'gemini-3.7-flash', contents: prompt });
      return res.json({ answer: response.text || 'Unable to generate a response.', retrievedDocuments: matchedDocs, modelUsed: 'gemini-3.7-flash' });
    }

    const answer = matchedDocs.length
      ? `Based on "${matchedDocs[0].title}":\n\n${matchedDocs[0].content}\n\nFor questions requiring pastoral judgment, contact your ministry lead.`
      : 'No matching church policy was found. Please contact your ministry lead for guidance.';
    return res.json({ answer, retrievedDocuments: matchedDocs, modelUsed: 'local-rag-knowledge-engine' });
  } catch (error: any) {
    console.error('AI RAG error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get(/.*/, (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ChurchConnect Full-Stack Server running on port ${PORT}`);
  });
}

void start();
