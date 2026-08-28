import { useState } from 'react';
import { FileUp, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/lib/toast-context';
import { AdminDataService } from '@/lib/admin-data-service';
import { previewImport, type ImportPreview, type ImportTarget } from '@/lib/admin-import';

const targets: Array<{ value: ImportTarget; label: string; hint: string }> = [
  { value: 'knowledge_documents', label: 'RAG knowledge documents', hint: 'CSV, JSON, JSONL, XLSX, Markdown, or TXT' },
  { value: 'rosters', label: 'Pastor / teacher rosters', hint: 'CSV, JSON, JSONL, or XLSX' },
  { value: 'roster_members', label: 'Roster members / classroom children', hint: 'CSV, JSON, JSONL, or XLSX' },
  { value: 'tasks', label: 'Ministry tasks', hint: 'CSV, JSON, JSONL, or XLSX' },
  { value: 'attendance', label: 'Attendance history', hint: 'CSV, JSON, JSONL, or XLSX' },
];

export function DataImportManager() {
  const { showToast } = useToast();
  const [target, setTarget] = useState<ImportTarget>('knowledge_documents');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [saving, setSaving] = useState(false);

  const chooseFile = async (file?: File) => {
    if (!file) return;
    try {
      const input = /\.(xlsx|xls)$/i.test(file.name) ? await file.arrayBuffer() : await file.text();
      setPreview(previewImport(target, file.name, input));
    } catch (problem) {
      setPreview(null);
      showToast(problem instanceof Error ? problem.message : 'The file could not be parsed.');
    }
  };

  const importRows = async () => {
    if (!preview || preview.issues.length) return showToast('Resolve validation issues before importing.');
    if (!window.confirm('Import these records into the DEVELOPMENT Firestore dataset?')) return;
    setSaving(true);
    try {
      const count = await AdminDataService.importRecords(preview.target, preview.rows);
      showToast(`${count} development records imported to live Firestore.`);
      setPreview(null);
    } catch (problem) {
      showToast(problem instanceof Error ? problem.message : 'Import failed.');
    } finally {
      setSaving(false);
    }
  };

  const selected = targets.find((item) => item.value === target) || targets[0];

  return (
    <section className="rounded-2xl border border-border bg-white/[0.03] p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-2"><FileUp className="h-5 w-5 text-glow" /><div><h3 className="font-bold">Data ingestion studio</h3><p className="text-xs text-foreground/55">Preview, validate, and import development data for analysis.</p></div></div>
        <span className="flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-1 text-[10px] text-emerald-200"><ShieldCheck className="h-3 w-3" />DEVELOPMENT ONLY</span>
      </div>
      <div className="grid gap-3 md:grid-cols-[220px_1fr_auto] md:items-end">
        <label className="text-xs text-foreground/70">Dataset<select className="mt-1 w-full rounded-xl border border-border bg-white/5 px-3 py-2 text-xs text-foreground" value={target} onChange={(event) => { setTarget(event.target.value as ImportTarget); setPreview(null); }}>{targets.map((item) => <option key={item.value} value={item.value} className="bg-background">{item.label}</option>)}</select></label>
        <label className="text-xs text-foreground/70">File<span className="mt-1 block rounded-xl border border-dashed border-border bg-white/5 px-3 py-2 text-xs text-foreground/60">{selected.hint}<input className="mt-2 block w-full text-xs" type="file" accept=".csv,.json,.jsonl,.xlsx,.xls,.md,.markdown,.txt" onChange={(event) => chooseFile(event.target.files?.[0])} /></span></label>
        <Button onClick={importRows} disabled={!preview || Boolean(preview.issues.length) || saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}Import validated rows</Button>
      </div>
      {preview && <div className="mt-4 rounded-xl border border-border bg-black/10 p-4"><div className="flex flex-wrap items-center justify-between gap-2 text-xs"><span><strong>{preview.rows.length}</strong> rows · {preview.format.toUpperCase()} · {preview.issues.length ? <span className="text-red-300">{preview.issues.length} validation issues</span> : <span className="text-emerald-300">ready for import</span>}</span><span className="text-foreground/45">No writes occur during preview.</span></div>{preview.issues.length > 0 && <div className="mt-2 space-y-1 text-xs text-red-200">{preview.issues.slice(0, 8).map((issue) => <p key={`${issue.row}-${issue.message}`}>Row {issue.row}: {issue.message}</p>)}</div>}<pre className="mt-3 max-h-48 overflow-auto rounded-lg bg-black/30 p-3 text-[10px] text-foreground/65">{JSON.stringify(preview.rows.slice(0, 5), null, 2)}</pre></div>}
    </section>
  );
}
