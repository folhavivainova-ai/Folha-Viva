import type { SyncStatus } from '../../domain/sync';
import { useOnlineStatus } from './useOnlineStatus';
export function OfflineIndicator({ pendingMutationsCount = 0, status, onRetry }: {
  pendingMutationsCount?: number; status: SyncStatus; onRetry: () => void;
}) {
  const online = useOnlineStatus();
  const labels = { local: 'Salvo neste aparelho', offline: 'Modo Campo', syncing: 'Enviando…', pending: 'Envio pendente', synced: 'Sincronizado', error: 'Envio pendente' };
  return <div className="flex flex-wrap items-center gap-2 text-xs" role="status" aria-live="polite">
    <span>{!online ? 'Modo Campo' : labels[status.phase]}{pendingMutationsCount > 0 ? ` (${pendingMutationsCount})` : ''}</span>
    {online && ['error', 'pending'].includes(status.phase) && <button className="min-h-11 underline" onClick={onRetry}>Tentar novamente</button>}
    {status.message && <span className="max-w-64 text-amber-900">{status.message}</span>}
  </div>;
}
