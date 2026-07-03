import { initializeApp } from 'firebase-admin/app';

initializeApp();

export { onTaskCompleted } from './onTaskCompleted';
export { onTaskRecurrence } from './onTaskRecurrence';
export { onTaskDependencyCheck } from './onTaskDependencyCheck';
export { onAttendanceMarked } from './onAttendanceMarked';
export { onModelBenchmarking } from './onModelBenchmarking';
export { onAsyncIngestion } from './onAsyncIngestion';
export { onTrainingTriggers } from './onTrainingTriggers';
export { onEdgePreProcessing } from './onEdgePreProcessing';
export { onMultiTenantIsolation } from './onMultiTenantIsolation';
export { onInsightReporter } from './onInsightReporter';
export { onPredictiveAlerting } from './onPredictiveAlerting';
export { onDataAutomation } from './onDataAutomation';
export { onModelApiManagement } from './onModelApiManagement';
export { onAuditLogging } from './onAuditLogging';
export { onCachingLayer } from './onCachingLayer';
