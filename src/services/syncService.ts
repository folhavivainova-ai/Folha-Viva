import { OfflineStore } from '../offline/store';
import { ensureIdentity } from './identity';
import { sendMutation } from './dataRepository';
import { supabase } from './supabase';
import type { SyncStatus } from '../domain/sync';
let running: Promise<void> | null = null;
let status: SyncStatus = { phase: 'local' };
export const getSyncStatus = () => status;
function publish(next: SyncStatus) { status = next; if (typeof window !== 'undefined') window.dispatchEvent(new Event('folha-sync-changed')); }
export function synchronize(force = false): Promise<void> {
  if (running) return running;
  running = (async () => {
    if (!supabase) { publish({ phase: 'local' }); return; }
    if (!navigator.onLine) { publish({ phase: 'offline' }); return; }
    try {
      publish({ phase: 'syncing' }); await ensureIdentity();
      const queue = (await OfflineStore.snapshot()).queue.filter(m => m.status !== 'synced');
      // Ordem de gravação preserva dependências; erro no pai interrompe os filhos.
      for (const m of queue) {
        if (!force && m.nextAttemptAt && m.nextAttemptAt > Date.now()) { publish({ phase: 'pending' }); return; }
        try { const receipt = await sendMutation(m); await OfflineStore.acknowledge(m.id, receipt.committed_at); }
        catch (error) { await OfflineStore.fail(m.id, error instanceof Error ? error.message : 'Envio pendente.'); throw error; }
      }
      const s = await OfflineStore.snapshot();
      publish({ phase: s.lastSync ? 'synced' : 'pending', lastSync: s.lastSync });
    } catch (error) { publish({ phase: 'error', message: error instanceof Error ? error.message : 'Não foi possível enviar. Tente novamente.' }); }
  })().finally(() => { running = null; });
  return running;
}
export function startSynchronization() {
  const run = () => { void synchronize(); };
  window.addEventListener('online', run);
  // Escritas locais também acionam; recibos não geram um segundo envio concorrente.
  window.addEventListener('folha-store-changed', run);
  const timer = window.setInterval(run, 30000);
  run();
  return () => { clearInterval(timer); window.removeEventListener('online', run); window.removeEventListener('folha-store-changed', run); };
}
