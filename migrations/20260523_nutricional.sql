-- Adicionar colunas de tabela nutricional na tabela insumos
ALTER TABLE insumos
ADD COLUMN modo_preparo text,
ADD COLUMN valor_energetico_kcal numeric DEFAULT 0,
ADD COLUMN carboidratos_g numeric DEFAULT 0,
ADD COLUMN acucar_total_g numeric DEFAULT 0,
ADD COLUMN acucar_adicionado_g numeric DEFAULT 0,
ADD COLUMN proteinas_g numeric DEFAULT 0,
ADD COLUMN gorduras_totais_g numeric DEFAULT 0,
ADD COLUMN gorduras_saturadas_g numeric DEFAULT 0,
ADD COLUMN gorduras_trans_g numeric DEFAULT 0,
ADD COLUMN fibra_alimentar_g numeric DEFAULT 0,
ADD COLUMN sodio_mg numeric DEFAULT 0;
