import { onCall } from 'firebase-functions/v2/https';

export const onCachingLayer = onCall(async (request) => {
  console.log('Cache invalidation/read triggered');
  return { success: true };
});
