import type { Employee } from './types';
export type DirectoryMode = 'master';
export type EmployeeDirectory = {
  mode: DirectoryMode; minQueryLength: number;
  search(siteId: string, query: string, signal?: AbortSignal): Promise<Employee[]>;
  findByEmployeeNo(siteId: string, employeeNo: string, signal?: AbortSignal): Promise<Employee | null>;
};
// No real employee records are available in the UI-only preview.
export const MASTER_DIRECTORY: EmployeeDirectory = {
  mode: 'master', minQueryLength: 2,
  async search() { throw new Error('Employee directory is not connected in the UI preview.'); },
  async findByEmployeeNo() { throw new Error('Employee directory is not connected in the UI preview.'); }
};
