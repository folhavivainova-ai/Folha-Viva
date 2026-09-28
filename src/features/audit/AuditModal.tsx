import React, { useState } from 'react';
import { X, BookOpen, Database, Shield, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceSessionId: string;
}

export const AuditModal: React.FC<AuditModalProps> = ({
  isOpen,
  onClose,
  deviceSessionId,
}) => {
  const [activeTab, setActiveTab] = useState<'livro_raiz' | 'manual' | 'contratos' | 'seguranca'>('livro_raiz');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-[#FFFDF7] p-5 sm:p-6 shadow-2xl border border-[#D8C4A8] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-[#D8C4A8]/30">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#173F2A] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#2F7D4A]" />
              <span>Auditoria Técnica & Livro Raiz</span>
            </h3>
            <p className="text-xs text-[#6B4A35]">
              Volume 00-E03: Norma de projeto, governança e conformidade
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-500 hover:bg-stone-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-[#D8C4A8]/30 pt-3 gap-2 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('livro_raiz')}
            className={`pb-2 px-2.5 whitespace-nowrap border-b-2 cursor-pointer transition ${
              activeTab === 'livro_raiz'
                ? 'border-[#2F7D4A] text-[#173F2A] font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Livro Raiz (Execução)
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`pb-2 px-2.5 whitespace-nowrap border-b-2 cursor-pointer transition ${
              activeTab === 'manual'
                ? 'border-[#2F7D4A] text-[#173F2A] font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Manual Mestre v1.0
          </button>
          <button
            onClick={() => setActiveTab('contratos')}
            className={`pb-2 px-2.5 whitespace-nowrap border-b-2 cursor-pointer transition ${
              activeTab === 'contratos'
                ? 'border-[#2F7D4A] text-[#173F2A] font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Contratos & Banco
          </button>
          <button
            onClick={() => setActiveTab('seguranca')}
            className={`pb-2 px-2.5 whitespace-nowrap border-b-2 cursor-pointer transition ${
              activeTab === 'seguranca'
                ? 'border-[#2F7D4A] text-[#173F2A] font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Identidade Invisível
          </button>
        </div>

        {/* Conteúdo com rolagem */}
        <div className="flex-1 overflow-y-auto py-4 text-xs text-[#173F2A] space-y-4">
          {activeTab === 'livro_raiz' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-white rounded-xl border border-[#D8C4A8]/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#173F2A]">
                    Execução V00-V03: Fundação Técnica Inicial
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Homologado
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#6B4A35]">
                  <div><strong>Data:</strong> 27/09/2026</div>
                  <div><strong>Versão:</strong> 1.0 Canônica</div>
                  <div><strong>Dados fictícios:</strong> Nenhum (Estrutura pura)</div>
                  <div><strong>Offline:</strong> Ativo via PWA & Store Local</div>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed border-t border-stone-100 pt-2">
                  Implementação inicial completa sem criação de dados simulados. A plataforma inicia em estado limpo com formulário de cadastro real (produtor, propriedade, GPS e talhão desenhado) e visualização de clima real via API aberta sem chaves.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="space-y-2.5 bg-white p-4 rounded-xl border border-[#D8C4A8]/40 leading-relaxed">
              <h4 className="font-bold text-sm text-[#173F2A]">Diretrizes Normativas V1</h4>
              <ul className="list-disc pl-4 space-y-1.5 text-stone-700">
                <li><strong>Culturas V1:</strong> Exclusivamente Café (Clonal e Não clonal) e Capim/Pastagem.</li>
                <li><strong>Florada do Café:</strong> Módulo e notificações de janela provável exclusivos de talhões de Café.</li>
                <li><strong>Satélite e Clima:</strong> Fontes de evidência transparentes; nenhuma recomendação simulada sem suporte.</li>
                <li><strong>Design do Cafeeiro:</strong> Folha Profunda (#173F2A), Folha Viva (#2F7D4A), Florada (#FFFDF7).</li>
              </ul>
            </div>
          )}

          {activeTab === 'contratos' && (
            <div className="space-y-2.5 bg-white p-4 rounded-xl border border-[#D8C4A8]/40">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <h4 className="font-bold text-sm text-[#173F2A]">Banco de Dados Ativo</h4>
                <span className="text-[11px] font-semibold text-[#2F7D4A] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Provisionado na Nuvem
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-[11px] space-y-1 text-stone-700">
                <div><strong>Projeto GCP:</strong> <code>gen-lang-client-0815660984</code></div>
                <div><strong>Região:</strong> <code>us-east1</code></div>
                <div><strong>ID do Banco:</strong> <code className="text-[#2F7D4A]">ai-studio-folhaviva-bcbe6de4-6fb7-4087-8be0-5a49bfd455f9</code></div>
                <div><strong>Segurança:</strong> Regras ABAC + Default-Deny implantadas</div>
              </div>
              <h5 className="font-semibold text-xs text-[#173F2A] pt-2">Esquema Canônico & Migrações</h5>
              <div className="grid grid-cols-2 gap-2 font-mono text-[10px] text-stone-700 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                <div>• producers</div>
                <div>• properties</div>
                <div>• plots (Polygon 4326)</div>
                <div>• field_events (append-only)</div>
                <div>• crop_cycles</div>
                <div>• satellite_scenes</div>
                <div>• weather_series</div>
                <div>• irrigation_assessments</div>
              </div>
            </div>
          )}

          {activeTab === 'seguranca' && (
            <div className="space-y-3 bg-white p-4 rounded-xl border border-[#D8C4A8]/40">
              <div className="flex items-center gap-2 text-sm font-bold text-[#173F2A]">
                <Shield className="w-4 h-4 text-[#2F7D4A]" />
                <span>Identidade Invisível Ativa (V02-E01)</span>
              </div>
              <p className="text-stone-600 text-xs">
                O produtor não precisa de login ou senha na V1. Seu aparelho recebe uma chave anônima persistida localmente:
              </p>
              <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 font-mono text-[11px] text-stone-800 break-all select-all">
                {deviceSessionId}
              </div>
              <p className="text-[11px] text-[#6B4A35]">
                Esta chave garante a segregação de dados (RLS) e permitirá vincular a fazenda a uma conta definitiva de e-mail na migração futura (V19).
              </p>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-[#D8C4A8]/30 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};
