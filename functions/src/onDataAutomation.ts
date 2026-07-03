import { onDocumentCreated } from 'firebase-functions/v2/firestore';

export const onDataAutomation = onDocumentCreated('raw_data/{dataId}', async (event) => {
  console.log('Data automation triggered');
});
