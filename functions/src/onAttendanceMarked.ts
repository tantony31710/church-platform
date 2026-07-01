import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

// Fixed points-per-attendance value. Pulled out as a constant so it's
// one place to change if the church wants attendance to be worth more
// or less relative to task completions.
const ATTENDANCE_POINTS = 5;

export const onAttendanceMarked = onDocumentCreated('attendance/{recordId}', async (event) => {
  const data = event.data?.data();
  if (!data?.userId) return;

  const userRef = db.collection('users').doc(data.userId);
  const leaderboardRef = db.collection('leaderboard').doc(data.userId);

  await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    const userData = userSnap.data();
    if (!userData) return;

    const newPoints = (userData.points ?? 0) + ATTENDANCE_POINTS;
    tx.update(userRef, { points: newPoints });
    tx.set(leaderboardRef, { name: userData.name, points: newPoints }, { merge: true });
  });
});
