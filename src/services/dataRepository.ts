import type { Mutation, SyncReceipt } from '../domain/sync';
import type { GeoPoint, GeoPolygon } from '../domain/entities';
import { supabase } from './supabase';
export function point(g?: GeoPoint) {
  if (!g) return null;
  if (!Number.isFinite(g.lat) || !Number.isFinite(g.lng) || Math.abs(g.lat) > 90 || Math.abs(g.lng) > 180) throw new Error('Localização inválida.');
  return { type: 'Point', coordinates: [g.lng, g.lat] };
}
export function polygon(g: GeoPolygon) {
  if (!g || g.coordinates.length < 3) throw new Error('Desenhe um contorno válido.');
  const ring = g.coordinates.map(([lat, lng]) => point({ lat, lng })!.coordinates);
  if (ring[0][0] !== ring.at(-1)![0] || ring[0][1] !== ring.at(-1)![1]) ring.push([...ring[0]]);
  return { type: 'Polygon', coordinates: [ring] };
}
export function mapMutation(m: Mutation): Record<string, unknown> {
  const p = m.payload;
  switch (m.entity) {
    case 'producer_profile': return { id: p.id, device_session_id: p.deviceSessionId, display_name: p.displayName, created_at: p.createdAt };
    case 'property': return { id: p.id, producer_id: p.producerId, name: p.name, activity_profile: p.activityProfile, centroid: point(p.centroid as GeoPoint), created_at: p.createdAt };
    case 'plot': return { id: p.id, property_id: p.propertyId, name: p.name, geometry: polygon(p.geometry as GeoPolygon), active: p.active, created_at: p.createdAt };
    case 'crop_cycle': return { id: p.id, plot_id: p.plotId, crop_type: p.cropType, subtype: p.subtype ?? null, cultivar: p.cultivar ?? null, start_date: p.startDate, end_date: p.endDate ?? null, metadata: p.metadata ?? {} };
    case 'field_event': return { id: p.id, plot_id: p.plotId, client_generated_id: p.clientGeneratedId || p.id, type: p.type, occurred_at: p.occurredAt, geometry: point(p.geometry as GeoPoint), payload: p.payload, created_at: p.createdAt };
  }
}
export async function sendMutation(m: Mutation): Promise<SyncReceipt> {
  if (!supabase) throw new Error('Conexão de dados indisponível.');
  const { data, error } = await supabase.rpc('sync_mutation', { mutation_id: m.id, entity: m.entity, payload: mapMutation(m) });
  if (error) throw new Error('Não foi possível enviar seus dados. Eles continuam salvos neste aparelho.');
  const receipt = data as SyncReceipt;
  if (!receipt || receipt.mutation_id !== m.id || receipt.entity_id !== m.payload.id || !Number.isFinite(Date.parse(receipt.committed_at))) throw new Error('O banco ainda não confirmou o envio.');
  return receipt;
}
