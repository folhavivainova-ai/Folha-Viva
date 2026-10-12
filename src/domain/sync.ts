export type SyncEntity = 'producer_profile' | 'property' | 'plot' | 'crop_cycle' | 'field_event';
export interface Mutation {
  id: string;
  entity: SyncEntity;
  action: 'insert' | 'update';
  payload: Record<string, unknown>;
  timestamp: string;
  status: 'pending' | 'synced' | 'failed';
  retryCount: number;
  nextAttemptAt?: number;
  error?: string;
}
export interface InvisibleIdentity {
  deviceSessionId: string;
  ownerSubject: string | null;
  state: 'local' | 'anonymous' | 'linked' | 'recovery_required';
}
export interface SyncReceipt { mutation_id: string; entity_id: string; committed_at: string }
export type SyncPhase = 'local' | 'offline' | 'syncing' | 'pending' | 'synced' | 'error';
export interface SyncStatus { phase: SyncPhase; message?: string; lastSync?: string }
