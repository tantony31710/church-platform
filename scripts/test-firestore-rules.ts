import assert from 'node:assert/strict';
import fs from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';

const testEnv = await initializeTestEnvironment({
  projectId: 'church-platform-rules-test',
  firestore: {
    rules: fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'),
  },
});

try {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'users/volunteer-1'), {
      name: 'Volunteer One', email: 'volunteer@example.test', role: 'volunteer',
      points: 0, tasksCompletedCount: 0, attendanceCount: 0,
    });
    await setDoc(doc(context.firestore(), 'users/admin-1'), {
      name: 'Admin One', email: 'admin@example.test', role: 'admin',
      points: 0, tasksCompletedCount: 0, attendanceCount: 0,
    });
  });

  const volunteerDb = testEnv.authenticatedContext('volunteer-1', {
    email: 'volunteer@example.test', email_verified: true,
  }).firestore();
  const adminDb = testEnv.authenticatedContext('admin-1', {
    email: 'admin@example.test', email_verified: true, admin: true,
  }).firestore();

  await assertSucceeds(getDoc(doc(volunteerDb, 'users/volunteer-1')));
  await assertFails(getDoc(doc(volunteerDb, 'users/admin-1')));
  await assertFails(updateDoc(doc(volunteerDb, 'users/volunteer-1'), { points: 50 }));
  await assertFails(updateDoc(doc(volunteerDb, 'users/volunteer-1'), { tasksCompletedCount: 1 }));
  await assertFails(setDoc(doc(volunteerDb, 'attendance/a1'), {
    userId: 'volunteer-1', pointsAwarded: 5,
  }));
  await assertFails(setDoc(doc(volunteerDb, 'leaderboard/volunteer-1'), { points: 50 }));
  await assertFails(setDoc(doc(volunteerDb, 'settings/organization'), { churchName: 'Tampered Church' }));

  await assertSucceeds(setDoc(doc(adminDb, 'settings/organization'), { churchName: 'Live Church' }));
  await assertSucceeds(setDoc(doc(adminDb, 'settings/session'), { currentPin: '123456' }));
  await assertFails(updateDoc(doc(adminDb, 'users/volunteer-1'), { role: 'admin' }));

  console.log('PASS: Firestore rules protect profiles, points, attendance, leaderboard, settings, and admin promotion.');
} finally {
  await testEnv.cleanup();
}
