import { onSchedule } from 'firebase-functions/v2/scheduler';

export const onInsightReporter = onSchedule('every 24 hours', async (event) => {
  console.log('Insight reporter triggered');
});
