-- ============================================
-- CRIAÇÃO DA TABELA DE CRONOGRAMA DE EVENTOS
-- ============================================

-- Criar tabela para armazenar cronograma dos eventos
CREATE TABLE IF NOT EXISTS cronograma_eventos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE NOT NULL,
    data DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    atividade TEXT NOT NULL,
    descricao TEXT,
    local_especifico TEXT,
    responsavel TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na tabela cronograma_eventos
ALTER TABLE cronograma_eventos ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: usuários veem cronograma de seus eventos + eventos aprovados são públicos
DROP POLICY IF EXISTS "cronograma_select_policy" ON cronograma_eventos;
CREATE POLICY "cronograma_select_policy" ON cronograma_eventos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM eventos 
            WHERE eventos.id = cronograma_eventos.evento_id 
            AND (eventos.user_id = auth.uid() OR eventos.status = 'aprovado')
        )
    );

-- Política para INSERT: apenas criadores do evento podem adicionar cronograma
DROP POLICY IF EXISTS "cronograma_insert_policy" ON cronograma_eventos;
CREATE POLICY "cronograma_insert_policy" ON cronograma_eventos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM eventos 
            WHERE eventos.id = cronograma_eventos.evento_id 
            AND eventos.user_id = auth.uid()
        )
    );

-- Política para UPDATE: apenas criadores do evento podem editar cronograma
DROP POLICY IF EXISTS "cronograma_update_policy" ON cronograma_eventos;
CREATE POLICY "cronograma_update_policy" ON cronograma_eventos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM eventos 
            WHERE eventos.id = cronograma_eventos.evento_id 
            AND eventos.user_id = auth.uid()
        )
    );

-- Política para DELETE: apenas criadores do evento podem deletar cronograma
DROP POLICY IF EXISTS "cronograma_delete_policy" ON cronograma_eventos;
CREATE POLICY "cronograma_delete_policy" ON cronograma_eventos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM eventos 
            WHERE eventos.id = cronograma_eventos.evento_id 
            AND eventos.user_id = auth.uid()
        )
    );

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_cronograma_evento_id ON cronograma_eventos(evento_id);
CREATE INDEX IF NOT EXISTS idx_cronograma_data ON cronograma_eventos(data);

-- Verificação final
SELECT 'Tabela cronograma_eventos criada com sucesso!' as resultado;
