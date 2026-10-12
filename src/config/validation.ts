export function readClientConfig(env: Record<string, unknown>) {
  const url = String(env.VITE_SUPABASE_URL || '').trim();
  const key = String(env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();
  if (Object.keys(env).some(k => /^VITE_.*(SECRET|SERVICE_ROLE|GEMINI_API_KEY)/i.test(k) && env[k])) {
    throw new Error('Segredo não pode ser configurado no navegador.');
  }
  if (key && !key.startsWith('sb_publishable_')) throw new Error('Use uma chave pública publishable do Supabase.');
  if (url && new URL(url).protocol !== 'https:' && !/^http:\/\/(localhost|127\.0\.0\.1):/.test(url)) {
    throw new Error('A conexão de dados exige HTTPS.');
  }
  const weather = String(env.VITE_WEATHER_PROVIDER || 'open-meteo');
  if (!['open-meteo', 'disabled'].includes(weather)) throw new Error('Provedor de clima inválido.');
  if (env.VITE_SATELLITE_PROVIDER && env.VITE_SATELLITE_PROVIDER !== 'disabled') throw new Error('Integração de satélite ainda não disponível.');
  return { supabase: url && key ? { url, key } : null, weather, satellite: 'disabled' as const };
}
