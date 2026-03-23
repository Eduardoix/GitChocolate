-- 1. Adicionar a coluna user_id a todas as tabelas e definir a restrição
-- Ao usar DEFAULT auth.uid(), não precisamos de alterar o código front-end (React)
-- pois o base de dados preencherá automaticamente com o ID do utilizador logado.

ALTER TABLE insumos ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE formulas ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE formula_itens ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE produtos ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE bateladas ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE estoque ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- 2. Remover as políticas antigas existentes ("Allow authenticated full access")
DROP POLICY IF EXISTS "Allow authenticated full access" ON insumos;
DROP POLICY IF EXISTS "Allow authenticated full access" ON formulas;
DROP POLICY IF EXISTS "Allow authenticated full access" ON formula_itens;
DROP POLICY IF EXISTS "Allow authenticated full access" ON produtos;
DROP POLICY IF EXISTS "Allow authenticated full access" ON bateladas;
DROP POLICY IF EXISTS "Allow authenticated full access" ON estoque;

-- 3. Criar as novas políticas restritas (Row Level Security)

-- Políticas para: insumos
CREATE POLICY "Users can view their own insumos" ON insumos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own insumos" ON insumos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own insumos" ON insumos FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own insumos" ON insumos FOR DELETE USING (auth.uid() = user_id);

-- Políticas para: formulas
CREATE POLICY "Users can view their own formulas" ON formulas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own formulas" ON formulas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own formulas" ON formulas FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own formulas" ON formulas FOR DELETE USING (auth.uid() = user_id);

-- Políticas para: formula_itens
CREATE POLICY "Users can view their own formula_itens" ON formula_itens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own formula_itens" ON formula_itens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own formula_itens" ON formula_itens FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own formula_itens" ON formula_itens FOR DELETE USING (auth.uid() = user_id);

-- Políticas para: produtos
CREATE POLICY "Users can view their own produtos" ON produtos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own produtos" ON produtos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own produtos" ON produtos FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own produtos" ON produtos FOR DELETE USING (auth.uid() = user_id);

-- Políticas para: bateladas
CREATE POLICY "Users can view their own bateladas" ON bateladas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own bateladas" ON bateladas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bateladas" ON bateladas FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own bateladas" ON bateladas FOR DELETE USING (auth.uid() = user_id);

-- Políticas para: estoque
CREATE POLICY "Users can view their own estoque" ON estoque FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own estoque" ON estoque FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own estoque" ON estoque FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own estoque" ON estoque FOR DELETE USING (auth.uid() = user_id);
