import { MASTER_DIRECTORY, type EmployeeDirectory } from '@/lib/employee-directory';
import type { DirectoryUnavailableReason, Site } from '@/lib/types';

export type DirectoryMode = 'supabase' | 'sheet' | 'unavailable';
export type SafexBootstrap = {
  ready: boolean; sites: Site[]; companyName: string | null; directory: EmployeeDirectory;
  directoryMode: DirectoryMode; employeeCount: number; degraded: boolean;
  directoryReason: DirectoryUnavailableReason | null;
};

// A clearly labelled local placeholder makes the worker screens navigable without a backend.
const PREVIEW: SafexBootstrap = {
  ready: true, sites: [{ id: 'preview', name: 'Preview site', region: 'UI preview', sosNumber: null }],
  companyName: 'Safex', directory: MASTER_DIRECTORY, directoryMode: 'unavailable',
  employeeCount: 0, degraded: false, directoryReason: null
};
export function useSafexBootstrap(): SafexBootstrap { return PREVIEW; }
