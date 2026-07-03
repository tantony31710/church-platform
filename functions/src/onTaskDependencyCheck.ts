import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';

const db = getFirestore();

// Check if task dependencies are met
export const onTaskDependencyCheck = onDocumentUpdated('tasks/{taskId}', async (event) => {
  const after = event.data?.after.data();
  if (!after || !after.dependsOn || after.dependsOn.length === 0) return;

  const dependencies = after.dependsOn;
  
  // Check if all dependencies are completed
  const depsRef = db.collection('tasks').where('id', 'in', dependencies);
  const depsSnap = await depsRef.get();
  
  const allCompleted = depsSnap.docs.every(doc => doc.data().status === 'completed');
  
  if (!allCompleted) {
    logger.warn(`Task ${event.params.taskId} depends on incomplete tasks.`);
    // Here we could add logic to notify the volunteer or prevent assignment
  }
});
