import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase/client';
import type { ImportRow, ImportTarget } from './admin-import';

export type ManagedRosterType = 'volunteers' | 'children';

export interface ManagedRoster {
  id: string;
  name: string;
  type: ManagedRosterType;
  teacherLabel?: string;
  ownerLabel?: string;
  memberIds: string[];
  environment: string;
  fixture?: boolean;
  updatedAt?: unknown;
}

export interface ManagedRosterMember {
  id: string;
  rosterId: string;
  displayName: string;
  ageBand?: string;
  guardianLabel?: string;
  environment: string;
  fixture?: boolean;
  updatedAt?: unknown;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  active: boolean;
  environment: string;
  fixture?: boolean;
  updatedAt?: unknown;
}

const mapRecord = <T extends { id: string }>(id: string, value: Record<string, unknown>): T => ({
  id,
  ...value,
}) as T;

type NewRecord<T extends { id: string }> = Omit<T, 'id' | 'updatedAt'> & { id?: string };

export const AdminDataService = {
  subscribeRosters(onData: (records: ManagedRoster[]) => void, onError: (error: Error) => void): Unsubscribe {
    return onSnapshot(
      collection(db, 'rosters'),
      (snapshot) => {
        const records = snapshot.docs
          .map((item) => mapRecord<ManagedRoster>(item.id, item.data()))
          .sort((a, b) => a.name.localeCompare(b.name));
        onData(records);
      },
      (error) => onError(error),
    );
  },

  subscribeRosterMembers(onData: (records: ManagedRosterMember[]) => void, onError: (error: Error) => void): Unsubscribe {
    return onSnapshot(
      collection(db, 'roster_members'),
      (snapshot) => onData(snapshot.docs.map((item) => mapRecord<ManagedRosterMember>(item.id, item.data()))),
      (error) => onError(error),
    );
  },

  subscribeKnowledgeDocuments(onData: (records: KnowledgeDocument[]) => void, onError: (error: Error) => void): Unsubscribe {
    return onSnapshot(
      collection(db, 'knowledge_documents'),
      (snapshot) => {
        const records = snapshot.docs
          .map((item) => mapRecord<KnowledgeDocument>(item.id, item.data()))
          .sort((a, b) => a.title.localeCompare(b.title));
        onData(records);
      },
      (error) => onError(error),
    );
  },

  async saveRoster(roster: NewRecord<ManagedRoster>): Promise<string> {
    const id = roster.id || `roster_${crypto.randomUUID()}`;
    const { id: _ignored, ...payload } = roster;
    await setDoc(doc(db, 'rosters', id), { ...payload, updatedAt: serverTimestamp() }, { merge: true });
    return id;
  },

  async deleteRoster(id: string): Promise<void> {
    await deleteDoc(doc(db, 'rosters', id));
  },

  async saveRosterMember(member: NewRecord<ManagedRosterMember>): Promise<string> {
    const id = member.id || `member_${crypto.randomUUID()}`;
    const { id: _ignored, ...payload } = member;
    await setDoc(doc(db, 'roster_members', id), { ...payload, updatedAt: serverTimestamp() }, { merge: true });
    return id;
  },

  async deleteRosterMember(id: string): Promise<void> {
    await deleteDoc(doc(db, 'roster_members', id));
  },

  async saveKnowledgeDocument(document: NewRecord<KnowledgeDocument>): Promise<string> {
    const id = document.id || `knowledge_${crypto.randomUUID()}`;
    const { id: _ignored, ...payload } = document;
    await setDoc(doc(db, 'knowledge_documents', id), { ...payload, updatedAt: serverTimestamp() }, { merge: true });
    return id;
  },

  async deleteKnowledgeDocument(id: string): Promise<void> {
    await deleteDoc(doc(db, 'knowledge_documents', id));
  },

  async importRecords(target: ImportTarget, rows: ImportRow[]): Promise<number> {
    const collectionName = target;
    await Promise.all(rows.map(async (row) => {
      const id = String(row.id);
      const { id: _ignored, ...payload } = row;
      await setDoc(doc(db, collectionName, id), {
        ...payload,
        fixture: true,
        environment: 'development',
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }));
    return rows.length;
  },
};
