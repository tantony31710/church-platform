import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';

const db = getFirestore();

// Automatically handle recurring tasks
export const onTaskRecurrence = onDocumentUpdated('tasks/{taskId}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;

  const justCompleted = before.status !== 'completed' && after.status === 'completed';
  if (justCompleted && after.recurrence) {
    logger.info(`Task ${event.params.taskId} completed. Handling recurrence: ${after.recurrence}`);
    
    // Logic to calculate next due date based on recurrence string
    // e.g., "weekly", "daily", "monthly"
    // Create new task with same details, updated deadline
    
    const newTask = {
        ...after,
        status: 'open',
        assignedTo: null,
        completedAt: null,
        createdAt: Timestamp.now(),
        deadline: /* Calculated next deadline */ Timestamp.now()
    };
    // Remove completedAt, id (let firestore auto-generate)
    delete (newTask as any).completedAt;
    
    await db.collection('tasks').add(newTask);
  }
});
