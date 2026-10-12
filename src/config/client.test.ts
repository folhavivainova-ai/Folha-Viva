import { describe, expect, it } from 'vitest';
import { readClientConfig } from './client';
describe('configuração pública',()=>{
  it('permite cadastro sem serviços opcionais',()=>expect(readClientConfig({}).supabase).toBeNull());
  it('recusa segredo e chave privilegiada no cliente',()=>{
    expect(()=>readClientConfig({VITE_SUPABASE_SERVICE_ROLE_KEY:'segredo'})).toThrow();
    expect(()=>readClientConfig({VITE_SUPABASE_PUBLISHABLE_KEY:'sb_secret_abc'})).toThrow();
  });
});
