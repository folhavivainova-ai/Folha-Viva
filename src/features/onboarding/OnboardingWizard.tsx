import React, { useState } from 'react';
import { Leaf, MapPin, Check, ArrowRight, ShieldCheck, Sprout } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { OpenMapView } from '../map/OpenMapView';
import { ActivityProfile, CoffeeSubtype, GeoPoint } from '../../domain/entities';

interface OnboardingWizardProps {
  onComplete: (data: {
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
  }) => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(0);
  const [producerName, setProducerName] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [activityProfile, setActivityProfile] = useState<ActivityProfile>('coffee');
  const [coffeeSubtype, setCoffeeSubtype] = useState<CoffeeSubtype>('convencional');
  const [coffeeCultivar, setCoffeeCultivar] = useState('');
  const [pastureVariety, setPastureVariety] = useState('');
  const [customPasture, setCustomPasture] = useState('');
  const [location, setLocation] = useState<GeoPoint | undefined>(undefined);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);

  // Primeiro talhão
  const [plotName, setPlotName] = useState('Talhão 1');
  const [plotCoords, setPlotCoords] = useState<[number, number][]>([]);
  const [plotAreaHa, setPlotAreaHa] = useState<number>(0);

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      setGpsMessage('Geolocalização não disponível neste aparelho.');
      return;
    }

    setIsLocating(true);
    setGpsMessage(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const pt: GeoPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyMeters: pos.coords.accuracy,
        };
        setLocation(pt);
        setGpsMessage(`Localização obtida com precisão de ±${Math.round(pos.coords.accuracy)}m`);
      },
      (err) => {
        setIsLocating(false);
        setGpsMessage('Não foi possível capturar o GPS. Você poderá marcar o local no mapa.');
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const handlePolygonDrawn = (coords: [number, number][], areaHa: number) => {
    setPlotCoords(coords);
    setPlotAreaHa(areaHa);
  };

  const handleFinalSubmit = () => {
    onComplete({
      producerName: producerName.trim() || 'Produtor',
      propertyName: propertyName.trim() || 'Minha Fazenda',
      activityProfile,
      coffeeSubtype: activityProfile !== 'pasture' ? coffeeSubtype : undefined,
      coffeeCultivar: coffeeCultivar.trim() || undefined,
      pastureVariety: (customPasture || pastureVariety).trim() || undefined,
      location,
      initialPlotPolygon: plotCoords.length >= 3 ? plotCoords : undefined,
      initialPlotAreaHa: plotAreaHa > 0 ? plotAreaHa : undefined,
      initialPlotName: plotName.trim() || 'Talhão 1',
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Etapa 0: Abertura Direta (Apêndice I - Passo 1) */}
      {step === 0 && (
        <div className="text-center py-6 space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-[#2F7D4A]/10 text-[#2F7D4A] flex items-center justify-center border border-[#2F7D4A]/20 shadow-xs">
            <Leaf className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#173F2A] tracking-tight">
              Folha Viva
            </h1>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#2F7D4A]">
              Monitoramento Agrícola Inteligente
            </p>
            <p className="text-sm sm:text-base text-[#6B4A35] max-w-md mx-auto leading-relaxed">
              Transforme observações de campo, satélite e clima em decisões simples para sua lavoura.
            </p>
          </div>

          <div className="bg-white/80 border border-[#D8C4A8]/40 rounded-2xl p-4 max-w-md mx-auto text-left text-xs text-[#6B4A35] space-y-2">
            <div className="flex items-center gap-2 text-[#173F2A] font-semibold text-sm">
              <ShieldCheck className="w-4 h-4 text-[#2F7D4A]" />
              <span>Sem senha e sem login</span>
            </div>
            <p>
              Inicie direto no seu celular ou computador. Seus dados ficam salvos com segurança no aparelho e sincronizam quando houver internet.
            </p>
          </div>

          <div className="pt-4">
            <Button
              size="large"
              onClick={() => setStep(1)}
              className="w-full sm:w-auto px-10 text-base"
              icon={<ArrowRight className="w-5 h-5" />}
            >
              Começar
            </Button>
          </div>
        </div>
      )}

      {/* Etapa 1: Nome do Produtor e Propriedade (Passos 2 e 3) */}
      {step === 1 && (
        <Card title="Como podemos te chamar?">
          <div className="space-y-5 pt-2">
            <div>
              <label className="block text-sm font-semibold text-[#173F2A] mb-2">
                Seu nome ou como prefere ser chamado:
              </label>
              <input
                type="text"
                value={producerName}
                onChange={(e) => setProducerName(e.target.value)}
                placeholder="Ex: João Ferreira"
                className="w-full h-12 px-4 rounded-xl border border-[#D8C4A8] bg-white text-base text-[#173F2A] focus:outline-none focus:border-[#2F7D4A] focus:ring-1 focus:ring-[#2F7D4A]"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#173F2A] mb-2">
                Nome da fazenda ou sítio:
              </label>
              <input
                type="text"
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                placeholder="Ex: Sítio Bela Vista"
                className="w-full h-12 px-4 rounded-xl border border-[#D8C4A8] bg-white text-base text-[#173F2A] focus:outline-none focus:border-[#2F7D4A] focus:ring-1 focus:ring-[#2F7D4A]"
              />
              <p className="text-xs text-[#6B4A35] mt-1.5">
                O nome pelo qual sua terra é conhecida na região.
              </p>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#D8C4A8]/20">
              <Button variant="outline" onClick={() => setStep(0)}>
                Voltar
              </Button>
              <Button
                variant="primary"
                disabled={!producerName.trim() || !propertyName.trim()}
                onClick={() => setStep(2)}
              >
                Continuar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Etapa 2: Localização por GPS (Passo 4) */}
      {step === 2 && (
        <Card title="Onde fica a sua propriedade?">
          <div className="space-y-4 pt-2">
            <p className="text-sm text-[#6B4A35] leading-relaxed">
              Precisamos saber a localização para buscar imagens de satélite e a previsão do tempo para a sua terra.
            </p>

            <div className="bg-[#8BCF9B]/10 rounded-2xl p-4 border border-[#8BCF9B]/30 flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-white text-[#2F7D4A] flex items-center justify-center shadow-xs">
                <MapPin className="w-6 h-6" />
              </div>

              {location ? (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#173F2A]">
                    Coordenadas registradas
                  </p>
                  <p className="text-xs font-mono text-[#6B4A35]">
                    {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                  </p>
                  {gpsMessage && <p className="text-xs text-[#2F7D4A]">{gpsMessage}</p>}
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-[#173F2A]">
                    {isLocating ? 'Obtendo GPS do aparelho...' : 'Usar a posição do aparelho'}
                  </p>
                  <p className="text-xs text-[#6B4A35] mt-0.5">
                    Se estiver na fazenda agora, toque abaixo.
                  </p>
                </div>
              )}

              <Button
                variant={location ? 'outline' : 'primary'}
                onClick={handleUseGPS}
                disabled={isLocating}
                className="w-full sm:w-auto"
              >
                {location ? 'Atualizar minha localização' : 'Usar minha localização'}
              </Button>
            </div>

            {/* Mapa Interativo para conferência ou ajuste */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-[#173F2A] mb-1.5">
                Visualização no mapa aberto:
              </label>
              <OpenMapView
                center={location ? [location.lat, location.lng] : [-20.0, -44.0]}
                zoom={location ? 15 : 6}
                onLocationFound={(pt) => setLocation(pt)}
                className="h-64"
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#D8C4A8]/20">
              <Button variant="outline" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button
                variant="primary"
                onClick={() => setStep(3)}
              >
                Continuar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Etapa 3: Escolha de Cultura: Café, Capim ou Misto (Passo 5 e 6) */}
      {step === 3 && (
        <Card title="O que você cultiva?">
          <div className="space-y-5 pt-2">
            <p className="text-xs text-[#6B4A35]">
              Escolha a atividade principal da fazenda:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'coffee', label: 'Café', desc: 'Arábica ou Conilon', icon: <Leaf className="w-5 h-5 text-[#2F7D4A]" /> },
                { id: 'pasture', label: 'Capim', desc: 'Pastagem ou Feno', icon: <Sprout className="w-5 h-5 text-emerald-600" /> },
                { id: 'mixed', label: 'Misto', desc: 'Café e Pasto juntos', icon: <Leaf className="w-5 h-5 text-amber-700" /> },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setActivityProfile(opt.id as ActivityProfile)}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                    activityProfile === opt.id
                      ? 'border-[#2F7D4A] bg-[#8BCF9B]/15 shadow-sm ring-1 ring-[#2F7D4A]'
                      : 'border-[#D8C4A8]/50 bg-white hover:border-[#D8C4A8]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-white border border-[#D8C4A8]/30">
                      {opt.icon}
                    </div>
                    {activityProfile === opt.id && (
                      <span className="w-5 h-5 rounded-full bg-[#2F7D4A] text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-[#173F2A]">{opt.label}</h4>
                    <p className="text-xs text-[#6B4A35]">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Parâmetros de Café quando selecionado */}
            {(activityProfile === 'coffee' || activityProfile === 'mixed') && (
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
                <h4 className="font-semibold text-xs text-[#173F2A]">
                  Perfil do Café:
                </h4>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-medium text-stone-800 cursor-pointer">
                    <input
                      type="radio"
                      name="subtype"
                      checked={coffeeSubtype === 'convencional'}
                      onChange={() => setCoffeeSubtype('convencional')}
                      className="accent-[#2F7D4A]"
                    />
                    <span>Convencional / Não Clonal (Ex: Arábica)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-stone-800 cursor-pointer">
                    <input
                      type="radio"
                      name="subtype"
                      checked={coffeeSubtype === 'clonal'}
                      onChange={() => setCoffeeSubtype('clonal')}
                      className="accent-[#2F7D4A]"
                    />
                    <span>Clonal (Ex: Conilon / Robusta)</span>
                  </label>
                </div>
                <div>
                  <input
                    type="text"
                    value={coffeeCultivar}
                    onChange={(e) => setCoffeeCultivar(e.target.value)}
                    placeholder="Variedade conhecida (opcional, ex: Catuaí 144, Mundo Novo)"
                    className="w-full h-10 px-3 rounded-lg border border-stone-300 text-xs bg-white text-stone-900 focus:outline-none focus:border-[#2F7D4A]"
                  />
                </div>
              </div>
            )}

            {/* Parâmetros de Capim quando selecionado */}
            {(activityProfile === 'pasture' || activityProfile === 'mixed') && (
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
                <h4 className="font-semibold text-xs text-[#173F2A]">
                  Variedade de Capim:
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {['Brachiaria Brizantha', 'Mombaça', 'Marandu', 'Tifton', 'Outra'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setPastureVariety(v)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border text-left cursor-pointer ${
                        pastureVariety === v
                          ? 'border-[#2F7D4A] bg-[#8BCF9B]/20 text-[#173F2A]'
                          : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                {pastureVariety === 'Outra' && (
                  <input
                    type="text"
                    value={customPasture}
                    onChange={(e) => setCustomPasture(e.target.value)}
                    placeholder="Digite o nome do capim"
                    className="w-full h-10 px-3 rounded-lg border border-stone-300 text-xs bg-white text-stone-900 focus:outline-none focus:border-[#2F7D4A]"
                  />
                )}
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-[#D8C4A8]/20">
              <Button variant="outline" onClick={() => setStep(2)}>
                Voltar
              </Button>
              <Button
                variant="primary"
                onClick={() => setStep(4)}
              >
                Continuar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Etapa 4: Desenhar Primeiro Talhão (Passo 7 e 8) */}
      {step === 4 && (
        <Card title="Pronto! Agora vamos marcar seu primeiro talhão">
          <div className="space-y-4 pt-2">
            <p className="text-xs text-[#6B4A35]">
              Toque no mapa para contornar a área do talhão. O sistema calculará a área em hectares automaticamente.
            </p>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-[#173F2A] mb-1">
                  Nome do talhão:
                </label>
                <input
                  type="text"
                  value={plotName}
                  onChange={(e) => setPlotName(e.target.value)}
                  placeholder="Ex: Talhão da Sede, Talhão Café 1"
                  className="w-full h-10 px-3 rounded-lg border border-[#D8C4A8] bg-white text-sm text-[#173F2A] focus:outline-none focus:border-[#2F7D4A]"
                />
              </div>
              {plotAreaHa > 0 && (
                <div className="px-4 py-2 bg-[#8BCF9B]/20 rounded-xl border border-[#2F7D4A]/20 text-center">
                  <div className="text-[10px] uppercase font-semibold text-[#2F7D4A]">Área calculada</div>
                  <div className="text-lg font-bold text-[#173F2A]">{plotAreaHa} ha</div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <OpenMapView
                center={location ? [location.lat, location.lng] : [-20.0, -44.0]}
                zoom={location ? 16 : 14}
                isDrawingPlot={true}
                drawingCropType={activityProfile === 'pasture' ? 'pasture' : 'coffee'}
                onPolygonCreated={handlePolygonDrawn}
                className="h-80"
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#D8C4A8]/20">
              <Button variant="outline" onClick={() => setStep(3)}>
                Voltar
              </Button>
              <Button
                variant="primary"
                onClick={handleFinalSubmit}
              >
                Salvar e Abrir Lavoura
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
