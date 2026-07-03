import { onDocumentCreated } from 'firebase-functions/v2/firestore';

export const onTrainingTriggers = onDocumentCreated('models/{modelId}/training_requests/{requestId}', async (event) => {
  console.log('Training triggered');
});
