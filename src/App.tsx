/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Leaf, BookOpen, Layers, Plus } from 'lucide-react';
import { OfflineStore, generateUUID, getOrCreateDeviceSessionId } from './offline/store';
import { ProducerProfile, Property, Plot, FieldEvent, ActivityProfile, CoffeeSubtype, GeoPoint } from './domain/entities';
import { OnboardingWizard } from './features/onboarding/OnboardingWizard';
import { ProducerDashboard } from './features/dashboard/ProducerDashboard';
import { FieldNotebookModal } from './features/field/FieldNotebookModal';
import { NewPlotModal } from './features/field/NewPlotModal';
import { AuditModal } from './features/audit/AuditModal';
import { PWAInstallButton } from './components/ui/PWAInstallButton';
import { OfflineIndicator } from './components/ui/OfflineIndicator';
import { startSynchronization, getSyncStatus, synchronize } from './services/syncService';
import type { SyncStatus } from './domain/sync';

export default function App() {
  const [deviceSessionId, setDeviceSessionId] = useState<string>('');
  const [producer, setProducer] = useState<ProducerProfile | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [events, setEvents] = useState<FieldEvent[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(getSyncStatus());

  // Modais
  const [isFieldNotebookOpen, setIsFieldNotebookOpen] = useState(false);
  const [isNewPlotOpen, setIsNewPlotOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [activePlotForEvent, setActivePlotForEvent] = useState<string | undefined>(undefined);

  // Inicialização da Sessão Técnica Invisível (V02-E01) e leitura do store local
  useEffect(() => {
    let alive = true;
    let stop = () => {};
    const refresh = () => { void loadLocalData().catch(() => setStorageError('Não foi possível ler os dados deste aparelho.')); };
    const updateSync = () => setSyncStatus(getSyncStatus());
    window.addEventListener('folha-store-changed', refresh);
    window.addEventListener('folha-sync-changed', updateSync);
    void OfflineStore.initialize().then(async () => {
      if (!alive) return;
      setDeviceSessionId(getOrCreateDeviceSessionId());
      await loadLocalData();
      if (!alive) return;
      setReady(true); stop = startSynchronization();
    }).catch(() => setStorageError('Não foi possível abrir os dados locais. Seus registros anteriores foram preservados.'));
    return () => { alive = false; stop(); window.removeEventListener('folha-store-changed', refresh); window.removeEventListener('folha-sync-changed', updateSync); };
  }, []);

  const loadLocalData = async () => {
    const { producer: p, properties: props, plots: plts, events: evts, queue } = await OfflineStore.snapshot();

    setProducer(p);
    setProperties(props);
    setPlots(plts);
    setEvents(evts);
    setPendingCount(queue.filter((m) => m.status !== 'synced').length);
  };

  // Conclusão do Onboarding Inicial Real (Apêndice I)
  const handleOnboardingComplete = async (data: {
    producerName: string;
    propertyName: string;
    activityProfile: ActivityProfile;
    coffeeSubtype?: CoffeeSubtype;
    coffeeCultivar?: string;
    pastureVariety?: string;
    location?: GeoPoint;
    initialPlotPolygon?: [number, number][];
    initialPlotAreaHa?: number;
    initialPlotName?: string;
  }) => {
    // 1. Salvar perfil do produtor
    const previous = (await OfflineStore.snapshot()).producer;
    const newProducer: ProducerProfile = {
      id: previous?.id || generateUUID(), deviceSessionId,
      displayName: data.producerName.trim(), createdAt: previous?.createdAt || new Date().toISOString(),
    };

    // 2. Salvar propriedade
    const propertyId = generateUUID();
    const newProperty: Property = {
      id: propertyId,
      producerId: newProducer.id,
      name: data.propertyName,
      activityProfile: data.activityProfile,
      centroid: data.location,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    let initialPlot: Plot | undefined;

    // 3. Salvar primeiro talhão se desenhado
    if (data.initialPlotPolygon && data.initialPlotPolygon.length >= 3) {
      const plotId = generateUUID();
      const newPlot: Plot = {
        id: plotId,
        propertyId: newProperty.id,
        name: data.initialPlotName || 'Talhão 1',
        geometry: {
          type: 'Polygon',
          coordinates: data.initialPlotPolygon,
        },
        areaHa: data.initialPlotAreaHa || 0,
        active: true,
        createdAt: new Date().toISOString(),
        cropCycle: {
          id: generateUUID(),
          plotId,
          cropType: data.activityProfile === 'pasture' ? 'pasture' : 'coffee',
          subtype: data.coffeeSubtype,
          cultivar: data.activityProfile === 'pasture' ? data.pastureVariety : data.coffeeCultivar,
          startDate: new Date().toISOString().split('T')[0],
        },
      };
      initialPlot = newPlot;
    }

    await OfflineStore.saveRegistration(newProducer, newProperty, initialPlot);
    await loadLocalData();
  };

  // Salvar novo talhão avulso
  const handleSavePlot = async (plot: Plot) => {
    await OfflineStore.savePlot(plot);
    await loadLocalData();
  };

  // Salvar evento no caderno de campo
  const handleSaveFieldEvent = async (event: FieldEvent) => {
    await OfflineStore.saveFieldEvent(event);
    await loadLocalData();
  };

  // Reset para demonstração / homologação limpa
  const handleResetData = async () => {
    if ((await OfflineStore.snapshot()).identity.ownerSubject) {
      setStorageError('Este aparelho já está vinculado à sua sessão. A limpeza exige um fluxo de recuperação para preservar seus registros.');
      return;
    }
    if (window.confirm('Deseja limpar todos os dados cadastrados neste aparelho e reiniciar o onboarding?')) {
      try { await OfflineStore.clearDatabase(); await loadLocalData(); }
      catch { setStorageError('Não foi possível limpar os dados locais.'); }
    }
  };

  const activeProperty = properties.length > 0 ? properties[0] : null;

  return (
    <div className="min-h-screen bg-[#FFFDF7] text-[#173F2A] flex flex-col font-sans">
      {/* Top Bar Contract (Seção 2: Brand zone, Navigation, Actions) */}
      <header className="sticky top-0 z-40 bg-[#FFFDF7]/90 backdrop-blur-md border-b border-[#D8C4A8]/40 px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Zone 1: Brand title, single element */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#2F7D4A] text-white flex items-center justify-center shadow-xs">
              <Leaf className="w-5 h-5" />
            </div>
            <span className="font-bold text-base sm:text-lg text-[#173F2A] tracking-tight">
              Folha Viva
            </span>
          </div>

          {/* Zone 2: Navigation Links / Info */}
          <div className="hidden md:flex items-center gap-5 text-xs font-medium text-[#6B4A35]">
            <button
              onClick={() => setIsAuditOpen(true)}
              className="hover:text-[#173F2A] transition cursor-pointer flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#2F7D4A]" />
              <span>Livro Raiz & Manual</span>
            </button>
            <span className="text-stone-300">|</span>
            <span>Versão 0.2 — em validação</span>
          </div>

          {/* Zone 3: Primary Actions (Offline Indicator + PWA Install) */}
          <div className="flex items-center gap-3">
            <OfflineIndicator pendingMutationsCount={pendingCount} status={syncStatus} onRetry={() => void synchronize(true)} />
            <PWAInstallButton />
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6">
        {storageError && <p role="alert" className="p-4 text-red-800">{storageError} <button onClick={() => window.location.reload()}>Tentar novamente</button></p>}
        {!ready ? <p role="status">Abrindo seus dados…</p> : !producer || !activeProperty ? (
          <OnboardingWizard onComplete={handleOnboardingComplete} />
        ) : (
          <ProducerDashboard
            producer={producer}
            property={activeProperty}
            plots={plots}
            fieldEvents={events}
            onOpenFieldNotebook={(plotId) => {
              setActivePlotForEvent(plotId);
              setIsFieldNotebookOpen(true);
            }}
            onOpenNewPlot={() => setIsNewPlotOpen(true)}
            onOpenAudit={() => setIsAuditOpen(true)}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* Modais de Fluxo */}
      {activeProperty && (
        <>
          <FieldNotebookModal
            plots={plots}
            selectedPlotId={activePlotForEvent}
            isOpen={isFieldNotebookOpen}
            onClose={() => setIsFieldNotebookOpen(false)}
            onSaveEvent={handleSaveFieldEvent}
          />

          <NewPlotModal
            propertyId={activeProperty.id}
            isOpen={isNewPlotOpen}
            onClose={() => setIsNewPlotOpen(false)}
            onSavePlot={handleSavePlot}
            centerCoord={
              activeProperty.centroid
                ? [activeProperty.centroid.lat, activeProperty.centroid.lng]
                : undefined
            }
          />
        </>
      )}

      <AuditModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        deviceSessionId={deviceSessionId}
      />
    </div>
  );
}
