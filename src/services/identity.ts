import { supabase } from './supabase';
import { OfflineStore } from '../offline/store';
let running: Promise<string | null> | null = null;
export function ensureIdentity(): Promise<string | null> {
  if (running) return running;
  running = (async () => {
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    let session = data.session;
    if (!session) {
      const s = await OfflineStore.snapshot();
      if (s.identity.ownerSubject) throw new Error('Sessão perdida. Os dados continuam neste aparelho; recupere sua sessão antes de enviar.');
      const result = await supabase.auth.signInAnonymously();
      if (result.error) throw new Error('Não foi possível conectar sua sessão. O cadastro pode continuar neste aparelho.');
      session = result.data.session;
    }
    if (!session) throw new Error('Sessão indisponível. Tente novamente.');
    await OfflineStore.bindIdentity(session.user.id, !!session.user.is_anonymous);
    return session.user.id;
  })().finally(() => { running = null; });
  return running;
}
