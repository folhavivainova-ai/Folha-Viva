import 'fake-indexeddb/auto';
import { deleteDB } from 'idb';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OfflineStore } from './store';
const storage = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => storage.get(k) ?? null, setItem: (k: string,v: string) => storage.set(k,v), removeItem: (k: string) => storage.delete(k) });
beforeEach(async () => { storage.clear(); await deleteDB('folha-viva'); });
const producer = { id: crypto.randomUUID(), deviceSessionId: 'dev-test', displayName: 'Produtor', createdAt: new Date().toISOString() };
const property = { id: crypto.randomUUID(), producerId: producer.id, name: 'Propriedade', activityProfile: 'coffee' as const, createdAt: producer.createdAt, updatedAt: producer.createdAt };
describe('dados locais e outbox', () => {
  it('grava cadastro e fila juntos e retoma depois de reinicializar', async () => {
    await OfflineStore.initialize(); await OfflineStore.saveRegistration(producer, property); await OfflineStore.initialize();
    const s = await OfflineStore.snapshot(); expect(s.producer).toEqual(producer); expect(s.properties).toEqual([property]); expect(s.queue.map(m=>m.entity)).toEqual(['producer_profile','property']);
  });
  it('importa legado com produtor correto e ciclo separado, uma única vez', async () => {
    const plot = { id: crypto.randomUUID(), propertyId: property.id, name: 'Talhão', cropCycle: { id: crypto.randomUUID(), plotId: 'plot', cropType: 'coffee' } };
    storage.set('agro_producer_profile', JSON.stringify(producer)); storage.set('agro_properties', JSON.stringify([property])); storage.set('agro_plots', JSON.stringify([plot]));
    await OfflineStore.initialize(); await OfflineStore.initialize();
    expect((await OfflineStore.snapshot()).queue.map(m=>m.entity)).toEqual(['producer_profile','property','plot','crop_cycle']);
    expect(storage.has('agro_producer_profile')).toBe(true);
  });
  it('não cria estado vazio sobre legado corrompido', async () => {
    storage.set('agro_producer_profile', '{invalido'); await expect(OfflineStore.initialize()).rejects.toThrow();
    expect(storage.get('agro_producer_profile')).toBe('{invalido');
  });
  it('recusa transferência silenciosa da identidade', async () => {
    await OfflineStore.initialize(); await OfflineStore.bindIdentity('a',true);
    await expect(OfflineStore.bindIdentity('b',true)).rejects.toThrow('sessão mudou');
    expect((await OfflineStore.snapshot()).identity.ownerSubject).toBe('a');
  });
  it('mantém falha e backoff após reinício; só confirma com recibo', async () => {
    await OfflineStore.initialize(); await OfflineStore.saveRegistration(producer,property);
    const id = (await OfflineStore.snapshot()).queue[0].id;
    await OfflineStore.fail(id,'Sem conexão'); await OfflineStore.initialize();
    const m = (await OfflineStore.snapshot()).queue[0]; expect(m.status).toBe('failed'); expect(m.nextAttemptAt).toBeGreaterThan(Date.now());
    await OfflineStore.acknowledge(id,'2026-10-11T12:00:00Z'); expect((await OfflineStore.snapshot()).queue[0].status).toBe('synced');
  });
});
