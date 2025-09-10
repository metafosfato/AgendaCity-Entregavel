-- ============================================
-- CONFIGURAÇÃO DO SUPABASE STORAGE
-- ============================================

-- Criar bucket para eventos (público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'eventos',
    'eventos',
    true,
    10485760, -- 10MB
    ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- POLÍTICAS PARA STORAGE EVENTOS
-- ============================================

-- Removendo políticas existentes antes de criar novas para evitar conflitos
DROP POLICY IF EXISTS "eventos_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "eventos_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "eventos_storage_update" ON storage.objects;
DROP POLICY IF EXISTS "eventos_storage_delete" ON storage.objects;

-- SELECT: Público (arquivos públicos)
CREATE POLICY "eventos_storage_select" ON storage.objects
    FOR SELECT USING (bucket_id = 'eventos');

-- INSERT: Usuários autenticados
CREATE POLICY "eventos_storage_insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'eventos' AND 
        auth.role() = 'authenticated'
    );

-- UPDATE: Usuários autenticados
CREATE POLICY "eventos_storage_update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'eventos' AND 
        auth.role() = 'authenticated'
    );

-- DELETE: Usuários autenticados
CREATE POLICY "eventos_storage_delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'eventos' AND 
        auth.role() = 'authenticated'
    );

-- Verificação final
SELECT 'Storage configurado com sucesso' as info,
       (SELECT count(*) FROM storage.buckets WHERE id = 'eventos') as bucket_count;
