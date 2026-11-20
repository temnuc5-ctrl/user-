import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function configurationManquante(): string[] {
  return [
    ['VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL],
    ['VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);
}

export function estConfigure(): boolean {
  return configurationManquante().length === 0;
}

export function getClient(): SupabaseClient {
  const missing = configurationManquante();
  if (missing.length) throw new Error(`Configuration Supabase manquante : ${missing.join(', ')}`);
  client ??= createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'x-application-name': 'controle-douches' } },
  });
  return client;
}

/** Course entre une promesse et un délai : évite un écran bloqué en zone blanche. */
export function avecDelai<T>(promesse: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const minuteur = setTimeout(() => reject(new Error('delai_depasse')), ms);
    promesse.then(
      (valeur) => {
        clearTimeout(minuteur);
        resolve(valeur);
      },
      (erreur) => {
        clearTimeout(minuteur);
        reject(erreur);
      },
    );
  });
}
