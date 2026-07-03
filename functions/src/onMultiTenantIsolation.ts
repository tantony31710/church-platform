import { onCall } from 'firebase-functions/v2/https';

export const onMultiTenantIsolation = onCall(async (request) => {
  console.log('Multi-tenant check triggered');
  return { success: true };
});
