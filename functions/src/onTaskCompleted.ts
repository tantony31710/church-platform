import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

// Fires whenever any task document is updated. Only acts on the
// specific transition open/assigned -> completed, so re-saving a task
// for unrelated reasons (e.g. an admin editing the description) never
// double-awards points.
export const onTaskCompleted = onDocumentUpdated('tasks/{taskId}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;

  const justCompleted = before.status !== 'completed' && after.status === 'completed';
  if (!justCompleted || !after.assignedTo) return;

  const userId: string = after.assignedTo;
  const pointsValue: number = after.pointsValue ?? 0;
  const userRef = db.collection('users').doc(userId);
  const leaderboardRef = db.collection('leaderboard').doc(userId);

  // A transaction here matters: without it, two tasks completing for
  // the same volunteer within milliseconds of each other could both
  // read the same starting point value and overwrite each other's
  // increment instead of adding up.
  await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    const userData = userSnap.data();
    if (!userData) return;

    const newPoints = (userData.points ?? 0) + pointsValue;
    const tasksCompletedCount = (userData.tasksCompletedCount ?? 0) + 1;
    const badges = new Set<string>(Array.isArray(userData.badges) ? userData.badges : []);
    badges.add('First Step');
    if (tasksCompletedCount >= 3) badges.add('Faithful Servant');
    if (newPoints >= 50) badges.add('Master Organizer');
    if (newPoints >= 100) badges.add('Century Club');
    if (newPoints >= 250) badges.add('Community Pillar');
    tx.update(userRef, {
      points: newPoints,
      tasksCompletedCount,
      badges: Array.from(badges),
    });

    // Keep the denormalized leaderboard doc in sync in the same
    // transaction, so leaderboard reads never lag behind actual points.
    tx.set(
      leaderboardRef,
      { name: userData.name, points: newPoints, tasksCompletedCount },
      { merge: true }
    );
  });

  console.log(`Awarded ${pointsValue} points to ${userId} for completing task ${event.params.taskId}`);
});
