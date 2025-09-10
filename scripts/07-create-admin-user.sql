-- ============================================
-- SCRIPT PARA CRIAR USUÁRIO ADMINISTRADOR
-- ============================================

-- Opção 1: Promover um usuário existente para admin
-- Substitua 'email@exemplo.com' pelo email do usuário que deve ser admin
UPDATE users 
SET role = 'admin', status_pedido = 'aprovado'
WHERE id = (
    SELECT id FROM auth.users 
    WHERE email = 'email@exemplo.com'
);

-- Opção 2: Verificar usuários existentes para escolher qual promover
SELECT 
    u.id,
    au.email,
    u.nome,
    u.role,
    u.status_pedido,
    u.created_at
FROM users u
JOIN auth.users au ON u.id = au.id
ORDER BY u.created_at;

-- Opção 3: Promover o primeiro usuário cadastrado para admin (use com cuidado)
-- UPDATE users 
-- SET role = 'admin', status_pedido = 'aprovado'
-- WHERE id = (
--     SELECT id FROM users 
--     ORDER BY created_at ASC 
--     LIMIT 1
-- );

-- Verificação final - listar todos os admins
SELECT 
    u.nome,
    au.email,
    u.role,
    u.status_pedido
FROM users u
JOIN auth.users au ON u.id = au.id
WHERE u.role = 'admin';
