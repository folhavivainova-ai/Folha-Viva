import React, { useState } from 'react';
import { Leaf, UserCheck, UserPlus, CheckCircle2, AlertCircle, Search, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { formatCPF, isValidCPF, formatPhone, stripNonDigits } from '../../utils/cpfValidator';
import { FirestoreSyncService } from '../../services/firestoreSync';
import { ProducerProfile, Property, Plot, FieldEvent } from '../../domain/entities';

interface AuthWelcomeScreenProps {
  onLoginSuccess: (data: {
    producer: ProducerProfile;
    properties: Property[];
    plots: Plot[];
    events: FieldEvent[];
  }) => void;
  onStartRegistration: (initialData?: { cpf: string; phone: string }) => void;
}

export const AuthWelcomeScreen: React.FC<AuthWelcomeScreenProps> = ({
  onLoginSuccess,
  onStartRegistration,
}) => {
  const [mode, setMode] = useState<'choose' | 'login'>('choose');
  const [cpfInput, setCpfInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const cleanCpf = stripNonDigits(cpfInput);
  const isCpfValid = cleanCpf.length === 11 && isValidCPF(cpfInput);
  const isCpfComplete = cleanCpf.length === 11;

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCpfInput(formatted);
    if (searchError) setSearchError(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCpfValid) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const result = await FirestoreSyncService.findProducerByCPF(cpfInput);
      if (result) {
        onLoginSuccess(result);
      } else {
        setSearchError('Nenhum cadastro encontrado com este CPF no banco de dados da Folha Viva.');
      }
    } catch (err) {
      setSearchError('Erro ao consultar o banco de dados. Verifique sua conexão e tente novamente.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Cabeçalho da Marca */}
      <div className="text-center space-y-4 mb-8">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-[#2F7D4A]/10 text-[#2F7D4A] flex items-center justify-center border border-[#2F7D4A]/20 shadow-xs">
          <Leaf className="w-10 h-10" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#173F2A] tracking-tight">
            Folha Viva
          </h1>
          <p className="text-xs uppercase tracking-widest font-semibold text-[#2F7D4A]">
            Monitoramento Agrícola Inteligente
          </p>
          <p className="text-sm text-[#6B4A35] max-w-sm mx-auto leading-relaxed pt-1">
            Acompanhe o vigor da sua lavoura de café e pastagem com satélite e clima em tempo real.
          </p>
        </div>
      </div>

      {/* Escolha Inicial: Entrar ou Cadastrar */}
      {mode === 'choose' && (
        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="text-base font-bold text-[#173F2A] text-center mb-5">
              Como deseja acessar?
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Opção Entrar */}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="group p-5 rounded-2xl border-2 border-[#D8C4A8]/60 bg-white hover:border-[#2F7D4A] hover:bg-[#8BCF9B]/10 transition-all text-left flex flex-col justify-between cursor-pointer active:scale-[0.98] shadow-xs"
              >
                <div className="w-12 h-12 rounded-xl bg-[#2F7D4A]/10 text-[#2F7D4A] flex items-center justify-center mb-4 group-hover:bg-[#2F7D4A] group-hover:text-white transition-colors">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#173F2A] group-hover:text-[#2F7D4A] transition-colors">
                    Já sou cadastrado
                  </h3>
                  <p className="text-xs text-[#6B4A35] mt-1">
                    Digite apenas seu CPF para entrar na sua lavoura.
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#2F7D4A]">
                  <span>Entrar agora</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Opção Cadastrar */}
              <button
                type="button"
                onClick={() => onStartRegistration()}
                className="group p-5 rounded-2xl border-2 border-[#2F7D4A] bg-[#2F7D4A]/5 hover:bg-[#2F7D4A]/10 transition-all text-left flex flex-col justify-between cursor-pointer active:scale-[0.98] shadow-xs"
              >
                <div className="w-12 h-12 rounded-xl bg-[#2F7D4A] text-white flex items-center justify-center mb-4 shadow-xs">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#173F2A]">
                    Novo cadastro
                  </h3>
                  <p className="text-xs text-[#6B4A35] mt-1">
                    Cadastre sua propriedade, seus talhões e comece a monitorar.
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#2F7D4A]">
                  <span>Criar cadastro</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </Card>

          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 text-xs text-[#6B4A35] bg-white/60 px-3 py-1.5 rounded-full border border-[#D8C4A8]/40">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2F7D4A]" />
              <span>Acesso seguro sem senha · Dados salvos no Firebase & Offline</span>
            </span>
          </div>
        </div>
      )}

      {/* Tela de Entrar apenas com CPF */}
      {mode === 'login' && (
        <Card title="Entrar na Minha Lavoura" className="p-6">
          <form onSubmit={handleLoginSubmit} className="space-y-5 pt-2">
            <p className="text-xs text-[#6B4A35] leading-relaxed">
              Informe o CPF cadastrado. O sistema buscará sua fazenda e talhões automaticamente no banco de dados.
            </p>

            <div>
              <label htmlFor="login-cpf" className="block text-xs font-bold text-[#173F2A] uppercase tracking-wide mb-1.5">
                CPF do Produtor:
              </label>
              <div className="relative">
                <input
                  id="login-cpf"
                  type="tel"
                  inputMode="numeric"
                  value={cpfInput}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  autoFocus
                  className="w-full h-12 px-4 rounded-xl border border-[#D8C4A8] bg-white text-base text-[#173F2A] font-mono tracking-wider focus:outline-none focus:border-[#2F7D4A] focus:ring-2 focus:ring-[#2F7D4A]/20"
                />
                {isCpfComplete && (
                  <div className="absolute right-3.5 top-3.5">
                    {isCpfValid ? (
                      <CheckCircle2 className="w-5 h-5 text-[#2F7D4A]" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-[#B7372E]" />
                    )}
                  </div>
                )}
              </div>

              {/* Feedback de Validação em Tempo Real */}
              <div className="mt-2 text-xs">
                {isCpfComplete && !isCpfValid && (
                  <p className="text-[#B7372E] font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>CPF inválido segundo o algoritmo de verificação.</span>
                  </p>
                )}
                {isCpfValid && (
                  <p className="text-[#2F7D4A] font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Formato e dígitos verificadores válidos.</span>
                  </p>
                )}
                {!isCpfComplete && cpfInput.length > 0 && (
                  <p className="text-[#6B4A35]">
                    Digite os 11 números do seu CPF.
                  </p>
                )}
              </div>
            </div>

            {searchError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 space-y-2">
                <p>{searchError}</p>
                <button
                  type="button"
                  onClick={() => onStartRegistration({ cpf: cpfInput, phone: '' })}
                  className="font-bold text-[#2F7D4A] hover:underline block"
                >
                  Clique aqui para iniciar um novo cadastro com este CPF →
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-[#D8C4A8]/20">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setMode('choose');
                  setSearchError(null);
                }}
                className="w-full sm:w-auto"
              >
                Voltar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!isCpfValid || isSearching}
                className="w-full flex-1"
                icon={<Search className="w-4 h-4" />}
              >
                {isSearching ? 'Buscando cadastro...' : 'Localizar Minha Lavoura'}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};
