import React, { useState, useEffect } from 'react';
import { Tag, Save, Printer, Plus, Trash2, Smartphone, Globe, Clipboard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import NutritionalLabel from '../components/NutritionalLabel';

const Etiquetas = () => {
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'estoque'
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loading, setLoading] = useState(false);

  // Stock data
  const [produtos, setProdutos] = useState([]);
  const [bateladas, setBateladas] = useState([]);
  
  // Current Label State
  const [labelConfig, setLabelConfig] = useState({
    showTitle: true,
    showLogo: false,
    logoUrl: '',
    showQR: true,
    qrType: 'instagram',
    qrValue: 'https://instagram.com/seuperfil',
    showLote: true,
    showValidade: true,
    showIngredients: true,
    fontSize: 0.75,
    width: 300,
    portionSize: 25,
    portionDescription: '3 quadradinhos',
  });

  const [labelData, setLabelData] = useState({
    title: 'Chocolate Artesanal',
    lote: 'L001',
    validade: '25/12/2026',
    nutritional: {
      kcal: 0, carb: 0, sugarTotal: 0, sugarAdded: 0,
      protein: 0, fatTotal: 0, fatSat: 0, fatTrans: 0,
      fiber: 0, sodium: 0
    },
    ingredients: []
  });

  const fetchData = async () => {
    setLoading(true);
    const { data: tData } = await supabase.from('etiqueta_modelos').select('*').order('nome');
    setTemplates(tData || []);

    const { data: pData } = await supabase.from('produtos').select('*, formulas(*)');
    setProdutos(pData || []);

    const { data: bData } = await supabase.from('bateladas').select('*, formulas(*)').eq('status', 'concluido').order('data_producao', { ascending: false });
    setBateladas(bData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const calculateNutrition = (items) => {
    const gTotal = items.reduce((acc, curr) => acc + (curr.percentual * Number(curr.insumos?.perc_gordura_total || 0) / 100), 0);
    
    return {
      kcal: Math.round(items.reduce((acc, curr) => acc + (curr.percentual * Number(curr.insumos?.kcal_100g || 0) / 100), 0)),
      carb: Math.round(items.reduce((acc, curr) => acc + (curr.percentual * Number(curr.insumos?.carboidratos_g || 0) / 100), 0)),
      sugarTotal: Math.round(items.reduce((acc, curr) => acc + (curr.percentual * Number(curr.insumos?.acucares_totais_g || 0) / 100), 0)),
      sugarAdded: Math.round(items.reduce((acc, curr) => acc + (curr.percentual * Number(curr.insumos?.acucares_adicionados_g || 0) / 100), 0)),
      protein: Math.round(items.reduce((acc, curr) => acc + (curr.percentual * Number(curr.insumos?.proteinas_g || 0) / 100), 0)),
      fatTotal: Math.round(gTotal),
      fatSat: Math.round(items.reduce((acc, curr) => acc + (curr.percentual * Number(curr.insumos?.gorduras_saturadas_g || 0) / 100), 0)),
      fatTrans: 0,
      fiber: Math.round(items.reduce((acc, curr) => acc + (curr.percentual * Number(curr.insumos?.fibras_g || 0) / 100), 0)),
      sodium: Math.round(items.reduce((acc, curr) => acc + (curr.percentual * Number(curr.insumos?.sodio_mg || 0) / 100), 0)),
    };
  };

  const handleSaveTemplate = async () => {
    const nome = prompt('Nome do modelo:');
    if (!nome) return;

    const { error } = await supabase.from('etiqueta_modelos').insert([{
      nome,
      config: labelConfig
    }]);

    if (error) alert('Erro ao salvar modelo: ' + error.message);
    else fetchData();
  };

  const loadTemplate = (id) => {
    const t = templates.find(item => item.id === id);
    if (t) {
      setLabelConfig({...t.config});
      setSelectedTemplate(id);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const selectFromStock = async (type, item) => {
    setLoading(true);
    const formulaId = item.formula_id;
    if (!formulaId) {
      alert('Este item não possui uma fórmula vinculada.');
      setLoading(false);
      return;
    }

    const { data: items, error } = await supabase
      .from('formula_itens')
      .select('*, insumos(*)')
      .eq('formula_id', formulaId);

    if (error) {
      alert('Erro ao buscar dados da fórmula: ' + error.message);
    } else {
      const nutrition = calculateNutrition(items);
      const ingredients = items.map(it => ({
        nome: it.insumos.nome,
        perc: it.percentual
      }));

      setLabelData({
        ...labelData,
        title: item.nome || item.formulas?.nome,
        lote: item.lote || labelData.lote,
        nutritional: nutrition,
        ingredients: ingredients
      });
    }
    setLoading(false);
  };

  return (
    <div className="etiquetas-page">
      <div className="page-header no-print">
        <div>
          <h1>Central de Etiquetas</h1>
          <p className="text-muted">Personalize e imprima informações nutricionais.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-2" onClick={handleSaveTemplate}>
            <Save size={18} /> Salvar Modelo
          </button>
          <button className="btn-primary flex items-center gap-2" onClick={handlePrint}>
            <Printer size={18} /> Imprimir
          </button>
        </div>
      </div>

      <div className="etiquetas-layout">
        {/* Sidebar de Configuração */}
        <aside className="label-config-sidebar no-print">
          <div className="card-sidebar">
            <h3 className="section-title"><Tag size={18} /> Modelos Salvos</h3>
            <select 
              className="select-field mt-2" 
              value={selectedTemplate} 
              onChange={(e) => loadTemplate(e.target.value)}
            >
              <option value="">Selecione um modelo...</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>

            <div className="tabs-mini mt-4">
              <button 
                className={`tab-mini-btn ${activeTab === 'manual' ? 'active' : ''}`}
                onClick={() => setActiveTab('manual')}
              >
                Manual
              </button>
              <button 
                className={`tab-mini-btn ${activeTab === 'estoque' ? 'active' : ''}`}
                onClick={() => setActiveTab('estoque')}
              >
                Do Estoque
              </button>
            </div>

            {activeTab === 'manual' ? (
              <div className="config-form mt-4">
                <div className="input-group">
                  <label>Título do Produto</label>
                  <input 
                    type="text" 
                    value={labelData.title} 
                    onChange={e => setLabelData({...labelData, title: e.target.value})} 
                  />
                </div>
                <div className="flex gap-2">
                  <div className="input-group flex-1">
                    <label>Lote</label>
                    <input 
                      type="text" 
                      value={labelData.lote} 
                      onChange={e => setLabelData({...labelData, lote: e.target.value})} 
                    />
                  </div>
                  <div className="input-group flex-1">
                    <label>Validade</label>
                    <input 
                      type="text" 
                      value={labelData.validade} 
                      onChange={e => setLabelData({...labelData, validade: e.target.value})} 
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="stock-selection mt-4">
                <label className="text-xs font-bold uppercase text-muted">Produtos Finais</label>
                <div className="stock-list">
                  {produtos.map(p => (
                    <button key={p.id} className="stock-item-btn" onClick={() => selectFromStock('produto', p)}>
                      {p.nome}
                    </button>
                  ))}
                </div>
                <label className="text-xs font-bold uppercase text-muted mt-3 block">Lotes Prontos (Massa)</label>
                <div className="stock-list">
                  {bateladas.map(b => (
                    <button key={b.id} className="stock-item-btn" onClick={() => selectFromStock('batelada', b)}>
                      Lote {b.lote} - {b.formulas?.nome}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <hr className="my-4" />

            <h3 className="section-title">Opções Visuais</h3>
            <div className="toggle-list mt-3">
              <label className="toggle-item">
                <input 
                  type="checkbox" 
                  checked={labelConfig.showLogo} 
                  onChange={e => setLabelConfig({...labelConfig, showLogo: e.target.checked})} 
                />
                Exibir Logo
              </label>
              {labelConfig.showLogo && (
                <div className="input-mini-container pl-4">
                  <input 
                    type="text" 
                    className="input-mini"
                    placeholder="URL do Logo"
                    value={labelConfig.logoUrl}
                    onChange={e => setLabelConfig({...labelConfig, logoUrl: e.target.value})}
                  />
                </div>
              )}
              <label className="toggle-item">
                <input 
                  type="checkbox" 
                  checked={labelConfig.showTitle} 
                  onChange={e => setLabelConfig({...labelConfig, showTitle: e.target.checked})} 
                />
                Exibir Título
              </label>
              <label className="toggle-item">
                <input 
                  type="checkbox" 
                  checked={labelConfig.showLote} 
                  onChange={e => setLabelConfig({...labelConfig, showLote: e.target.checked})} 
                />
                Exibir Lote
              </label>
              <label className="toggle-item">
                <input 
                  type="checkbox" 
                  checked={labelConfig.showValidade} 
                  onChange={e => setLabelConfig({...labelConfig, showValidade: e.target.checked})} 
                />
                Exibir Validade
              </label>
              <label className="toggle-item">
                <input 
                  type="checkbox" 
                  checked={labelConfig.showIngredients} 
                  onChange={e => setLabelConfig({...labelConfig, showIngredients: e.target.checked})} 
                />
                Exibir Ingredientes
              </label>
            </div>

            <div className="qr-config mt-4">
              <label className="toggle-item">
                <input 
                  type="checkbox" 
                  checked={labelConfig.showQR} 
                  onChange={e => setLabelConfig({...labelConfig, showQR: e.target.checked})} 
                />
                Exibir QR Code
              </label>
              {labelConfig.showQR && (
                <div className="flex-column gap-2 mt-2 pl-4">
                  <div className="flex gap-1">
                    <button 
                      className={`btn-icon-mini ${labelConfig.qrType === 'instagram' ? 'active' : ''}`}
                      onClick={() => setLabelConfig({...labelConfig, qrType: 'instagram'})}
                    >
                      <Smartphone size={16} />
                    </button>
                    <button 
                      className={`btn-icon-mini ${labelConfig.qrType === 'site' ? 'active' : ''}`}
                      onClick={() => setLabelConfig({...labelConfig, qrType: 'site'})}
                    >
                      <Globe size={16} />
                    </button>
                  </div>
                  <input 
                    type="text" 
                    className="input-mini"
                    placeholder="Link (Instagram/Site)"
                    value={labelConfig.qrValue}
                    onChange={e => setLabelConfig({...labelConfig, qrValue: e.target.value})}
                  />
                </div>
              )}
            </div>

            <div className="layout-config mt-4">
              <h3 className="section-title">Porção e Layout</h3>
              <div className="flex gap-2 mb-2">
                <div className="input-group flex-1">
                  <label>Porção (g)</label>
                  <input 
                    type="number" 
                    value={labelConfig.portionSize}
                    onChange={e => setLabelConfig({...labelConfig, portionSize: parseInt(e.target.value)})}
                  />
                </div>
                <div className="input-group flex-1">
                  <label>Desc. (ex: 3 quad.)</label>
                  <input 
                    type="text" 
                    value={labelConfig.portionDescription}
                    onChange={e => setLabelConfig({...labelConfig, portionDescription: e.target.value})}
                  />
                </div>
              </div>
              <div className="input-group">
                <label>Largura da Etiqueta (px)</label>
                <input 
                  type="number" 
                  value={labelConfig.width}
                  onChange={e => setLabelConfig({...labelConfig, width: parseInt(e.target.value)})}
                />
              </div>
              <div className="input-group">
                <label>Tamanho da Fonte (rem)</label>
                <input 
                  type="number" 
                  step="0.05"
                  value={labelConfig.fontSize}
                  onChange={e => setLabelConfig({...labelConfig, fontSize: parseFloat(e.target.value)})}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Área de Preview */}
        <main className="label-preview-area">
          <div className="preview-container">
            <span className="preview-tag no-print">Pré-visualização</span>
            <div className="print-surface">
              <NutritionalLabel 
                data={labelData.nutritional}
                ingredients={labelData.ingredients}
                config={labelConfig}
                title={labelData.title}
                lote={labelData.lote}
                validade={labelData.validade}
                portionSize={labelConfig.portionSize}
                portionDescription={labelConfig.portionDescription}
              />
            </div>
          </div>

          <div className="print-instructions no-print card mt-4">
            <h4 className="flex items-center gap-2"><Printer size={18} /> Dicas de Impressão</h4>
            <ul>
              <li>Use papéis adesivos fotográficos para melhor acabamento.</li>
              <li>Configure sua impressora para "Alta Qualidade".</li>
              <li>Na janela de impressão, remova "Cabeçalhos e Rodapés".</li>
            </ul>
          </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .etiquetas-page { padding: 20px; }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .etiquetas-layout { display: grid; grid-template-columns: 320px 1fr; gap: 30px; }
        
        .card-sidebar { background: white; padding: 20px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .section-title { font-size: 0.9rem; font-weight: 700; color: var(--primary); display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
        
        .tabs-mini { display: flex; background: #f5f5f5; padding: 4px; border-radius: 8px; }
        .tab-mini-btn { flex: 1; border: none; padding: 8px; font-size: 0.8rem; font-weight: 600; cursor: pointer; border-radius: 6px; background: transparent; transition: all 0.2s; }
        .tab-mini-btn.active { background: white; color: var(--primary); box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        
        .input-group label { font-size: 0.75rem; font-weight: 700; color: #888; margin-bottom: 4px; display: block; }
        .input-group input, .select-field { width: 100%; border: 1px solid #ddd; padding: 10px; border-radius: 8px; font-size: 0.9rem; }
        
        .toggle-list { display: flex; flex-direction: column; gap: 10px; }
        .toggle-item { display: flex; align-items: center; gap: 10px; font-size: 0.85rem; cursor: pointer; color: #444; }
        
        .btn-icon-mini { border: 1px solid #ddd; background: white; padding: 6px; border-radius: 6px; cursor: pointer; display: flex; }
        .btn-icon-mini.active { background: var(--secondary); border-color: var(--secondary); color: var(--primary); }
        .input-mini { border: 1px solid #ddd; padding: 6px 10px; border-radius: 6px; font-size: 0.8rem; flex: 1; }
        
        .stock-list { max-height: 150px; overflow-y: auto; background: #fafafa; border-radius: 8px; padding: 4px; display: flex; flex-direction: column; gap: 2px; }
        .stock-item-btn { text-align: left; padding: 8px 12px; font-size: 0.8rem; border: none; background: transparent; cursor: pointer; border-radius: 4px; }
        .stock-item-btn:hover { background: #f0f0f0; }

        .preview-container { background: #555; padding: 40px; border-radius: 12px; position: relative; display: flex; justify-content: center; overflow: hidden; min-height: 400px; }
        .preview-tag { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.5); color: white; padding: 4px 10px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
        .print-surface { background: white; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }

        .print-instructions ul { padding-left: 20px; font-size: 0.85rem; color: #666; display: flex; flex-direction: column; gap: 6px; }
        
        @media print {
          .no-print { display: none !important; }
          .etiquetas-layout { display: block; }
          .label-preview-area { padding: 0; margin: 0; }
          .preview-container { background: none; padding: 0; border-radius: 0; display: block; }
          .print-surface { box-shadow: none; margin: 0; padding: 0; }
          .etiquetas-page { padding: 0; }
          @page { margin: 1cm; }
        }

        .my-4 { margin: 20px 0; }
        .text-xs { font-size: 0.7rem; }
      `}} />
    </div>
  );
};

export default Etiquetas;
