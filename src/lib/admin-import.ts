import * as XLSX from 'xlsx';

export type ImportTarget = 'knowledge_documents' | 'tasks' | 'attendance' | 'rosters' | 'roster_members';

export type ImportRow = Record<string, unknown>;

export interface ImportIssue {
  row: number;
  message: string;
}

export interface ImportPreview {
  target: ImportTarget;
  rows: ImportRow[];
  issues: ImportIssue[];
  format: string;
}

const slug = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'row';

const parseCsv = (text: string): ImportRow[] => {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const parseLine = (line: string) => {
    const cells: string[] = [];
    let cell = '';
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"' && line[index + 1] === '"' && quoted) { cell += '"'; index += 1; continue; }
      if (char === '"') { quoted = !quoted; continue; }
      if (char === ',' && !quoted) { cells.push(cell.trim()); cell = ''; continue; }
      cell += char;
    }
    cells.push(cell.trim());
    return cells;
  };
  const headers = parseLine(lines[0]).map((header, index) => header || `column_${index + 1}`);
  return lines.slice(1).map((line) => Object.fromEntries(parseLine(line).map((value, index) => [headers[index], value ?? ''])));
};

const parseJson = (text: string): ImportRow[] => {
  const parsed = JSON.parse(text) as unknown;
  if (Array.isArray(parsed)) return parsed.filter((item): item is ImportRow => Boolean(item && typeof item === 'object'));
  if (parsed && typeof parsed === 'object') {
    const candidate = Object.values(parsed).find((value) => Array.isArray(value));
    if (Array.isArray(candidate)) return candidate.filter((item): item is ImportRow => Boolean(item && typeof item === 'object'));
  }
  throw new Error('JSON must contain an array of records or an object containing an array.');
};

const normalizeTags = (value: unknown) => Array.isArray(value) ? value.map(String).filter(Boolean) : String(value || '').split(/[|,]/).map((tag) => tag.trim()).filter(Boolean);

const normalizeRow = (target: ImportTarget, raw: ImportRow, rowNumber: number): ImportRow => {
  const row = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key.trim(), typeof value === 'string' ? value.trim() : value]));
  const label = String(row.id || row.title || row.name || row.displayName || `${target}-${rowNumber}`);
  const base: ImportRow = { ...row, id: String(row.id || `import_${target}_${slug(label)}_${rowNumber}`), environment: 'development' };
  if (target === 'knowledge_documents') return { ...base, title: String(row.title || ''), category: String(row.category || 'General'), content: String(row.content || ''), tags: normalizeTags(row.tags), active: row.active !== false && String(row.active).toLowerCase() !== 'false' };
  if (target === 'rosters') return { ...base, name: String(row.name || row.title || ''), type: row.type === 'children' ? 'children' : 'volunteers', ownerLabel: String(row.ownerLabel || (row.type === 'children' ? 'Teacher roster' : 'Pastor roster')), memberIds: Array.isArray(row.memberIds) ? row.memberIds : [] };
  if (target === 'roster_members') return { ...base, rosterId: String(row.rosterId || ''), displayName: String(row.displayName || row.name || ''), ageBand: row.ageBand ? String(row.ageBand) : undefined, guardianLabel: row.guardianLabel ? String(row.guardianLabel) : undefined };
  if (target === 'attendance') return { ...base, userId: String(row.userId || ''), date: String(row.date || row.serviceDate || ''), status: String(row.status || 'present'), pointsAwarded: 0, serviceType: String(row.serviceType || 'Sunday service') };
  return { ...base, title: String(row.title || ''), description: String(row.description || ''), status: String(row.status || 'open'), pointsValue: Number(row.pointsValue || 15), department: String(row.department || row.category || 'General') };
};

export const previewImport = (target: ImportTarget, filename: string, input: string | ArrayBuffer): ImportPreview => {
  const extension = filename.toLowerCase().split('.').pop() || 'text';
  let rawRows: ImportRow[];
  if (extension === 'xlsx' || extension === 'xls') {
    const workbook = XLSX.read(input, { type: typeof input === 'string' ? 'string' : 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    rawRows = firstSheet ? XLSX.utils.sheet_to_json<ImportRow>(firstSheet, { defval: '' }) : [];
  } else if (extension === 'csv') rawRows = parseCsv(String(input));
  else if (extension === 'json' || extension === 'jsonl') rawRows = extension === 'json' ? parseJson(String(input)) : String(input).split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as ImportRow);
  else if (target === 'knowledge_documents' && ['md', 'markdown', 'txt'].includes(extension)) rawRows = [{ title: filename.replace(/\.[^.]+$/, ''), category: 'Imported knowledge', content: String(input), tags: [] }];
  else throw new Error('Supported formats are CSV, JSON, JSONL, XLSX, Markdown, and TXT.');

  const rows = rawRows.map((row, index) => normalizeRow(target, row, index + 1));
  const issues: ImportIssue[] = [];
  rows.forEach((row, index) => {
    const required = target === 'knowledge_documents' ? ['title', 'content'] : target === 'rosters' ? ['name'] : target === 'roster_members' ? ['rosterId', 'displayName'] : target === 'attendance' ? ['userId', 'date'] : ['title'];
    required.filter((field) => !String(row[field] ?? '').trim()).forEach((field) => issues.push({ row: index + 2, message: `Missing required field: ${field}` }));
  });
  const ids = new Set<string>();
  rows.forEach((row, index) => { const id = String(row.id); if (ids.has(id)) issues.push({ row: index + 2, message: `Duplicate ID: ${id}` }); ids.add(id); });
  return { target, rows, issues, format: extension };
};
