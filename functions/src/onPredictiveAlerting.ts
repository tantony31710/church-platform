import { onDocumentUpdated } from 'firebase-functions/v2/firestore';

export const onPredictiveAlerting = onDocumentUpdated('metrics/{metricId}', async (event) => {
  console.log('Predictive alert check');
});
