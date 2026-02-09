import { createClient } from '@supabase/supabase-js';

// Pegando as chaves do arquivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Criando o cliente do Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);

// --- DEFINIÇÕES DE TIPOS (INTERFACES) ---

// Tipo para a Foto
export interface Photo {
  id: string;
  card_id: string;
  url: string;
  thumbnail_url: string;
  price: number;
  filename?: string; // Opcional
  created_at?: string; // Opcional
}

// Tipo para o Cartão (Token) - Caso precise no futuro
export interface Card {
  id: string;
  code: string;
  client_name?: string;
  created_at?: string;
}
