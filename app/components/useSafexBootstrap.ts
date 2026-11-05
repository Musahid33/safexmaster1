import { MASTER_DIRECTORY, type EmployeeDirectory } from '@/lib/employee-directory';
import type { DirectoryUnavailableReason, Site } from '@/lib/types';

export type DirectoryMode = 'supabase' | 'sheet' | 'unavailable';
export type SafexBootstrap = {
  ready: boolean; tenantId: string | null; sites: Site[]; companyName: string | null; directory: EmployeeDirectory;
  directoryMode: DirectoryMode; employeeCount: number; degraded: boolean;
  directoryReason: DirectoryUnavailableReason | null;
};

// UI-only state: a future tenant data source must supply the company and site list.
const PREVIEW: SafexBootstrap = {
  ready: true, tenantId: null, sites: [],
  companyName: null, directory: MASTER_DIRECTORY, directoryMode: 'unavailable',
  employeeCount: 0, degraded: false, directoryReason: null
};
export function useSafexBootstrap(): SafexBootstrap { return PREVIEW; }
