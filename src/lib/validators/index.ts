/**
 * Validators Index
 * Single export point for all validators
 */

import { DataSanitizer } from './data-sanitizer';

export {
  validateEmail
} from './email-validator';

export {
  validateCompany
} from './company-validator';

export {
  validateJob,
  validateJobBatch,
  type JobValidationResult
} from './job-validator';

export {
  DataSanitizer
} from './data-sanitizer';

// Convenience exports
export const sanitizeData = (data: Record<string, unknown>) => DataSanitizer.sanitizeJobData(data);
export const sanitizeJob = (data: Record<string, unknown>) => DataSanitizer.sanitizeJobData(data);
export const sanitizeCompany = (data: Record<string, unknown>) => DataSanitizer.sanitizeCompanyData(data);
export const sanitizeString = (text: string) => DataSanitizer.sanitizeText(text);
