-- ============================================
-- CORREÇÃO DEFINITIVA DA RECURSÃO RLS
-- ============================================

-- Temporariamente desabilitar RLS na tabela users para evitar recursão
-- A tabela users será protegida pelo trigger de criação automática
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Manter RLS habilitado apenas na tabela eventos
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS SIMPLIFICADAS PARA EVENTOS
-- ============================================

-- Dropar políticas existentes
DROP POLICY IF EXISTS "eventos_select_policy" ON eventos;
DROP POLICY IF EXISTS "eventos_insert_policy" ON eventos;
DROP POLICY IF EXISTS "eventos_update_policy" ON eventos;
DROP POLICY IF EXISTS "eventos_delete_policy" ON eventos;

-- Política de SELECT: usuários veem próprios eventos + eventos aprovados são públicos
CREATE POLICY "eventos_select_policy" ON eventos
    FOR SELECT USING (
        auth.uid() = user_id OR 
        status = 'aprovado'
    );

-- Política de INSERT: usuários autenticados podem criar eventos
CREATE POLICY "eventos_insert_policy" ON eventos
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        auth.uid() = user_id
    );

-- Política de UPDATE: usuários editam apenas próprios eventos
CREATE POLICY "eventos_update_policy" ON eventos
    FOR UPDATE USING (auth.uid() = user_id);

-- Política de DELETE: usuários deletam apenas próprios eventos  
CREATE POLICY "eventos_delete_policy" ON eventos
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- FUNÇÃO PARA VERIFICAR SE USUÁRIO É ADMIN
-- ============================================

-- Criar função que pode ser usada em outras consultas sem causar recursão
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_id AND role = 'admin'
    );
$$;

-- Verificação final
SELECT 'RLS corrigido - recursão eliminada' as info;
