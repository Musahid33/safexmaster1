import type { ReportType } from './types';

/** Report types that offer the anonymous UI option. */
export function supportsAnonymousReporting(type: ReportType): boolean {
  return type === 'Speak Up' || type === 'Grievance' || type === 'Feedback';
}
