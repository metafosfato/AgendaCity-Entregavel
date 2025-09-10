-- ============================================
-- CORREÇÃO DAS POLÍTICAS RLS PARA ADMINISTRADORES
-- ============================================

-- Dropar política existente de eventos
DROP POLICY IF EXISTS "eventos_select_policy" ON eventos;

-- Criar nova política que permite admins verem todos os eventos
CREATE POLICY "eventos_select_policy" ON eventos
    FOR SELECT USING (
        auth.uid() = user_id OR 
        status = 'aprovado' OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Dropar política existente de eventos para update
DROP POLICY IF EXISTS "eventos_update_policy" ON eventos;

-- Criar nova política que permite admins editarem todos os eventos (para aprovação/rejeição)
CREATE POLICY "eventos_update_policy" ON eventos
    FOR UPDATE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Verificação final
SELECT 'Políticas RLS atualizadas para permitir acesso de administradores' as info;
