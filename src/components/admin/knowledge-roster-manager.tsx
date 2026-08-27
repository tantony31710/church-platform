import { useEffect, useMemo, useState } from 'react';
import { BookOpen, FilePlus2, Loader2, Plus, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/lib/toast-context';
import {
  AdminDataService,
  type KnowledgeDocument,
  type ManagedRoster,
  type ManagedRosterMember,
  type ManagedRosterType,
} from '@/lib/admin-data-service';

const emptyDocument = { title: '', category: 'General', content: '', tags: '' };

export function KnowledgeRosterManager() {
  const { showToast } = useToast();
  const [rosters, setRosters] = useState<ManagedRoster[]>([]);
  const [members, setMembers] = useState<ManagedRosterMember[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [rosterName, setRosterName] = useState('');
  const [rosterType, setRosterType] = useState<ManagedRosterType>('volunteers');
  const [selectedRosterId, setSelectedRosterId] = useState('');
  const [memberName, setMemberName] = useState('');
  const [memberAgeBand, setMemberAgeBand] = useState('');
  const [document, setDocument] = useState(emptyDocument);

  useEffect(() => {
    const onError = (problem: Error) => setError(problem.message || 'Live Firestore subscription failed.');
    const unsubscribeRosters = AdminDataService.subscribeRosters(setRosters, onError);
    const unsubscribeMembers = AdminDataService.subscribeRosterMembers(setMembers, onError);
    const unsubscribeDocuments = AdminDataService.subscribeKnowledgeDocuments(setDocuments, onError);
    return () => {
      unsubscribeRosters();
      unsubscribeMembers();
      unsubscribeDocuments();
    };
  }, []);

  const selectedRoster = useMemo(
    () => rosters.find((roster) => roster.id === selectedRosterId) || rosters[0],
    [rosters, selectedRosterId],
  );

  const selectedMembers = members.filter((member) => member.rosterId === selectedRoster?.id);

  const saveRoster = async () => {
    const name = rosterName.trim();
    if (!name) return showToast('Enter a roster name.');
    setSaving(true);
    try {
      const id = await AdminDataService.saveRoster({
        name,
        type: rosterType,
        ownerLabel: rosterType === 'children' ? 'Teacher roster' : 'Pastor roster',
        memberIds: [],
        environment: 'development',
      });
      setSelectedRosterId(id);
      setRosterName('');
      showToast('Roster saved to live Firestore.');
    } catch (problem) {
      showToast(problem instanceof Error ? problem.message : 'Roster save failed.');
    } finally {
      setSaving(false);
    }
  };

  const removeRoster = async (roster: ManagedRoster) => {
    if (!window.confirm(`Delete the roster “${roster.name}”?`)) return;
    try {
      await AdminDataService.deleteRoster(roster.id);
      showToast('Roster deleted.');
    } catch (problem) {
      showToast(problem instanceof Error ? problem.message : 'Roster deletion failed.');
    }
  };

  const saveMember = async () => {
    const displayName = memberName.trim();
    if (!selectedRoster || !displayName) return showToast('Select a roster and enter a member name.');
    setSaving(true);
    try {
      const memberId = await AdminDataService.saveRosterMember({
        rosterId: selectedRoster.id,
        displayName,
        ageBand: selectedRoster.type === 'children' ? memberAgeBand.trim() || 'primary' : undefined,
        guardianLabel: selectedRoster.type === 'children' ? 'Managed guardian contact' : undefined,
        environment: 'development',
      });
      await AdminDataService.saveRoster({
        ...selectedRoster,
        memberIds: Array.from(new Set([...selectedRoster.memberIds, memberId])),
      });
      setMemberName('');
      setMemberAgeBand('');
      showToast('Roster member saved to live Firestore.');
    } catch (problem) {
      showToast(problem instanceof Error ? problem.message : 'Member save failed.');
    } finally {
      setSaving(false);
    }
  };

  const saveDocument = async () => {
    if (!document.title.trim() || !document.content.trim()) return showToast('Enter a document title and content.');
    setSaving(true);
    try {
      await AdminDataService.saveKnowledgeDocument({
        title: document.title.trim(),
        category: document.category.trim() || 'General',
        content: document.content.trim(),
        tags: document.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        active: true,
        environment: 'development',
      });
      setDocument(emptyDocument);
      showToast('Knowledge document saved to live Firestore.');
    } catch (problem) {
      showToast(problem instanceof Error ? problem.message : 'Knowledge document save failed.');
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = 'w-full rounded-xl border border-border bg-white/5 px-3 py-2 text-xs text-foreground placeholder:text-foreground/35 focus:border-glow/60 focus:outline-none';

  return (
    <div className="space-y-6">
      {error && <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-xs text-red-200">{error}</div>}
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-border bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-glow" /><div><h3 className="font-bold">Live rosters</h3><p className="text-xs text-foreground/55">Pastor and teacher rosters stored in Firestore.</p></div></div>
          <div className="grid gap-2 sm:grid-cols-[1fr_150px_auto]">
            <input className={fieldClass} value={rosterName} onChange={(event) => setRosterName(event.target.value)} placeholder="Roster name" />
            <select className={fieldClass} value={rosterType} onChange={(event) => setRosterType(event.target.value as ManagedRosterType)}><option value="volunteers">Volunteers</option><option value="children">Children / class</option></select>
            <Button onClick={saveRoster} disabled={saving}><Plus className="mr-1 h-4 w-4" />Add</Button>
          </div>
          <div className="mt-4 space-y-2">
            {rosters.map((roster) => <div key={roster.id} className={`flex items-center justify-between rounded-xl border p-3 ${selectedRoster?.id === roster.id ? 'border-glow/60 bg-glow/10' : 'border-border bg-white/[0.02]'}`}><button className="min-w-0 flex-1 text-left" onClick={() => setSelectedRosterId(roster.id)}><p className="truncate text-sm font-semibold">{roster.name}</p><p className="text-[11px] text-foreground/55">{roster.type === 'children' ? 'Teacher roster' : 'Pastor roster'} · {members.filter((member) => member.rosterId === roster.id).length} members</p></button><button aria-label={`Delete ${roster.name}`} className="ml-2 rounded-lg p-2 text-red-300 hover:bg-red-500/10" onClick={() => removeRoster(roster)}><Trash2 className="h-4 w-4" /></button></div>)}
            {!rosters.length && <p className="rounded-xl border border-dashed border-border p-4 text-xs text-foreground/50">No rosters yet. Add one above or run the development seeder.</p>}
          </div>
          {selectedRoster && <div className="mt-5 border-t border-border pt-4"><p className="mb-2 text-xs font-bold uppercase tracking-wide text-foreground/60">Members in {selectedRoster.name}</p><div className="grid gap-2 sm:grid-cols-[1fr_140px_auto]"><input className={fieldClass} value={memberName} onChange={(event) => setMemberName(event.target.value)} placeholder={selectedRoster.type === 'children' ? 'Fictional child label' : 'Volunteer name'} /><input className={fieldClass} value={memberAgeBand} onChange={(event) => setMemberAgeBand(event.target.value)} placeholder={selectedRoster.type === 'children' ? 'Age band' : 'Optional note'} /><Button variant="outline" onClick={saveMember} disabled={saving}>Add member</Button></div><div className="mt-3 flex flex-wrap gap-2">{selectedMembers.map((member) => <span key={member.id} className="rounded-full border border-border bg-white/5 px-3 py-1 text-xs">{member.displayName}</span>)}</div></div>}
        </section>

        <section className="rounded-2xl border border-border bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center gap-2"><BookOpen className="h-5 w-5 text-glow" /><div><h3 className="font-bold">RAG knowledge corpus</h3><p className="text-xs text-foreground/55">Manage development SOP documents used by grounded retrieval.</p></div></div>
          <div className="space-y-2"><input className={fieldClass} value={document.title} onChange={(event) => setDocument({ ...document, title: event.target.value })} placeholder="Document title" /><div className="grid gap-2 sm:grid-cols-2"><input className={fieldClass} value={document.category} onChange={(event) => setDocument({ ...document, category: event.target.value })} placeholder="Category" /><input className={fieldClass} value={document.tags} onChange={(event) => setDocument({ ...document, tags: event.target.value })} placeholder="Tags, comma separated" /></div><textarea className={`${fieldClass} min-h-32 resize-y`} value={document.content} onChange={(event) => setDocument({ ...document, content: event.target.value })} placeholder="Grounded SOP content" /><Button onClick={saveDocument} disabled={saving}><FilePlus2 className="mr-2 h-4 w-4" />Save document</Button></div>
          <div className="mt-5 space-y-2">{documents.map((item) => <div key={item.id} className="rounded-xl border border-border bg-white/[0.02] p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{item.title}</p><p className="text-[11px] text-foreground/55">{item.category} · {item.active ? 'active' : 'inactive'} · {item.environment}</p></div><button aria-label={`Delete ${item.title}`} className="rounded-lg p-2 text-red-300 hover:bg-red-500/10" onClick={() => AdminDataService.deleteKnowledgeDocument(item.id).then(() => showToast('Knowledge document deleted.')).catch((problem) => showToast(problem instanceof Error ? problem.message : 'Delete failed.'))}><Trash2 className="h-4 w-4" /></button></div><p className="mt-2 line-clamp-2 text-xs text-foreground/60">{item.content}</p></div>)}{!documents.length && <p className="rounded-xl border border-dashed border-border p-4 text-xs text-foreground/50">No managed knowledge documents yet.</p>}</div>
        </section>
      </div>
      {saving && <div className="flex items-center gap-2 text-xs text-foreground/50"><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving to Firestore…</div>}
    </div>
  );
}
