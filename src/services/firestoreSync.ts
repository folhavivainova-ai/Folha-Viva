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

    // 1. Buscar direto por documento em producers_by_cpf/{cleanInput} (O(1) no Firestore)
    try {
      const directDocRef = doc(db, 'producers_by_cpf', cleanInput);
      const directSnap = await getDoc(directDocRef);

      if (directSnap.exists()) {
        const data = directSnap.data();
        const producer: ProducerProfile = data.producer || {
          id: data.id || data.producerId,
          displayName: data.displayName,
          cpf: data.cpf || cleanInput,
          phone: data.phone,
          deviceSessionId: data.deviceSessionId,
          createdAt: data.createdAt,
        };

        const properties: Property[] = data.properties || (data.property ? [data.property] : []);
        const plotsFromDoc: Plot[] = data.plots || (data.plot ? [data.plot] : []);
        const events: FieldEvent[] = data.events || [];

        // Buscar talhões também da coleção canônica 'plots' para garantir sincronia total
        const remoteData = await this.loadRemoteData(producer.id);
        const allPlotsMap = new Map<string, Plot>();
        plotsFromDoc.forEach((p) => allPlotsMap.set(p.id, p));
        remoteData.plots.forEach((p) => {
          if (properties.some((prop) => prop.id === p.propertyId) || p.propertyId === properties[0]?.id) {
            allPlotsMap.set(p.id, p);
          }
        });
        const mergedPlots = Array.from(allPlotsMap.values());

        // Se a propriedade estiver sem centroid mas tiver talhão desenhado, inferir centroid
        if (properties.length > 0 && !properties[0].centroid && mergedPlots.length > 0) {
          const coords = mergedPlots[0].geometry?.coordinates;
          if (coords && coords.length >= 3) {
            const avgLat = coords.reduce((acc, c) => acc + c[0], 0) / coords.length;
            const avgLng = coords.reduce((acc, c) => acc + c[1], 0) / coords.length;
            properties[0].centroid = {
              lat: Number(avgLat.toFixed(6)),
              lng: Number(avgLng.toFixed(6)),
              accuracyMeters: 10,
            };
          }
        }

        // Atualizar cache local fresco
        localStorage.setItem(
          `agro_cpf_registry_${cleanInput}`,
          JSON.stringify({ producer, properties, plots: mergedPlots, events })
        );

        return { producer, properties, plots: mergedPlots, events };
      }
    } catch (directErr) {
      console.warn('Busca direta por producers_by_cpf:', directErr);
    }

    // 2. Fallback: Varredura de consulta na coleção producers
    try {
      const producersSnap = await getDocs(collection(db, 'producers'));
      let foundProducer: ProducerProfile | null = null;

      producersSnap.forEach((docSnap) => {
        const data = docSnap.data() as ProducerProfile;
        if (data.cpf && stripNonDigits(data.cpf) === cleanInput) {
          foundProducer = { ...data, id: docSnap.id };
        }
      });

      if (foundProducer) {
        // Carregar propriedades, talhões e eventos do produtor encontrado
        const remoteData = await this.loadRemoteData((foundProducer as ProducerProfile).id);

        // Se a propriedade estiver sem centroid mas tiver talhão desenhado, inferir centroid
        if (remoteData.properties.length > 0 && !remoteData.properties[0].centroid && remoteData.plots.length > 0) {
          const coords = remoteData.plots[0].geometry?.coordinates;
          if (coords && coords.length >= 3) {
            const avgLat = coords.reduce((acc, c) => acc + c[0], 0) / coords.length;
            const avgLng = coords.reduce((acc, c) => acc + c[1], 0) / coords.length;
            remoteData.properties[0].centroid = {
              lat: Number(avgLat.toFixed(6)),
              lng: Number(avgLng.toFixed(6)),
              accuracyMeters: 10,
            };
          }
        }

        // Salvar índice rápido no producers_by_cpf para as próximas vezes
        try {
          await setDoc(doc(db, 'producers_by_cpf', cleanInput), {
            cpf: cleanInput,
            producer: foundProducer,
            properties: remoteData.properties,
            plots: remoteData.plots,
            events: remoteData.events,
            updatedAt: new Date().toISOString(),
          });
        } catch (saveIdxErr) {
          // Ignora falha de índice
        }

        // Atualizar cache local
        localStorage.setItem(
          `agro_cpf_registry_${cleanInput}`,
          JSON.stringify({
            producer: foundProducer,
            properties: remoteData.properties,
            plots: remoteData.plots,
            events: remoteData.events,
          })
        );

        return {
          producer: foundProducer,
          properties: remoteData.properties,
          plots: remoteData.plots,
          events: remoteData.events,
        };
      }
    } catch (err) {
      console.warn('Erro ao buscar CPF no Firestore:', err);
    }

    // 3. Fallback Offline: Tentar encontrar no registro local se rede falhou
    try {
      const cached = localStorage.getItem(`agro_cpf_registry_${cleanInput}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.producer) {
          return {
            producer: parsed.producer,
            properties: parsed.properties || (parsed.property ? [parsed.property] : []),
            plots: parsed.plots || [],
            events: parsed.events || [],
          };
        }
      }
    } catch (e) {
      // Ignora erro
    }

    const localProducer = OfflineStore.getProducerProfile();
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

  /**
   * Salva um talhão de forma imediata e síncrona no Firestore e atualiza o perfil do produtor
   */
  static async savePlotDirect(
    plot: Plot,
    currentProducer?: ProducerProfile | null,
    currentProperty?: Property | null
  ): Promise<void> {
    // 1. Gravar na coleção 'plots' do Firestore
    try {
      await setDoc(doc(db, 'plots', plot.id), {
        id: plot.id,
        propertyId: plot.propertyId,
        name: plot.name,
        areaHa: Number(plot.areaHa || 0),
        active: Boolean(plot.active),
        geometry: plot.geometry,
        cropCycle: plot.cropCycle || null,
        createdAt: plot.createdAt || new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Erro ao salvar plot no Firestore:', err);
    }

    // 2. Se a propriedade não possuía localização, atualizar com o centro do talhão
    if (currentProperty && !currentProperty.centroid && plot.geometry?.coordinates?.length >= 3) {
      const coords = plot.geometry.coordinates;
      const avgLat = coords.reduce((acc, c) => acc + c[0], 0) / coords.length;
      const avgLng = coords.reduce((acc, c) => acc + c[1], 0) / coords.length;
      currentProperty.centroid = {
        lat: Number(avgLat.toFixed(6)),
        lng: Number(avgLng.toFixed(6)),
        accuracyMeters: 10,
      };

      try {
        await setDoc(doc(db, 'properties', currentProperty.id), {
          ...currentProperty,
          updatedAt: new Date().toISOString(),
        });
      } catch (propErr) {
        console.warn('Erro ao atualizar propriedade com centroid:', propErr);
      }
    }

    // 3. Atualizar o documento no índice rápido 'producers_by_cpf'
    if (currentProducer?.cpf) {
      const clean = stripNonDigits(currentProducer.cpf);
      if (clean.length === 11) {
        const allPlots = OfflineStore.getPlots();
        const existingIdx = allPlots.findIndex((p) => p.id === plot.id);
        if (existingIdx >= 0) {
          allPlots[existingIdx] = plot;
        } else {
          allPlots.push(plot);
        }

        const payload = {
          cpf: clean,
          producer: currentProducer,
          properties: currentProperty ? [currentProperty] : OfflineStore.getProperties(),
          plots: allPlots,
          events: OfflineStore.getFieldEvents(),
          updatedAt: new Date().toISOString(),
        };

        // Cache local
        localStorage.setItem(`agro_cpf_registry_${clean}`, JSON.stringify(payload));

        // Firestore
        try {
          await setDoc(doc(db, 'producers_by_cpf', clean), payload);
        } catch (idxErr) {
          console.warn('Erro ao atualizar producers_by_cpf com novo talhão:', idxErr);
        }
      }
    }
  }

  /**
   * Salva o cadastro completo inicial de forma redundante (Firestore + Cache local)
   */
  static async saveFullRegistration(data: {
    producer: ProducerProfile;
    property: Property;
    plot?: Plot;
  }): Promise<void> {
    const { producer, property, plot } = data;
    const plots = plot ? [plot] : [];

    // 1. Guardar no registro local por CPF
    if (producer.cpf) {
      const clean = stripNonDigits(producer.cpf);
      if (clean.length === 11) {
        localStorage.setItem(
          `agro_cpf_registry_${clean}`,
          JSON.stringify({
            producer,
            properties: [property],
            plots,
            events: [],
          })
        );

        // 2. Gravar documento direto no Firestore
        try {
          await setDoc(doc(db, 'producers_by_cpf', clean), {
            cpf: clean,
            producer,
            properties: [property],
            plots,
            events: [],
            updatedAt: new Date().toISOString(),
          });
        } catch (e) {
          console.warn('Persistência producers_by_cpf:', e);
        }
      }
    }

    // 3. Gravar coleções canônicas do Firestore
    try {
      await setDoc(doc(db, 'producers', producer.id), {
        id: producer.id,
        deviceSessionId: producer.deviceSessionId,
        displayName: producer.displayName,
        cpf: producer.cpf || null,
        phone: producer.phone || null,
        createdAt: producer.createdAt,
      });

      await setDoc(doc(db, 'properties', property.id), {
        id: property.id,
        producerId: property.producerId,
        name: property.name,
        activityProfile: property.activityProfile,
        centroid: property.centroid || null,
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
      });

      if (plot) {
        await setDoc(doc(db, 'plots', plot.id), {
          id: plot.id,
          propertyId: plot.propertyId,
          name: plot.name,
          areaHa: plot.areaHa,
          active: plot.active,
          geometry: plot.geometry,
          cropCycle: plot.cropCycle || null,
          createdAt: plot.createdAt,
        });
      }
    } catch (err) {
      console.warn('Erro ao salvar cadastro completo no Firestore:', err);
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
