/**
 * Sincronização com o Banco de Dados Firestore (Volume 14)
 * Envia as mutações da fila local e carrega dados remotos para garantir persistência contínua.
 */

import { doc, setDoc, getDoc, collection, getDocs, getDocFromServer } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { OfflineStore, Mutation } from '../offline/store';
import { ProducerProfile, Property, Plot, FieldEvent } from '../domain/entities';
import { stripNonDigits } from '../utils/cpfValidator';

export class FirestoreSyncService {
  private static isSyncing = false;

  /**
   * Testa conectividade com o Firestore
   */
  static async testConnection(): Promise<boolean> {
    try {
      await getDocFromServer(doc(db, '_connection_test', 'status'));
      return true;
    } catch (err: any) {
      if (err?.code === 'not-found' || !err?.message?.includes('the client is offline')) {
        return true;
      }
      return false;
    }
  }

  /**
   * Procura produtor por CPF no Firestore (e localmente) para login sem senha
   */
  static async findProducerByCPF(cpfInput: string): Promise<{
    producer: ProducerProfile;
    properties: Property[];
    plots: Plot[];
    events: FieldEvent[];
  } | null> {
    const cleanInput = stripNonDigits(cpfInput);
    if (cleanInput.length !== 11) return null;

    // 1. Tentar encontrar localmente primeiro (resiliência offline)
    const localProducer = OfflineStore.getProducerProfile();
    if (localProducer?.cpf && stripNonDigits(localProducer.cpf) === cleanInput) {
      return {
        producer: localProducer,
        properties: OfflineStore.getProperties(),
        plots: OfflineStore.getPlots(),
        events: OfflineStore.getFieldEvents(),
      };
    }

    // 2. Consultar o banco Firestore na nuvem
    try {
      const producersSnap = await getDocs(collection(db, 'producers'));
      let foundProducer: ProducerProfile | null = null;

      producersSnap.forEach((docSnap) => {
        const data = docSnap.data() as ProducerProfile;
        if (data.cpf && stripNonDigits(data.cpf) === cleanInput) {
          foundProducer = { ...data, id: docSnap.id };
        }
      });

      if (!foundProducer) {
        return null;
      }

      // Carregar propriedades, talhões e eventos do produtor encontrado
      const remoteData = await this.loadRemoteData((foundProducer as ProducerProfile).id);

      return {
        producer: foundProducer,
        properties: remoteData.properties,
        plots: remoteData.plots,
        events: remoteData.events,
      };
    } catch (err) {
      console.warn('Erro ao buscar CPF no Firestore:', err);
      // Se estiver offline e o CPF bater com o local
      if (localProducer?.cpf && stripNonDigits(localProducer.cpf) === cleanInput) {
        return {
          producer: localProducer,
          properties: OfflineStore.getProperties(),
          plots: OfflineStore.getPlots(),
          events: OfflineStore.getFieldEvents(),
        };
      }
      return null;
    }
  }

  /**
   * Sincroniza a fila de mutações locais com o Firestore
   */
  static async drainMutationQueue(): Promise<number> {
    if (this.isSyncing) return 0;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return 0;

    this.isSyncing = true;
    const queue = OfflineStore.getMutationQueue();
    const remaining: Mutation[] = [];
    let syncedCount = 0;

    for (const mutation of queue) {
      if (mutation.status === 'synced') continue;

      try {
        if (mutation.entity === 'property') {
          const prop = mutation.payload as unknown as Property;
          if (prop?.id) {
            await setDoc(doc(db, 'properties', prop.id), {
              id: prop.id,
              producerId: prop.producerId || 'anonymous',
              name: prop.name || 'Propriedade',
              activityProfile: prop.activityProfile || 'coffee',
              centroid: prop.centroid || null,
              createdAt: prop.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            syncedCount++;
          }
        } else if (mutation.entity === 'plot') {
          const plot = mutation.payload as unknown as Plot;
          if (plot?.id) {
            await setDoc(doc(db, 'plots', plot.id), {
              id: plot.id,
              propertyId: plot.propertyId,
              name: plot.name,
              areaHa: Number(plot.areaHa || 0),
              active: Boolean(plot.active),
              geometry: plot.geometry || null,
              cropCycle: plot.cropCycle || null,
              createdAt: plot.createdAt || new Date().toISOString(),
            });
            syncedCount++;
          }
        } else if (mutation.entity === 'field_event') {
          const evt = mutation.payload as unknown as FieldEvent;
          if (evt?.id) {
            await setDoc(doc(db, 'field_events', evt.id), {
              id: evt.id,
              plotId: evt.plotId,
              type: evt.type,
              occurredAt: evt.occurredAt || new Date().toISOString(),
              payload: evt.payload || {},
              createdAt: evt.createdAt || new Date().toISOString(),
            });
            syncedCount++;
          }
        }
      } catch (error) {
        console.warn('Erro ao sincronizar mutação para Firestore:', error);
        mutation.retryCount = (mutation.retryCount || 0) + 1;
        mutation.status = 'failed';
        remaining.push(mutation);
      }
    }

    // Atualiza a fila com apenas os que ainda falharam
    localStorage.setItem('agro_mutation_queue', JSON.stringify(remaining));
    this.isSyncing = false;
    return syncedCount;
  }

  /**
   * Salva o perfil do produtor no Firestore
   */
  static async saveProducerProfile(profile: ProducerProfile): Promise<void> {
    try {
      await setDoc(doc(db, 'producers', profile.id), {
        id: profile.id,
        deviceSessionId: profile.deviceSessionId,
        displayName: profile.displayName,
        cpf: profile.cpf || null,
        phone: profile.phone || null,
        createdAt: profile.createdAt,
      });
    } catch (error) {
      console.warn('Persistência remota do produtor em background:', error);
    }
  }

  /**
   * Puxa do Firestore dados remotos caso a base local esteja limpa
   */
  static async loadRemoteData(producerId: string): Promise<{ properties: Property[]; plots: Plot[]; events: FieldEvent[] }> {
    const properties: Property[] = [];
    const plots: Plot[] = [];
    const events: FieldEvent[] = [];

    try {
      const propsSnapshot = await getDocs(collection(db, 'properties'));
      propsSnapshot.forEach((d) => {
        const data = d.data() as Property;
        if (data.producerId === producerId) {
          properties.push(data);
        }
      });

      const plotsSnapshot = await getDocs(collection(db, 'plots'));
      plotsSnapshot.forEach((d) => {
        plots.push(d.data() as Plot);
      });

      const eventsSnapshot = await getDocs(collection(db, 'field_events'));
      eventsSnapshot.forEach((d) => {
        events.push(d.data() as FieldEvent);
      });
    } catch (error) {
      console.warn('Consulta remota Firestore:', error);
    }

    return { properties, plots, events };
  }
}
