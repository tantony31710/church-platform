import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

const db = getFirestore();

// Attendance is engagement telemetry. It does not award points;
// points are awarded only by onTaskCompleted after a verified task transition.
export const onAttendanceMarked = onDocumentCreated('attendance/{recordId}', async (event) => {
  const data = event.data?.data();
  if (!data?.userId) return;

  const userRef = db.collection('users').doc(data.userId);
  await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    const userData = userSnap.data();
    if (!userData) return;
    tx.update(userRef, {
      attendanceCount: (userData.attendanceCount ?? 0) + 1,
      streak: Math.max(1, (userData.streak ?? 0) + 1),
    });
  });

  console.log(`Recorded attendance for volunteer ${data.userId} using ${data.method || 'unknown'} method.`);
});
