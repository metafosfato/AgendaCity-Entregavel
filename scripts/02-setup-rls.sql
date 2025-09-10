-- ============================================
-- CONFIGURAÇÃO DE ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS nas tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS PARA TABELA USERS
-- ============================================

-- Removendo IF NOT EXISTS e usando DROP/CREATE para evitar erro de sintaxe
-- Dropar políticas existentes se houver
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;

-- Simplificando política para evitar recursão infinita - usuários podem ver próprio perfil
CREATE POLICY "users_select_policy" ON users
    FOR SELECT USING (auth.uid() = id);

-- Apenas via trigger de signup (será criado no próximo script)
CREATE POLICY "users_insert_policy" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Política de update simplificada - apenas o próprio usuário pode atualizar
CREATE POLICY "users_update_policy" ON users
    FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- POLÍTICAS PARA TABELA EVENTOS
-- ============================================

-- Dropar políticas existentes se houver
DROP POLICY IF EXISTS "eventos_select_policy" ON eventos;
DROP POLICY IF EXISTS "eventos_insert_policy" ON eventos;
DROP POLICY IF EXISTS "eventos_update_policy" ON eventos;
DROP POLICY IF EXISTS "eventos_delete_policy" ON eventos;

-- Política simplificada para eventos - usuários veem próprios eventos, eventos aprovados são públicos
CREATE POLICY "eventos_select_policy" ON eventos
    FOR SELECT USING (
        auth.uid() = user_id OR 
        status = 'aprovado'
    );

-- Usuários autenticados podem criar
CREATE POLICY "eventos_insert_policy" ON eventos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários editam apenas próprios eventos
CREATE POLICY "eventos_update_policy" ON eventos
    FOR UPDATE USING (auth.uid() = user_id);

-- Usuários deletam apenas próprios eventos
CREATE POLICY "eventos_delete_policy" ON eventos
    FOR DELETE USING (auth.uid() = user_id);

-- Verificação final
SELECT 'Políticas RLS criadas com sucesso' as info;
