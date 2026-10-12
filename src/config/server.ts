// Exclusivo do servidor; nenhum componente importa este módulo.
export function readServerConfig(env: Record<string, string | undefined>) {
  if (Object.keys(env).some(k => /^VITE_.*(SECRET|SERVICE_ROLE|GEMINI_API_KEY)/i.test(k) && env[k])) throw new Error('Remova o prefixo público dos segredos.');
  return { geminiApiKey: env.GEMINI_API_KEY || null, serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || null };
}
