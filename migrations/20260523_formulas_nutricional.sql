-- Adicionar campos nutricionais e alergênicos na tabela formulas
ALTER TABLE formulas
ADD COLUMN IF NOT EXISTS porcoes_embalagem text DEFAULT '10',
ADD COLUMN IF NOT EXISTS porcao_g numeric DEFAULT 100,
ADD COLUMN IF NOT EXISTS porcao_desc text DEFAULT '1/2 Tablete',
ADD COLUMN IF NOT EXISTS contem_lactose boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS contem_gluten boolean DEFAULT false;
