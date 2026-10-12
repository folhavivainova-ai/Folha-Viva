import { useState } from 'react';
import book from '../../../docs/LIVRO_RAIZ.md?raw';
import manual from '../../../docs/MANUAL_MESTRE.md?raw';
import contracts from '../../../docs/CONTRATOS_IDENTIDADE_SYNC.md?raw';
import { Button } from '../../components/ui/Button';
export function AuditModal({ isOpen, onClose, deviceSessionId }: { isOpen: boolean; onClose: () => void; deviceSessionId: string }) {
  const [tab, setTab] = useState<'book' | 'manual' | 'contracts'>('book');
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center">
    <section role="dialog" aria-modal="true" aria-labelledby="audit-title" className="w-full max-w-2xl rounded-2xl bg-[#FFFDF7] p-5 max-h-[90vh] overflow-y-auto">
      <h2 id="audit-title" className="font-bold">Informações — Folha Viva 0.2.0</h2>
      <p className="text-xs my-2">Em validação. Identificador local do aparelho: {deviceSessionId}. A autorização remota depende da sessão Supabase Auth.</p>
      <nav className="flex flex-wrap gap-2 my-3" aria-label="Documentos do projeto">
        <Button onClick={() => setTab('book')}>Livro Raiz</Button>
        <Button onClick={() => setTab('manual')}>Norma</Button>
        <Button onClick={() => setTab('contracts')}>Contratos</Button>
      </nav>
      <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed font-sans">{tab === 'book' ? book : tab === 'manual' ? manual : contracts}</pre>
      <Button variant="outline" onClick={onClose}>Fechar</Button>
    </section>
  </div>;
}
