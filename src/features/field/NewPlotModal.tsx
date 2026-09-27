import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { OpenMapView } from '../map/OpenMapView';
import { CropType, CoffeeSubtype, Plot } from '../../domain/entities';
import { generateUUID } from '../../offline/store';

interface NewPlotModalProps {
  propertyId: string;
  isOpen: boolean;
  onClose: () => void;
  onSavePlot: (plot: Plot) => void;
  centerCoord?: [number, number];
}

export const NewPlotModal: React.FC<NewPlotModalProps> = ({
  propertyId,
  isOpen,
  onClose,
  onSavePlot,
  centerCoord = [-20.0, -44.0],
}) => {
  const [name, setName] = useState('');
  const [cropType, setCropType] = useState<CropType>('coffee');
  const [coffeeSubtype, setCoffeeSubtype] = useState<CoffeeSubtype>('convencional');
  const [cultivar, setCultivar] = useState('');
  const [polygonCoords, setPolygonCoords] = useState<[number, number][]>([]);
  const [areaHa, setAreaHa] = useState<number>(0);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim() || polygonCoords.length < 3) return;

    const plotId = generateUUID();
    const newPlot: Plot = {
      id: plotId,
      propertyId,
      name: name.trim(),
      geometry: {
        type: 'Polygon',
        coordinates: polygonCoords,
      },
      areaHa,
      active: true,
      createdAt: new Date().toISOString(),
      cropCycle: {
        id: generateUUID(),
        plotId,
        cropType,
        subtype: cropType === 'coffee' ? coffeeSubtype : undefined,
        cultivar: cultivar.trim() || undefined,
        startDate: new Date().toISOString().split('T')[0],
      },
    };

    onSavePlot(newPlot);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-[#FFFDF7] p-5 shadow-2xl border border-[#D8C4A8] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#D8C4A8]/30">
          <div>
            <h3 className="text-base font-bold text-[#173F2A]">Cadastrar Novo Talhão</h3>
            <p className="text-xs text-[#6B4A35]">Desenhe a área no mapa e identifique a cultura</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-500 hover:bg-stone-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#173F2A] mb-1">
                Nome do Talhão:
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Talhão Novo, Pasto 2"
                className="w-full h-10 px-3 rounded-xl border border-[#D8C4A8] bg-white text-xs text-[#173F2A] focus:outline-none focus:border-[#2F7D4A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#173F2A] mb-1">
                Cultura:
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCropType('coffee')}
                  className={`flex-1 h-10 rounded-xl border text-xs font-medium cursor-pointer ${
                    cropType === 'coffee'
                      ? 'bg-[#2F7D4A] text-white border-[#2F7D4A]'
                      : 'bg-white text-stone-700 border-stone-200'
                  }`}
                >
                  Café
                </button>
                <button
                  type="button"
                  onClick={() => setCropType('pasture')}
                  className={`flex-1 h-10 rounded-xl border text-xs font-medium cursor-pointer ${
                    cropType === 'pasture'
                      ? 'bg-[#2F7D4A] text-white border-[#2F7D4A]'
                      : 'bg-white text-stone-700 border-stone-200'
                  }`}
                >
                  Capim
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#173F2A] mb-1">
              Variedade / Cultivar (opcional):
            </label>
            <input
              type="text"
              value={cultivar}
              onChange={(e) => setCultivar(e.target.value)}
              placeholder="Ex: Catuaí, Conilon, Brachiaria, Mombaça"
              className="w-full h-10 px-3 rounded-xl border border-[#D8C4A8] bg-white text-xs text-[#173F2A] focus:outline-none focus:border-[#2F7D4A]"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-[#173F2A]">
                Desenho da Área:
              </label>
              {areaHa > 0 && (
                <span className="text-xs font-bold text-[#2F7D4A]">
                  {areaHa} hectares calculados
                </span>
              )}
            </div>
            <OpenMapView
              center={centerCoord}
              zoom={15}
              isDrawingPlot={true}
              drawingCropType={cropType}
              onPolygonCreated={(coords, area) => {
                setPolygonCoords(coords);
                setAreaHa(area);
              }}
              className="h-64"
            />
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-[#D8C4A8]/20">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              disabled={!name.trim() || polygonCoords.length < 3}
              onClick={handleSave}
            >
              Salvar Talhão
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
