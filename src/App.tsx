/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Leaf, BookOpen, Layers, Plus, LogOut } from 'lucide-react';
import { OfflineStore, generateUUID, getOrCreateDeviceSessionId } from './offline/store';
import { ProducerProfile, Property, Plot, FieldEvent, ActivityProfile, CoffeeSubtype, GeoPoint } from './domain/entities';
import { FirestoreSyncService } from './services/firestoreSync';
import { OnboardingWizard } from './features/onboarding/OnboardingWizard';
import { ProducerDashboard } from './features/dashboard/ProducerDashboard';
import { FieldNotebookModal } from './features/field/FieldNotebookModal';
import { NewPlotModal } from './features/field/NewPlotModal';
import { AuditModal } from './features/audit/AuditModal';
import { PWAInstallButton } from './components/ui/PWAInstallButton';
import { OfflineIndicator } from './components/ui/OfflineIndicator';
import { AuthWelcomeScreen } from './features/auth/AuthWelcomeScreen';

export default function App() {
  const [deviceSessionId, setDeviceSessionId] = useState<string>('');
  const [producer, setProducer] = useState<ProducerProfile | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [events, setEvents] = useState<FieldEvent[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [prefilledAuthData, setPrefilledAuthData] = useState<{ cpf?: string; phone?: string } | undefined>(undefined);

  // Modais
  const [isFieldNotebookOpen, setIsFieldNotebookOpen] = useState(false);
  const [isNewPlotOpen, setIsNewPlotOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [activePlotForEvent, setActivePlotForEvent] = useState<string | undefined>(undefined);

  // Inicialização da Sessão Técnica Invisível (V02-E01) e leitura do store local
  useEffect(() => {
    const session = getOrCreateDeviceSessionId();
    setDeviceSessionId(session);

    loadLocalData();

    // Drena mutações pendentes na inicialização e quando a rede voltar
    FirestoreSyncService.drainMutationQueue().then(() => loadLocalData());

    const handleOnline = () => {
      FirestoreSyncService.drainMutationQueue().then(() => loadLocalData());
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const loadLocalData = () => {
    const p = OfflineStore.getProducerProfile();
    const props = OfflineStore.getProperties();
    const plts = OfflineStore.getPlots();
    const evts = OfflineStore.getFieldEvents();
    const queue = OfflineStore.getMutationQueue();

    setProducer(p);
    setProperties(props);
    setPlots(plts);
    setEvents(evts);
    setPendingCount(queue.filter((m) => m.status === 'pending').length);
  };

  // Sucesso no Login por CPF
  const handleLoginSuccess = (data: {
    producer: ProducerProfile;
    properties: Property[];
    plots: Plot[];
    events: FieldEvent[];
  }) => {
    OfflineStore.restoreSessionData(data);
    setProducer(data.producer);
    setProperties(data.properties);
    setPlots(data.plots);
    setEvents(data.events);
    setIsRegistering(false);
  };

  // Conclusão do Onboarding Inicial Real (Apêndice I)
  const handleOnboardingComplete = (data: {
    producerName: string;
    propertyName: string;
    cpf?: string;
    phone?: string;
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
    const newProducer = OfflineStore.saveProducerProfile({
      displayName: data.producerName,
      cpf: data.cpf,
      phone: data.phone,
    });

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
    OfflineStore.saveProperty(newProperty);

    // 3. Salvar primeiro talhão se desenhado
    let newPlot: Plot | undefined = undefined;
    if (data.initialPlotPolygon && data.initialPlotPolygon.length >= 3) {
      const plotId = generateUUID();
      newPlot = {
        id: plotId,
        propertyId: newProperty.id,
        name: data.initialPlotName || 'Talhão 1',
        geometry: {
          type: 'Polygon',
          coordinates: data.initialPlotPolygon,
        },
        areaHa: data.initialPlotAreaHa || 1.0,
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
      OfflineStore.savePlot(newPlot);
    }

    // Grava de forma completa e imediata no Firebase (coleções e producers_by_cpf)
    FirestoreSyncService.saveFullRegistration({
      producer: newProducer,
      property: newProperty,
      plot: newPlot,
    });

    setIsRegistering(false);
    loadLocalData();
    FirestoreSyncService.drainMutationQueue().then(() => loadLocalData());
  };

  // Salvar novo talhão avulso
  const handleSavePlot = (plot: Plot) => {
    OfflineStore.savePlot(plot);
    loadLocalData();
    FirestoreSyncService.savePlotDirect(plot, producer, activeProperty).then(() => {
      loadLocalData();
    });
    FirestoreSyncService.drainMutationQueue();
  };

  // Salvar evento no caderno de campo
  const handleSaveFieldEvent = (event: FieldEvent) => {
    OfflineStore.saveFieldEvent(event);
    loadLocalData();
    FirestoreSyncService.drainMutationQueue().then(() => loadLocalData());
  };

  // Sair do portal e voltar imediatamente para a tela de login ou cadastro
  const handleLogout = () => {
    localStorage.removeItem('agro_producer_profile');
    setProducer(null);
    setProperties([]);
    setPlots([]);
    setEvents([]);
    setIsRegistering(false);
  };

  // Reset para demonstração / homologação limpa
  const handleResetData = () => {
    if (window.confirm('Deseja limpar todos os dados cadastrados neste aparelho e reiniciar o acesso?')) {
      OfflineStore.clearDatabase();
      loadLocalData();
      setIsRegistering(false);
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
              <span>Livro Raiz e Manual</span>
            </button>
            <span className="text-stone-300">|</span>
            <span>Versão 1.0 (Firebase)</span>
          </div>

          {/* Zone 3: Primary Actions (Offline Indicator + Sair + PWA Install) */}
          <div className="flex items-center gap-2.5">
            <OfflineIndicator pendingMutationsCount={pendingCount} />
            {producer && (
              <button
                type="button"
                onClick={handleLogout}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#B7372E] bg-red-50 hover:bg-red-100 border border-red-200/80 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                title="Sair do portal e voltar para a tela inicial"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            )}
            <PWAInstallButton />
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6">
        {!producer || !activeProperty ? (
          isRegistering ? (
            <OnboardingWizard
              initialData={prefilledAuthData}
              onCancel={() => setIsRegistering(false)}
              onComplete={handleOnboardingComplete}
            />
          ) : (
            <AuthWelcomeScreen
              onLoginSuccess={handleLoginSuccess}
              onStartRegistration={(initial) => {
                setPrefilledAuthData(initial);
                setIsRegistering(true);
              }}
            />
          )
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
