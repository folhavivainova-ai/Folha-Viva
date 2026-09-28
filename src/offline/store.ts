/**
 * Armazenamento Offline e Fila de Mutações Idempotente (Volume 02-E01, Volume 14)
 * Persiste localmente a identidade invisível, produtor, propriedades, talhões e eventos.
 * Sem dados fictícios iniciais.
 */

import { ProducerProfile, Property, Plot, CropCycle, FieldEvent } from '../domain/entities';

const STORAGE_KEYS = {
  DEVICE_SESSION: 'agro_device_session_id',
  PRODUCER: 'agro_producer_profile',
  PROPERTIES: 'agro_properties',
  PLOTS: 'agro_plots',
  EVENTS: 'agro_field_events',
  MUTATION_QUEUE: 'agro_mutation_queue',
  LAST_SYNC: 'agro_last_sync_timestamp',
};

export interface Mutation {
  id: string; // client_generated_id
  entity: 'property' | 'plot' | 'field_event' | 'crop_cycle';
  action: 'insert' | 'update' | 'delete';
  payload: Record<string, unknown>;
  timestamp: string;
  status: 'pending' | 'synced' | 'failed';
  retryCount: number;
}

// Utilitário para gerar UUID v4 no navegador
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Identidade Técnica Invisível (V02-E01)
export function getOrCreateDeviceSessionId(): string {
  let sessionId = localStorage.getItem(STORAGE_KEYS.DEVICE_SESSION);
  if (!sessionId) {
    sessionId = `dev_${generateUUID()}`;
    localStorage.setItem(STORAGE_KEYS.DEVICE_SESSION, sessionId);
  }
  return sessionId;
}

export class OfflineStore {
  // Obter perfil do produtor cadastrado
  static getProducerProfile(): ProducerProfile | null {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCER);
    return data ? JSON.parse(data) : null;
  }

  // Salvar perfil do produtor
  static saveProducerProfile(data: { displayName: string; cpf?: string; phone?: string } | string): ProducerProfile {
    const displayName = typeof data === 'string' ? data : data.displayName;
    const cpf = typeof data === 'object' ? data.cpf : undefined;
    const phone = typeof data === 'object' ? data.phone : undefined;

    const deviceSessionId = getOrCreateDeviceSessionId();
    const existing = this.getProducerProfile();
    const profile: ProducerProfile = {
      id: existing ? existing.id : generateUUID(),
      deviceSessionId,
      displayName: displayName.trim(),
      cpf: cpf?.trim(),
      phone: phone?.trim(),
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.PRODUCER, JSON.stringify(profile));
    this.enqueueMutation('insert', 'property', profile as unknown as Record<string, unknown>);
    return profile;
  }

  // Definir perfil do produtor e restaurar dados ao logar por CPF
  static setProducerProfile(profile: ProducerProfile): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCER, JSON.stringify(profile));
  }

  static restoreSessionData(data: {
    producer: ProducerProfile;
    properties: Property[];
    plots: Plot[];
    events: FieldEvent[];
  }): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCER, JSON.stringify(data.producer));
    localStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(data.properties));
    localStorage.setItem(STORAGE_KEYS.PLOTS, JSON.stringify(data.plots));
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(data.events));
  }

  // Obter propriedades do produtor (Array vazio por padrão, sem dados fictícios)
  static getProperties(): Property[] {
    const data = localStorage.getItem(STORAGE_KEYS.PROPERTIES);
    return data ? JSON.parse(data) : [];
  }

  // Salvar nova propriedade
  static saveProperty(property: Property): void {
    const properties = this.getProperties();
    const existingIdx = properties.findIndex((p) => p.id === property.id);
    if (existingIdx >= 0) {
      properties[existingIdx] = property;
    } else {
      properties.push(property);
    }
    localStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(properties));
    this.enqueueMutation('insert', 'property', property as unknown as Record<string, unknown>);
  }

  // Obter talhões da propriedade
  static getPlots(propertyId?: string): Plot[] {
    const data = localStorage.getItem(STORAGE_KEYS.PLOTS);
    const plots: Plot[] = data ? JSON.parse(data) : [];
    if (propertyId) {
      return plots.filter((p) => p.propertyId === propertyId);
    }
    return plots;
  }

  // Salvar talhão
  static savePlot(plot: Plot): void {
    const plots = this.getPlots();
    const existingIdx = plots.findIndex((p) => p.id === plot.id);
    if (existingIdx >= 0) {
      plots[existingIdx] = plot;
    } else {
      plots.push(plot);
    }
    localStorage.setItem(STORAGE_KEYS.PLOTS, JSON.stringify(plots));
    this.enqueueMutation('insert', 'plot', plot as unknown as Record<string, unknown>);
  }

  // Obter eventos de campo
  static getFieldEvents(plotId?: string): FieldEvent[] {
    const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
    const events: FieldEvent[] = data ? JSON.parse(data) : [];
    if (plotId) {
      return events.filter((e) => e.plotId === plotId);
    }
    return events;
  }

  // Registrar evento de campo
  static saveFieldEvent(event: FieldEvent): void {
    const events = this.getFieldEvents();
    events.unshift(event); // mais recente primeiro
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    this.enqueueMutation('insert', 'field_event', event as unknown as Record<string, unknown>);
  }

  // Fila de Mutações Idempotente (V14-E02)
  static getMutationQueue(): Mutation[] {
    const data = localStorage.getItem(STORAGE_KEYS.MUTATION_QUEUE);
    return data ? JSON.parse(data) : [];
  }

  static enqueueMutation(action: Mutation['action'], entity: Mutation['entity'], payload: Record<string, unknown>): void {
    const queue = this.getMutationQueue();
    const mutation: Mutation = {
      id: generateUUID(),
      entity,
      action,
      payload,
      timestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    };
    queue.push(mutation);
    localStorage.setItem(STORAGE_KEYS.MUTATION_QUEUE, JSON.stringify(queue));
  }

  static clearDatabase(): void {
    localStorage.removeItem(STORAGE_KEYS.PRODUCER);
    localStorage.removeItem(STORAGE_KEYS.PROPERTIES);
    localStorage.removeItem(STORAGE_KEYS.PLOTS);
    localStorage.removeItem(STORAGE_KEYS.EVENTS);
    localStorage.removeItem(STORAGE_KEYS.MUTATION_QUEUE);
    localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
  }
}
