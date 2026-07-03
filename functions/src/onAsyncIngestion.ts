import { onTaskQueuePolled } from 'firebase-functions/v2/tasks';

export const onAsyncIngestion = onTaskQueuePolled(async (event) => {
  console.log('Async ingestion triggered');
});
