export function getEnv(name: string, optional = false) {
  const v = process.env[name];
  if (!v && !optional) throw new Error(`Missing env var: ${name}`);
  return v ?? '';
}

export const ENV = {
  AWS_ACCESS_KEY_ID: () => getEnv('AWS_ACCESS_KEY_ID', true),
  AWS_SECRET_ACCESS_KEY: () => getEnv('AWS_SECRET_ACCESS_KEY', true),
  AWS_REGION: () => getEnv('AWS_REGION', true),
  AWS_BUCKET_NAME: () => getEnv('AWS_BUCKET_NAME', true),
  OPENAI_API_KEY: () => getEnv('OPENAI_API_KEY', true),
  SUPABASE_SERVICE_KEY: () => getEnv('SUPABASE_SERVICE_KEY', true),
  NEXT_PUBLIC_SUPABASE_URL: () => getEnv('NEXT_PUBLIC_SUPABASE_URL', true)
};

