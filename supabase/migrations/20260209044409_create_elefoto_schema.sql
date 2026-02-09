-- 1. CORREÇÃO DA TABELA
-- Vamos deixar o nome do cliente opcional, já que no Admin só pedimos o Token
ALTER TABLE public.cards ALTER COLUMN client_name DROP NOT NULL;

-- 2. LIBERAR ESCRITA (INSERT) NO BANCO DE DADOS
-- Permitir criar novos cartões (Tokens)
CREATE POLICY "Enable insert for anon users" ON "public"."cards"
FOR INSERT TO anon
WITH CHECK (true);

-- Permitir salvar os dados das fotos
CREATE POLICY "Enable insert for anon users" ON "public"."photos"
FOR INSERT TO anon
WITH CHECK (true);

-- 3. CRIAR O STORAGE (ONDE OS ARQUIVOS FICAM)
-- Cria um bucket público chamado 'photos' se ele não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- 4. LIBERAR UPLOAD E VISUALIZAÇÃO NO STORAGE
-- Permitir que qualquer um veja as imagens (para a Galeria funcionar)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'photos' );

-- Permitir que qualquer um faça upload (para o seu Admin funcionar)
CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'photos' );