import React, { useState } from 'react';
import { X, Droplets, Scissors, ArrowDownRight, ArrowUpRight, Eye, AlertTriangle, FileText, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Plot, FieldEventType, FieldEvent } from '../../domain/entities';
import { generateUUID } from '../../offline/store';

interface FieldNotebookModalProps {
  plots: Plot[];
  selectedPlotId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSaveEvent: (event: FieldEvent) => void;
}

export const FieldNotebookModal: React.FC<FieldNotebookModalProps> = ({
  plots,
  selectedPlotId,
  isOpen,
  onClose,
  onSaveEvent,
}) => {
  const [activePlotId, setActivePlotId] = useState<string>(
    selectedPlotId || (plots.length > 0 ? plots[0].id : '')
  );
  const [eventType, setEventType] = useState<FieldEventType>('inspection');
  const [notes, setNotes] = useState('');
  const [irrigationMm, setIrrigationMm] = useState('');
  const [irrigationHours, setIrrigationHours] = useState('');
  const [severity, setSeverity] = useState<'info' | 'attention' | 'high'>('info');

  if (!isOpen) return null;

  const currentPlot = plots.find((p) => p.id === activePlotId);
  const isCoffee = currentPlot?.cropCycle?.cropType === 'coffee';
  const isPasture = currentPlot?.cropCycle?.cropType === 'pasture';

  const handleSave = () => {
    if (!activePlotId) return;

    const payload: Record<string, unknown> = {
      notes: notes.trim(),
    };

    if (eventType === 'irrigation') {
      if (irrigationMm) payload.laminaMm = parseFloat(irrigationMm);
      if (irrigationHours) payload.hours = parseFloat(irrigationHours);
    }

    if (eventType === 'occurrence') {
      payload.severity = severity;
    }

    const event: FieldEvent = {
      id: generateUUID(),
      plotId: activePlotId,
      clientGeneratedId: generateUUID(),
      type: eventType,
      occurredAt: new Date().toISOString(),
      payload,
      createdAt: new Date().toISOString(),
    };

    onSaveEvent(event);
    onClose();
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#FFFDF7] p-5 sm:p-6 shadow-2xl border border-[#D8C4A8] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#D8C4A8]/30">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#173F2A]">
              Caderno de Campo
            </h3>
            <p className="text-xs text-[#6B4A35]">
              Registrar manejo, observação ou ocorrência
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-500 hover:bg-stone-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 pt-4">
          {/* Seleção do Talhão */}
          <div>
            <label className="block text-xs font-semibold text-[#173F2A] mb-1.5">
              Talhão:
            </label>
            <select
              value={activePlotId}
              onChange={(e) => setActivePlotId(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-[#D8C4A8] bg-white text-sm text-[#173F2A] focus:outline-none focus:border-[#2F7D4A]"
            >
              {plots.map((plot) => (
                <option key={plot.id} value={plot.id}>
                  {plot.name} ({plot.areaHa} ha - {plot.cropCycle?.cropType === 'coffee' ? 'Café' : 'Capim'})
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Registro */}
          <div>
            <label className="block text-xs font-semibold text-[#173F2A] mb-2">
              Tipo de Registro:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setEventType('inspection')}
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 cursor-pointer transition ${
                  eventType === 'inspection'
                    ? 'border-[#2F7D4A] bg-[#8BCF9B]/20 text-[#173F2A] font-semibold'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <Eye className="w-4 h-4 text-[#2F7D4A]" />
                <span>Inspeção</span>
              </button>

              <button
                type="button"
                onClick={() => setEventType('irrigation')}
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 cursor-pointer transition ${
                  eventType === 'irrigation'
                    ? 'border-[#2F7D4A] bg-[#8BCF9B]/20 text-[#173F2A] font-semibold'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <Droplets className="w-4 h-4 text-sky-600" />
                <span>Irriguei agora</span>
              </button>

              <button
                type="button"
                onClick={() => setEventType('occurrence')}
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 cursor-pointer transition ${
                  eventType === 'occurrence'
                    ? 'border-[#2F7D4A] bg-[#8BCF9B]/20 text-[#173F2A] font-semibold'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-[#D99A22]" />
                <span>Algo diferente</span>
              </button>

              {/* Botões específicos de Café */}
              {isCoffee && (
                <button
                  type="button"
                  onClick={() => setEventType('flowering_observed')}
                  className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 cursor-pointer transition ${
                    eventType === 'flowering_observed'
                      ? 'border-[#2F7D4A] bg-[#8BCF9B]/20 text-[#173F2A] font-semibold'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Florada vista</span>
                </button>
              )}

              {/* Botões específicos de Capim */}
              {isPasture && (
                <>
                  <button
                    type="button"
                    onClick={() => setEventType('pasture_cut')}
                    className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 cursor-pointer transition ${
                      eventType === 'pasture_cut'
                        ? 'border-[#2F7D4A] bg-[#8BCF9B]/20 text-[#173F2A] font-semibold'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <Scissors className="w-4 h-4 text-stone-600" />
                    <span>Corte de capim</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEventType('grazing_in')}
                    className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 cursor-pointer transition ${
                      eventType === 'grazing_in'
                        ? 'border-[#2F7D4A] bg-[#8BCF9B]/20 text-[#173F2A] font-semibold'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4 text-emerald-700" />
                    <span>Entrou gado</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEventType('grazing_out')}
                    className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 cursor-pointer transition ${
                      eventType === 'grazing_out'
                        ? 'border-[#2F7D4A] bg-[#8BCF9B]/20 text-[#173F2A] font-semibold'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-stone-600" />
                    <span>Saiu gado</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setEventType('note')}
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 cursor-pointer transition ${
                  eventType === 'note'
                    ? 'border-[#2F7D4A] bg-[#8BCF9B]/20 text-[#173F2A] font-semibold'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <FileText className="w-4 h-4 text-stone-500" />
                <span>Nota geral</span>
              </button>
            </div>
          </div>

          {/* Campos específicos de Irrigação */}
          {eventType === 'irrigation' && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-sky-50 rounded-xl border border-sky-200">
              <div>
                <label className="block text-[11px] font-semibold text-sky-950 mb-1">
                  Lâmina estimada (mm):
                </label>
                <input
                  type="number"
                  value={irrigationMm}
                  onChange={(e) => setIrrigationMm(e.target.value)}
                  placeholder="Ex: 15"
                  className="w-full h-9 px-3 rounded-lg border border-sky-300 bg-white text-xs text-sky-950"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-sky-950 mb-1">
                  Duração (horas):
                </label>
                <input
                  type="number"
                  value={irrigationHours}
                  onChange={(e) => setIrrigationHours(e.target.value)}
                  placeholder="Ex: 3"
                  className="w-full h-9 px-3 rounded-lg border border-sky-300 bg-white text-xs text-sky-950"
                />
              </div>
            </div>
          )}

          {/* Ocorrência / Nível de atenção */}
          {eventType === 'occurrence' && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
              <label className="block text-[11px] font-semibold text-amber-950">
                Nível de severidade:
              </label>
              <div className="flex gap-2">
                {[
                  { id: 'info', label: 'Informativo' },
                  { id: 'attention', label: 'Atenção' },
                  { id: 'high', label: 'Crítico / Risco' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSeverity(s.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${
                      severity === s.id
                        ? 'bg-amber-600 text-white border-amber-700'
                        : 'bg-white text-amber-900 border-amber-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Observações / Descrição */}
          <div>
            <label className="block text-xs font-semibold text-[#173F2A] mb-1">
              Anotação ou observação (opcional):
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Solo umedecido após chuva da tarde, brotação vigorosa nos ramos novos."
              className="w-full p-3 rounded-xl border border-[#D8C4A8] bg-white text-xs text-[#173F2A] focus:outline-none focus:border-[#2F7D4A]"
            />
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-[#D8C4A8]/20">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Salvar Registro
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
