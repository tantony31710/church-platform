import { onDocumentWritten } from 'firebase-functions/v2/firestore';

export const onAuditLogging = onDocumentWritten('{collection}/{docId}', async (event) => {
  console.log('Audit log entry created');
});
