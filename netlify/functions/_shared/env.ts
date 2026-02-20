export function getEnv(name: string, optional = false) {
  const v = process.env[name];
  if (!v && !optional) throw new Error(`Missing env var: ${name}`);
  return v ?? '';
}

export const ENV = {
  OPENAI_API_KEY: () => getEnv('OPENAI_API_KEY', true),
  SUPABASE_SERVICE_KEY: () => getEnv('SUPABASE_SERVICE_KEY', true),
  NEXT_PUBLIC_SUPABASE_URL: () => getEnv('NEXT_PUBLIC_SUPABASE_URL', true)
};

