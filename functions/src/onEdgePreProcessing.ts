import { onDocumentWritten } from 'firebase-functions/v2/firestore';

export const onEdgePreProcessing = onDocumentWritten('raw_data/{dataId}', async (event) => {
  console.log('Edge preprocessing triggered');
});
