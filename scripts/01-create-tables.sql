-- ============================================
-- CRIAÇÃO DAS TABELAS PRINCIPAIS DO AGENDACITY
-- ============================================

-- Tabela de usuários (perfis públicos)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'cadastrador' CHECK (role IN ('admin', 'cadastrador', 'public')),
    status_pedido TEXT NOT NULL DEFAULT 'pendente' CHECK (status_pedido IN ('pendente', 'aprovado', 'rejeitado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de eventos
CREATE TABLE IF NOT EXISTS eventos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Dados básicos
    titulo TEXT NOT NULL,
    descricao_evento TEXT,
    local TEXT NOT NULL,
    endereco_completo TEXT NOT NULL,
    tipo_local TEXT NOT NULL,
    datas TEXT[] NOT NULL DEFAULT '{}',
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    estimativa_publico INTEGER,
    
    -- Promotor
    promotor_nome TEXT NOT NULL,
    promotor_cpf TEXT NOT NULL,
    promotor_telefone TEXT NOT NULL,
    promotor_email TEXT NOT NULL,
    
    -- Características
    musica BOOLEAN DEFAULT FALSE,
    modalidade_musica TEXT[] DEFAULT '{}',
    fins_lucrativos BOOLEAN DEFAULT FALSE,
    ingressos BOOLEAN DEFAULT FALSE,
    fechamento_rua BOOLEAN DEFAULT FALSE,
    autorizacao_sonora BOOLEAN DEFAULT FALSE,
    
    -- Links
    instagram_url TEXT,
    link_oficial TEXT,
    
    -- URLs dos arquivos
    banner_url TEXT,
    foto1_url TEXT,
    foto2_url TEXT,
    foto3_url TEXT,
    requerimento_autorizacao_url TEXT,
    projeto_evento_url TEXT,
    planta_local_url TEXT,
    avcb_bombeiros_url TEXT,
    apolice_seguro_url TEXT,
    plano_seguranca_url TEXT,
    alvara_funcionamento_url TEXT,
    autorizacao_sonora_doc_url TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('rascunho', 'pendente', 'aprovado', 'rejeitado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at na tabela eventos
DROP TRIGGER IF EXISTS update_eventos_updated_at ON eventos;
CREATE TRIGGER update_eventos_updated_at
    BEFORE UPDATE ON eventos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verificação final
SELECT 'Tabelas criadas:' as info, 
       (SELECT count(*) FROM information_schema.tables WHERE table_name = 'users') as users_table,
       (SELECT count(*) FROM information_schema.tables WHERE table_name = 'eventos') as eventos_table;
