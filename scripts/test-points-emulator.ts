import assert from 'node:assert/strict';
import { deleteApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
if (!emulatorHost) {
  throw new Error('FIRESTORE_EMULATOR_HOST is required. Start the Firestore and Functions emulators first.');
}

const app = initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'church-platform-local' });
const db = getFirestore(app);
const userId = `emulator-volunteer-${Date.now()}`;
const taskId = `emulator-task-${Date.now()}`;
const userRef = db.collection('users').doc(userId);
const taskRef = db.collection('tasks').doc(taskId);

async function waitForPoints(expectedPoints: number, expectedCount: number, timeoutMs = 15_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const snapshot = await userRef.get();
    const data = snapshot.data();
    if (data?.points === expectedPoints && data?.tasksCompletedCount === expectedCount) return data;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  const finalData = (await userRef.get()).data();
  throw new Error(`Timed out waiting for points=${expectedPoints}, count=${expectedCount}; received ${JSON.stringify(finalData)}`);
}

try {
  await userRef.set({
    name: 'Emulator Volunteer',
    email: 'emulator-volunteer@example.test',
    role: 'volunteer',
    points: 0,
    tasksCompletedCount: 0,
    attendanceCount: 0,
    streak: 0,
    badges: [],
  });

  await taskRef.set({
    title: 'Emulator point award task',
    status: 'assigned',
    assignedTo: userId,
    assignedToName: 'Emulator Volunteer',
    pointsValue: 15,
    subtasks: [],
  });

  await taskRef.update({
    status: 'completed',
    completedBy: userId,
    completedAt: new Date().toISOString(),
  });

  await waitForPoints(15, 1);

  // A second write while already completed must not fire a second award.
  await taskRef.set({ auditNote: 'same completed task' }, { merge: true });
  const finalData = await waitForPoints(15, 1, 3_000);
  assert.equal(finalData.points, 15);
  assert.equal(finalData.tasksCompletedCount, 1);
  console.log('PASS: completed task awarded 15 points exactly once.');
} finally {
  await Promise.all([userRef.delete(), taskRef.delete()]);
  await Promise.all(getApps().map((firebaseApp) => deleteApp(firebaseApp)));
}
