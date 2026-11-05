import type { ReportSubmission } from '../app/components/ReportWorkflow';

/** A local queue is not a confirmed report. The server must use id as an idempotency key. */
export type QueuedReport = {
  id: string;
  tenantId: string;
  siteId: string;
  createdAt: string;
  report: ReportSubmission;
};

/** Resolve only after durable server acceptance; reject or return false to keep the report. */
export type ReportSender = (entry: QueuedReport) => Promise<boolean>;

const DB_NAME = 'safex-offline-report-queue';
const STORE = 'reports';

function openQueue(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('Offline storage is unavailable on this device. Your report was not saved.')); return; }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: 'id' }); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open offline report storage.'));
    request.onblocked = () => reject(new Error('Offline report storage is blocked. Your report was not saved.'));
  });
}

async function transact<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openQueue();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(STORE, mode);
      const request = operation(transaction.objectStore(STORE));
      let result: T;
      request.onsuccess = () => { result = request.result; };
      transaction.oncomplete = () => resolve(result);
      transaction.onabort = () => reject(transaction.error ?? new Error('Offline storage failed.'));
      transaction.onerror = () => reject(transaction.error ?? new Error('Offline storage failed.'));
    });
  } finally { db.close(); }
}

export async function queueReport(tenantId: string, siteId: string, report: ReportSubmission): Promise<QueuedReport> {
  if (!tenantId.trim() || !siteId.trim()) throw new Error('A company and site must be selected before saving a report.');
  if (typeof crypto === 'undefined' || typeof crypto.randomUUID !== 'function') throw new Error('Secure report IDs are unavailable. Your report was not saved.');
  const entry: QueuedReport = {
    id: crypto.randomUUID(), tenantId, siteId, createdAt: new Date().toISOString(),
    report: { ...report, employee: report.anonymous ? null : report.employee }
  };
  try { await transact('readwrite', (store) => store.add(entry)); }
  catch { throw new Error('Could not save the report on this device. Check storage space and try again.'); }
  return entry;
}

export async function pendingReports(tenantId: string): Promise<QueuedReport[]> {
  const all = await transact<QueuedReport[]>('readonly', (store) => store.getAll());
  return all.filter((entry) => entry.tenantId === tenantId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Call while the app is open on startup and when online. No records are removed on failure. */
export async function syncQueuedReports(tenantId: string, send: ReportSender): Promise<void> {
  for (const entry of await pendingReports(tenantId)) {
    try {
      if (await send(entry) !== true) return;
      await transact('readwrite', (store) => store.delete(entry.id));
    } catch { return; }
  }
}
