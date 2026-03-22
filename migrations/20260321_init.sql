-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Insumos (Ingredients)
CREATE TABLE IF NOT EXISTS insumos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    unidade TEXT NOT NULL CHECK (unidade IN ('g', 'kg', 'un')),
    custo_unitario NUMERIC(10, 2) NOT NULL DEFAULT 0,
    
    -- Eutectic & Nutrition Base
    perc_gordura_total NUMERIC(5, 2) DEFAULT 0,
    perc_gordura_lactea NUMERIC(5, 2) DEFAULT 0,
    perc_manteiga_cacau NUMERIC(5, 2) DEFAULT 0,
    
    -- Nutritional Info (per 100g)
    kcal_100g NUMERIC(6, 2) DEFAULT 0,
    carboidratos_g NUMERIC(5, 2) DEFAULT 0,
    acucares_totais_g NUMERIC(5, 2) DEFAULT 0,
    acucares_adicionados_g NUMERIC(5, 2) DEFAULT 0,
    proteinas_g NUMERIC(5, 2) DEFAULT 0,
    gorduras_totais_g NUMERIC(5, 2) DEFAULT 0,
    gorduras_saturadas_g NUMERIC(5, 2) DEFAULT 0,
    gorduras_trans_g NUMERIC(5, 2) DEFAULT 0,
    fibras_g NUMERIC(5, 2) DEFAULT 0,
    sodio_mg NUMERIC(6, 2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Fórmulas (Recipes)
CREATE TABLE IF NOT EXISTS formulas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    descricao TEXT,
    shelf_life_dias INTEGER DEFAULT 365,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Itens da Fórmula (Formula Items)
CREATE TABLE IF NOT EXISTS formula_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    formula_id UUID REFERENCES formulas(id) ON DELETE CASCADE,
    insumo_id UUID REFERENCES insumos(id),
    percentual NUMERIC(5, 2) NOT NULL, -- Total per formula should be 100%
    UNIQUE(formula_id, insumo_id)
);

-- 4. Produtos de Venda (Commercial Products)
CREATE TABLE IF NOT EXISTS produtos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    formula_id UUID REFERENCES formulas(id),
    peso_liquido_g NUMERIC(10, 2) NOT NULL,
    custo_embalagem NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Bateladas (Production Batches)
CREATE TABLE IF NOT EXISTS bateladas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    formula_id UUID REFERENCES formulas(id),
    data_producao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    volume_total_kg NUMERIC(10, 2) NOT NULL,
    custo_total_materia_prima NUMERIC(10, 2),
    lote_interno TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Estoque de Produtos Acabados
CREATE TABLE IF NOT EXISTS estoque (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    produto_id UUID REFERENCES produtos(id),
    batelada_id UUID REFERENCES bateladas(id),
    quantidade INTEGER NOT NULL DEFAULT 0,
    data_validade DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) - Simplified for start
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE formula_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE bateladas ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque ENABLE ROW LEVEL SECURITY;

-- Basic policy: Allow authenticated access
CREATE POLICY "Allow authenticated full access" ON insumos FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access" ON formulas FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access" ON formula_itens FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access" ON produtos FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access" ON bateladas FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access" ON estoque FOR ALL TO authenticated USING (true);
