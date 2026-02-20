import { createClient } from '@supabase/supabase-js';
import { getEnv } from './env';

export function getServiceClient() {
  return createClient(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('SUPABASE_SERVICE_KEY')
  );
}
