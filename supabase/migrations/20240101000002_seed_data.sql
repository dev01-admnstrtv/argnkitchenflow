-- Dados iniciais para o sistema

-- Inserir praças de destino
INSERT INTO public.pracas_destino (nome, descricao) VALUES
('Cozinha Principal', 'Área principal de preparo de alimentos'),
('Salão', 'Área de atendimento ao público'),
('Bar', 'Área de preparo de bebidas'),
('Estoque Seco', 'Armazenamento de produtos secos'),
('Estoque Frio', 'Armazenamento de produtos refrigerados'),
('Limpeza', 'Área de produtos de limpeza'),
('Escritório', 'Área administrativa');

-- Inserir produtos exemplo
INSERT INTO public.produtos (produto_id, descricao, grupo, subgrupo, custo, tipo) VALUES
('PROD001', 'Arroz Branco 5kg', 'Grãos', 'Arroz', 15.50, 'insumo'),
('PROD002', 'Feijão Preto 1kg', 'Grãos', 'Feijão', 8.90, 'insumo'),
('PROD003', 'Óleo de Soja 900ml', 'Óleos', 'Óleo Vegetal', 4.50, 'insumo'),
('PROD004', 'Sal Refinado 1kg', 'Condimentos', 'Sal', 2.10, 'insumo'),
('PROD005', 'Açúcar Cristal 1kg', 'Doces', 'Açúcar', 3.20, 'insumo'),
('PROD006', 'Farinha de Trigo 1kg', 'Farinhas', 'Trigo', 4.80, 'insumo'),
('PROD007', 'Leite Integral 1L', 'Laticínios', 'Leite', 5.50, 'insumo'),
('PROD008', 'Ovos 30 unidades', 'Proteínas', 'Ovos', 12.00, 'insumo'),
('PROD009', 'Carne Bovina 1kg', 'Carnes', 'Bovina', 35.00, 'insumo'),
('PROD010', 'Frango 1kg', 'Carnes', 'Frango', 18.00, 'insumo'),
('PROD011', 'Detergente Neutro 500ml', 'Limpeza', 'Detergente', 3.80, 'insumo'),
('PROD012', 'Papel Higiênico 12 rolos', 'Higiene', 'Papel', 15.90, 'insumo'),
('PROD013', 'Hambúrguer Artesanal', 'Pratos', 'Hambúrguer', 0.00, 'produzido'),
('PROD014', 'Pizza Margherita', 'Pratos', 'Pizza', 0.00, 'produzido'),
('PROD015', 'Refrigerante Lata 350ml', 'Bebidas', 'Refrigerante', 3.50, 'produto');

-- Inserir usuários exemplo (os IDs devem corresponder aos IDs do Supabase Auth)
-- Nota: Em produção, estes usuários serão criados via Supabase Auth
INSERT INTO public.usuarios (id, email, nome, perfil) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'solicitante@aragon.com', 'João Silva', 'solicitante'),
('550e8400-e29b-41d4-a716-446655440001', 'conferente@aragon.com', 'Maria Santos', 'conferente'),
('550e8400-e29b-41d4-a716-446655440002', 'entregador@aragon.com', 'Carlos Oliveira', 'entregador'),
('550e8400-e29b-41d4-a716-446655440003', 'admin@aragon.com', 'Ana Costa', 'admin');