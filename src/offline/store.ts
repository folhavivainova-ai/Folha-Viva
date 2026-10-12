import { openDB } from 'idb';
import type { ProducerProfile, Property, Plot, CropCycle, FieldEvent } from '../domain/entities';
import type { InvisibleIdentity, Mutation, SyncEntity } from '../domain/sync';
export type { Mutation } from '../domain/sync';

export function generateUUID(): string { return crypto.randomUUID(); }
export function getOrCreateDeviceSessionId(): string {
  let id = localStorage.getItem('agro_device_session_id');
  if (!id) { id = `dev_${generateUUID()}`; localStorage.setItem('agro_device_session_id', id); }
  return id;
}
interface State {
  version: 1;
  identity: InvisibleIdentity;
  producer: ProducerProfile | null;
  properties: Property[];
  plots: Plot[];
  cycles: CropCycle[];
  events: FieldEvent[];
  queue: Mutation[];
  lastSync?: string;
}
const db = () => openDB('folha-viva', 1, { upgrade(db) { db.createObjectStore('state'); } });
const changed = () => { if (typeof window !== 'undefined') window.dispatchEvent(new Event('folha-store-changed')); };
function enqueue(s: State, entity: SyncEntity, payload: object) {
  s.queue.push({ id: generateUUID(), entity, action: 'insert', payload: payload as Record<string, unknown>, timestamp: new Date().toISOString(), status: 'pending', retryCount: 0 });
}
function upsert<T extends { id: string }>(rows: T[], row: T) {
  const index = rows.findIndex(r => r.id === row.id);
  if (index < 0) rows.push(row); else rows[index] = row;
}
function putPlot(s: State, plot: Plot) {
  upsert(s.plots, plot); enqueue(s, 'plot', plot);
  if (plot.cropCycle) { upsert(s.cycles, plot.cropCycle); enqueue(s, 'crop_cycle', plot.cropCycle); }
}
async function edit<T>(fn: (s: State) => T): Promise<T> {
  const database = await db();
  try {
    const tx = database.transaction('state', 'readwrite');
    const s = await tx.store.get('current') as State;
    const result = fn(s);
    await tx.store.put(s, 'current'); await tx.done; changed(); return result;
  } finally { database.close(); }
}
export class OfflineStore {
  static async initialize() {
    const database = await db();
    try {
      const tx = database.transaction('state', 'readwrite');
      if (!(await tx.store.get('current'))) {
        // Falha de JSON aborta a importação; legado permanece intacto para recuperação.
        const legacy = <T>(key: string, fallback: T): T => JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
        const producer = legacy<ProducerProfile | null>('agro_producer_profile', null);
        const properties = legacy<Property[]>('agro_properties', []);
        const plots = legacy<Plot[]>('agro_plots', []);
        const events = legacy<FieldEvent[]>('agro_field_events', []);
        const s: State = { version: 1, identity: { deviceSessionId: getOrCreateDeviceSessionId(), ownerSubject: null, state: 'local' }, producer, properties, plots, cycles: [], events, queue: [] };
        // A fila antiga nunca foi enviada. Reconstruir em ordem e corrigir produtor como propriedade.
        if (producer) enqueue(s, 'producer_profile', producer);
        properties.forEach(p => enqueue(s, 'property', p));
        plots.forEach(p => { enqueue(s, 'plot', p); if (p.cropCycle) { s.cycles.push(p.cropCycle); enqueue(s, 'crop_cycle', p.cropCycle); } });
        events.forEach(e => enqueue(s, 'field_event', e));
        await tx.store.put(s, 'current');
      }
      await tx.done;
    } finally { database.close(); }
  }
  static async snapshot(): Promise<State> {
    const database = await db();
    try { return await database.get('state', 'current') as State; } finally { database.close(); }
  }
  static async saveRegistration(producer: ProducerProfile, property: Property, plot?: Plot) {
    if (!producer.displayName.trim() || !property.name.trim()) throw new Error('Preencha seu nome e o da propriedade.');
    await edit(s => { s.producer = producer; upsert(s.properties, property); enqueue(s, 'producer_profile', producer); enqueue(s, 'property', property); if (plot) putPlot(s, plot); });
  }
  static async savePlot(plot: Plot) { await edit(s => putPlot(s, plot)); }
  static async saveFieldEvent(event: FieldEvent) {
    await edit(s => { if (!s.events.some(e => e.id === event.id)) { s.events.unshift(event); enqueue(s, 'field_event', event); } });
  }
  static async bindIdentity(ownerSubject: string, anonymous: boolean) {
    await edit(s => {
      if (s.identity.ownerSubject && s.identity.ownerSubject !== ownerSubject) throw new Error('A sessão mudou. Seus dados locais foram preservados; recupere a conta original para enviar.');
      s.identity.ownerSubject = ownerSubject; s.identity.state = anonymous ? 'anonymous' : 'linked';
    });
  }
  static async acknowledge(id: string, committedAt: string) {
    await edit(s => { const m = s.queue.find(m => m.id === id); if (m) { m.status = 'synced'; delete m.error; } s.lastSync = committedAt; });
  }
  static async fail(id: string, message: string) {
    await edit(s => { const m = s.queue.find(m => m.id === id); if (m) { m.status = 'failed'; m.retryCount++; m.error = message; m.nextAttemptAt = Date.now() + Math.min(300000, 1000 * 2 ** Math.min(m.retryCount, 8)); } });
  }
  static async clearDatabase() {
    await edit(s => { s.producer = null; s.properties = []; s.plots = []; s.cycles = []; s.events = []; s.queue = []; delete s.lastSync; });
    ['agro_producer_profile','agro_properties','agro_plots','agro_field_events','agro_mutation_queue','agro_last_sync_timestamp'].forEach(k => localStorage.removeItem(k));
  }
}
