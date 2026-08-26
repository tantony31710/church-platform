import { onTaskDispatched } from 'firebase-functions/v2/tasks';

export const onAsyncIngestion = onTaskDispatched(async (request) => {
  console.log('Async ingestion triggered', {
    payload: request.data || null,
  });
});
