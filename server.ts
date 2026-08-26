import express from 'express';
import path from 'path';
import { spawn } from 'child_process';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy GoogleGenAI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// Helper to execute Python engine actions
function runPythonEngine(action: string, payload: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python3', [path.join(process.cwd(), 'python_engine.py'), action]);

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0 && !stdout) {
        return reject(new Error(stderr || `Python process exited with code ${code}`));
      }
      try {
        const parsed = JSON.parse(stdout);
        resolve(parsed);
      } catch (err) {
        resolve({ rawOutput: stdout, error: stderr || null });
      }
    });

    pythonProcess.stdin.write(JSON.stringify(payload));
    pythonProcess.stdin.end();
  });
}

// ==========================================
// API ROUTES
// ==========================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), pythonReady: true });
});

// 1. Python RAG Semantic Search
app.post('/api/python/rag-query', async (req, res) => {
  try {
    const { query, top_k } = req.body;
    const result = await runPythonEngine('rag-search', { query, top_k: top_k || 3 });
    res.json(result);
  } catch (error: any) {
    console.error('Python RAG error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Python Volunteer Churn Risk ML
app.post('/api/python/churn-analysis', async (req, res) => {
  try {
    const { volunteers } = req.body;
    const result = await runPythonEngine('churn-analysis', { volunteers });
    res.json(result);
  } catch (error: any) {
    console.error('Python Churn analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Python K-Means Clustering
app.post('/api/python/clustering', async (req, res) => {
  try {
    const { volunteers } = req.body;
    const result = await runPythonEngine('clustering', { volunteers });
    res.json(result);
  } catch (error: any) {
    console.error('Python Clustering error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Python Time-Series Attendance Forecasting
app.post('/api/python/attendance-forecast', async (req, res) => {
  try {
    const { attendance } = req.body;
    const result = await runPythonEngine('attendance-forecast', { attendance });
    res.json(result);
  } catch (error: any) {
    console.error('Python Attendance forecast error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Python Bipartite Task Optimization
app.post('/api/python/optimize-tasks', async (req, res) => {
  try {
    const { tasks, volunteers } = req.body;
    const result = await runPythonEngine('optimize-tasks', { tasks, volunteers });
    res.json(result);
  } catch (error: any) {
    console.error('Python Optimization error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. Python Custom Code Runner (Data Science Terminal)
app.post('/api/python/run', async (req, res) => {
  try {
    const { code, volunteers, tasks } = req.body;
    const result = await runPythonEngine('run-script', { code, volunteers, tasks });
    res.json(result);
  } catch (error: any) {
    console.error('Python code run error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 7. Gemini AI + RAG Ministry Assistant
app.post('/api/ai/ask-rag', async (req, res) => {
  try {
    const { question, userContext } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Step 1: Retrieve relevant context using Python RAG
    const ragResult = await runPythonEngine('rag-search', { query: question, top_k: 3 });
    const matchedDocs = ragResult?.results || [];
    const contextText = matchedDocs
      .map((d: any, idx: number) => `[Source ${idx + 1}: ${d.title} (${d.category})]\n${d.content}`)
      .join('\n\n');

    const ai = getGeminiClient();
    if (ai) {
      const prompt = `You are the Grace Community Church AI Ministry & Pastoral Assistant.
You have access to the official Church Ministry Handbook, standard operating procedures, safety rules, and volunteer policies.

Official Retrieved Church Policy Documents:
${contextText || 'No specific document matched. Use standard Christian ministry pastoral best practices.'}

User Information:
Name: ${userContext?.name || 'Volunteer'}
Role: ${userContext?.role || 'Volunteer'}
Department: ${userContext?.department || 'General Ministry'}

Volunteer Question: "${question}"

Instructions:
1. Provide a warm, encouraging, clear, and practical response.
2. Cite the specific church operating procedure or safety guideline when applicable.
3. Keep the tone helpful, pastoral, and concise (2-3 paragraphs max).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
      });

      return res.json({
        answer: response.text || 'Unable to generate response.',
        retrievedDocuments: matchedDocs,
        modelUsed: 'gemini-3.7-flash',
      });
    } else {
      // Fallback deterministic RAG answer if GEMINI_API_KEY is not set
      let fallbackAnswer = `Here is what the church ministry guidelines specify:\n\n`;
      if (matchedDocs.length > 0) {
        fallbackAnswer += `Based on "${matchedDocs[0].title}" (${matchedDocs[0].category}):\n${matchedDocs[0].content}\n\nFor further pastoral questions, please check in with Pastor David or your ministry lead.`;
      } else {
        fallbackAnswer += `All church volunteers report to their department lead 30 minutes before Sunday service. Ensure safety guidelines and the two-adult rule are maintained at all times.`;
      }

      return res.json({
        answer: fallbackAnswer,
        retrievedDocuments: matchedDocs,
        modelUsed: 'local-rag-knowledge-engine',
      });
    }
  } catch (error: any) {
    console.error('AI RAG Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// VITE / STATIC SERVING
// ==========================================

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ChurchConnect Full-Stack Server running on port ${PORT}`);
  });
}

start();
