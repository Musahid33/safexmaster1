'use client';

import { MASTER_DIRECTORY, type EmployeeDirectory } from '@/lib/employee-directory';
import type { DirectoryUnavailableReason, Site } from '@/lib/types';

export type DirectoryMode = 'supabase' | 'sheet' | 'unavailable';
export type SafexBootstrap = {
  ready: boolean; tenantId: string | null; companySlug: string | null; sites: Site[]; companyName: string | null; directory: EmployeeDirectory;
  directoryMode: DirectoryMode; employeeCount: number; degraded: boolean;
  directoryReason: DirectoryUnavailableReason | null;
};

/**
 * UI-only preview state. No backend is connected: the company, sites, directory and content
 * all come from the local demo fixture until a tenant data source is added back.
 * The shape is unchanged so connecting a real source later is a one-file change.
 */
const PREVIEW: SafexBootstrap = {
  ready: true, tenantId: null, companySlug: null, sites: [],
  companyName: null, directory: MASTER_DIRECTORY, directoryMode: 'unavailable',
  employeeCount: 0, degraded: false, directoryReason: null
};

export function useSafexBootstrap(): SafexBootstrap {
  return PREVIEW;
}
