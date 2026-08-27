import assert from 'node:assert/strict';
import fs from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { resolveEffectiveRole } from '../src/lib/admin-role';

const testEnv = await initializeTestEnvironment({
  projectId: 'church-platform-admin-role-test',
  firestore: {
    rules: fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'),
  },
});

const allowedEmails = ['primary-admin@example.test', 'second-admin@example.test'];

try {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'users/primary-admin'), {
      name: 'Primary Admin', email: allowedEmails[0], role: 'admin', points: 0,
    });
    await setDoc(doc(db, 'users/second-admin'), {
      name: 'Second Admin', email: allowedEmails[1], role: 'admin', points: 0,
    });
    await setDoc(doc(db, 'users/unverified-admin'), {
      name: 'Unverified Admin', email: 'unverified-admin@example.test', role: 'admin', points: 0,
    });
    await setDoc(doc(db, 'users/no-claim-admin'), {
      name: 'No Claim Admin', email: 'no-claim-admin@example.test', role: 'admin', points: 0,
    });
    await setDoc(doc(db, 'users/profile-volunteer'), {
      name: 'Profile Volunteer', email: allowedEmails[0], role: 'volunteer', points: 0,
    });
  });

  const approvedAdmin = testEnv.authenticatedContext('primary-admin', {
    email: allowedEmails[0], email_verified: true, admin: true,
  }).firestore();
  const secondaryAdmin = testEnv.authenticatedContext('second-admin', {
    email: allowedEmails[1], email_verified: true, admin: true,
  }).firestore();
  const unverifiedAdmin = testEnv.authenticatedContext('unverified-admin', {
    email: 'unverified-admin@example.test', email_verified: false, admin: true,
  }).firestore();
  const noClaimAdmin = testEnv.authenticatedContext('no-claim-admin', {
    email: 'no-claim-admin@example.test', email_verified: true,
  }).firestore();
  const mismatchedProfile = testEnv.authenticatedContext('profile-volunteer', {
    email: allowedEmails[0], email_verified: true, admin: true,
  }).firestore();

  assert.equal(resolveEffectiveRole({
    email: allowedEmails[0], emailVerified: true, claims: { admin: true },
    profileRole: 'admin', allowedEmails,
  }), 'admin');
  assert.equal(resolveEffectiveRole({
    email: allowedEmails[1], emailVerified: true, claims: { admin: true },
    profileRole: 'admin', allowedEmails,
  }), 'admin');
  assert.equal(resolveEffectiveRole({
    email: 'unverified-admin@example.test', emailVerified: false, claims: { admin: true },
    profileRole: 'admin', allowedEmails,
  }), 'volunteer');
  assert.equal(resolveEffectiveRole({
    email: 'no-claim-admin@example.test', emailVerified: true, claims: {},
    profileRole: 'admin', allowedEmails,
  }), 'volunteer');
  assert.equal(resolveEffectiveRole({
    email: allowedEmails[0], emailVerified: true, claims: { admin: true },
    profileRole: 'volunteer', allowedEmails,
  }), 'volunteer');

  await assertSucceeds(getDoc(doc(approvedAdmin, 'admin-data/health')));
  await assertSucceeds(setDoc(doc(approvedAdmin, 'model_benchmarks/latest'), { status: 'ok' }));
  await assertSucceeds(setDoc(doc(secondaryAdmin, 'admin-data/secondary-admin-check'), { status: 'ok' }));
  await assertFails(getDoc(doc(unverifiedAdmin, 'admin-data/health')));
  await assertFails(getDoc(doc(noClaimAdmin, 'admin-data/health')));
  await assertFails(getDoc(doc(mismatchedProfile, 'admin-data/health')));

  console.log('PASS: approved primary and secondary admins can access protected collections; invalid role states are denied.');
} finally {
  await testEnv.cleanup();
}
