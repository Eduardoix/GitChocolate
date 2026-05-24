import React, { useState, useEffect } from 'react';
import { Beaker, AlertTriangle, CheckCircle, Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate, useParams, Link } from 'react-router-dom';
import NutritionalLabel from '../components/NutritionalLabel';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

const Formulas = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [batchSize, setBatchSize] = useState(10);
  const [allInsumos, setAllInsumos] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [vendaEstimada, setVendaEstimada] = useState(0);

  // Rótulo options
  const [porcoesEmbalagem, setPorcoesEmbalagem] = useState('10');
  const [porcaoG, setPorcaoG] = useState(100);
  const [porcaoDesc, setPorcaoDesc] = useState('1/2 Tablete');
  const [contemLactose, setContemLactose] = useState(true);
  const [contemGluten, setContemGluten] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Insumos
      const { data: insumos } = await supabase.from('insumos').select('*').order('nome');
      if (insumos) setAllInsumos(insumos);

      // Fetch existing formula if editing
      if (id) {
        const { data: formula } = await supabase.from('formulas').select('*').eq('id', id).single();
        if (formula) {
          setNome(formula.nome);
          setDescricao(formula.descricao || '');
          setPorcoesEmbalagem(formula.porcoes_embalagem || '10');
          setPorcaoG(formula.porcao_g || 100);
          setPorcaoDesc(formula.porcao_desc || '1/2 Tablete');
          setContemLactose(formula.contem_lactose ?? true);
          setContemGluten(formula.contem_gluten ?? false);
          const { data: items } = await supabase.from('formula_itens').select('*, insumos(*)').eq('formula_id', id);
          if (items) {
            setSelectedItems(items.map(it => ({
              ...it.insumos,
              insumo_id: it.insumo_id,
              perc: it.percentual
            })));
          }
        }
      }
    };
    fetchData();
  }, [id]);

  const addItem = () => {
    if (allInsumos.length > 0) {
      const first = allInsumos[0];
      setSelectedItems([...selectedItems, { ...first, insumo_id: first.id, perc: 0 }]);
    }
  };

  const removeItem = (idx) => {
    const newItems = [...selectedItems];
    newItems.splice(idx, 1);
    setSelectedItems(newItems);
  };

  const updatePerc = (idx, val) => {
    const newItems = [...selectedItems];
    newItems[idx].perc = Number(val);
    setSelectedItems(newItems);
  };

  const updateInsumo = (idx, insumoId) => {
    const insumo = allInsumos.find(i => i.id === insumoId);
    const newItems = [...selectedItems];
    newItems[idx] = { ...insumo, insumo_id: insumo.id, perc: newItems[idx].perc };
    setSelectedItems(newItems);
  };

  // Calculations
  const totalPerc = selectedItems.reduce((acc, curr) => acc + curr.perc, 0);
  const gTotal = selectedItems.reduce((acc, curr) => acc + (curr.perc * Number(curr.perc_gordura_total || 0) / 100), 0);
  const gLactea = selectedItems.reduce((acc, curr) => acc + (curr.perc * Number(curr.perc_gordura_lactea || 0) / 100), 0);
  const totalCocoaFat = gTotal - gLactea;
  const totalCocoaPerc = selectedItems.reduce((acc, curr) => {
    const nome = (curr.nome || '').toLowerCase();
    if (nome.includes('cacau') || nome.includes('nibs') || nome.includes('liquor') || nome.includes('massa')) {
      return acc + curr.perc;
    }
    return acc;
  }, 0);
  
  const eutecticIndex = gTotal > 0 ? (gLactea / gTotal) * 100 : 0;
  const totalCostPerKg = selectedItems.reduce((acc, curr) => acc + (curr.perc * Number(curr.custo_unitario || 0) / 100), 0);
  
  const nutrition = {
    kcal: Math.round(selectedItems.reduce((acc, curr) => acc + (curr.perc * Number(curr.valor_energetico_kcal || 0) / 100), 0)),
    carb: Math.round(selectedItems.reduce((acc, curr) => acc + (curr.perc * Number(curr.carboidratos_g || 0) / 100), 0)),
    sugarTotal: Math.round(selectedItems.reduce((acc, curr) => acc + (curr.perc * Number(curr.acucar_total_g || 0) / 100), 0)),
    sugarAdded: Math.round(selectedItems.reduce((acc, curr) => acc + (curr.perc * Number(curr.acucar_adicionado_g || 0) / 100), 0)),
    protein: Number(selectedItems.reduce((acc, curr) => acc + (curr.perc * Number(curr.proteinas_g || 0) / 100), 0).toFixed(1)),
    fatTotal: Math.round(selectedItems.reduce((acc, curr) => acc + (curr.perc * Number(curr.gorduras_totais_g || 0) / 100), 0)),
    fatSat: Math.round(selectedItems.reduce((acc, curr) => acc + (curr.perc * Number(curr.gorduras_saturadas_g || 0) / 100), 0)),
    fatTrans: Math.round(selectedItems.reduce((acc, curr) => acc + (curr.perc * Number(curr.gorduras_trans_g || 0) / 100), 0)),
    fiber: Number(selectedItems.reduce((acc, curr) => acc + (curr.perc * Number(curr.fibra_alimentar_g || 0) / 100), 0).toFixed(1)),
    sodium: Math.round(selectedItems.reduce((acc, curr) => acc + (curr.perc * Number(curr.sodio_mg || 0) / 100), 0)),
  };

  const saveFormula = async () => {
    if (!nome) return alert('Dê um nome à fórmula');
    if (totalPerc !== 100) return alert('A soma das porcentagens deve ser 100%');

    let formulaId = id;

    if (id) {
      // Update existing formula metadata
      const { error } = await supabase
        .from('formulas')
        .update({ 
          nome, 
          descricao,
          porcoes_embalagem: porcoesEmbalagem,
          porcao_g: porcaoG,
          porcao_desc: porcaoDesc,
          contem_lactose: contemLactose,
          contem_gluten: contemGluten
        })
        .eq('id', id);
      
      if (error) return alert('Erro ao atualizar fórmula');
      
      // Delete existing items to replace them
      const { error: dError } = await supabase.from('formula_itens').delete().eq('formula_id', id);
      if (dError) return alert('Erro ao atualizar itens da fórmula');
    } else {
      // Create new formula
      const { data: formula, error } = await supabase
        .from('formulas')
        .insert([{ 
          nome, 
          descricao,
          porcoes_embalagem: porcoesEmbalagem,
          porcao_g: porcaoG,
          porcao_desc: porcaoDesc,
          contem_lactose: contemLactose,
          contem_gluten: contemGluten
        }])
        .select()
        .single();
      
      if (error) return alert('Erro ao salvar nova fórmula');
      formulaId = formula.id;
    }

    // Save Items (new or replaced)
    const itemsToSave = selectedItems.map(item => ({
      formula_id: formulaId,
      insumo_id: item.id || item.insumo_id,
      percentual: item.perc
    }));

    const { error: iError } = await supabase.from('formula_itens').insert(itemsToSave);
    
    if (iError) alert('Erro ao salvar itens');
    else {
      alert('Fórmula salva com sucesso!');
      navigate('/formulas');
    }
  };

  return (
    <div className="flex-column gap-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link to="/formulas" className="btn-ghost">
            <ArrowLeft size={24} />
          </Link>
          <h1>{id ? 'Editar Fórmula' : 'Nova Fórmula de Chocolate'}</h1>
        </div>
        <button className="btn-primary flex items-center gap-1" onClick={saveFormula}>
          <Save size={20} /> {id ? 'Atualizar' : 'Salvar'} Fórmula
        </button>
      </div>

      <div className="card flex-column gap-2 mb-3">
        <div className="flex gap-3">
          <div className="input-group flex-1">
            <label>Nome da Fórmula</label>
            <input type="text" placeholder="Ex: Chocolate 70% Dark" value={nome} onChange={e => setNome(e.target.value)} />
          </div>
          <div className="input-group" style={{ width: '150px' }}>
            <label>Porções/Embalagem</label>
            <input type="text" placeholder="Ex: 10" value={porcoesEmbalagem} onChange={e => setPorcoesEmbalagem(e.target.value)} />
          </div>
          <div className="input-group" style={{ width: '120px' }}>
            <label>Porção (g)</label>
            <input type="number" value={porcaoG} onChange={e => setPorcaoG(Number(e.target.value))} />
          </div>
          <div className="input-group" style={{ width: '180px' }}>
            <label>Descrição Porção</label>
            <input type="text" placeholder="Ex: 1/2 Tablete" value={porcaoDesc} onChange={e => setPorcaoDesc(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-4 mt-2">
          <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={contemLactose} onChange={e => setContemLactose(e.target.checked)} />
            <span>Contém Lactose</span>
          </label>
          <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={contemGluten} onChange={e => setContemGluten(e.target.checked)} />
            <span>Contém Glúten</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3 items-start">
        <div className="card flex-1">
          <div className="flex justify-between items-center mb-4">
            <h3>Composição (% em peso)</h3>
            <div className="flex items-center gap-3">
              <span className={totalPerc === 100 ? 'text-success' : 'text-error'} style={{ fontWeight: 700 }}>
                Total: {totalPerc.toFixed(1)}%
              </span>
              <button className="btn-secondary p-1 rounded" onClick={addItem}>
                <Plus size={18} />
              </button>
            </div>
          </div>
          
          <div className="flex-column gap-2">
            {selectedItems.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-center bg-cream p-2 rounded">
                <select 
                  className="flex-1" 
                  value={item.insumo_id} 
                  onChange={e => updateInsumo(idx, e.target.value)}
                >
                  {allInsumos.map(ins => <option key={ins.id} value={ins.id}>{ins.nome}</option>)}
                </select>
                <div className="input-with-label flex items-center">
                  <input 
                    type="number" 
                    step="0.1"
                    value={item.perc} 
                    onChange={e => updatePerc(idx, e.target.value)}
                    style={{ width: '90px' }}
                  />
                  <span style={{ marginLeft: '8px', fontWeight: 'bold', color: 'var(--primary)' }}>%</span>
                </div>
                <button className="btn-ghost text-error" onClick={() => removeItem(idx)}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex-column items-center">
            <h3>Rótulo Nutricional</h3>
            <div className="bg-cream p-4 rounded mt-2" style={{ width: 'fit-content' }}>
              <NutritionalLabel 
                data={nutrition} 
                ingredients={selectedItems} 
                title={nome}
                portionSize={porcaoG}
                portionDescription={porcaoDesc}
                servingsPerContainer={porcoesEmbalagem}
                containsLactose={contemLactose}
                containsGluten={contemGluten}
                config={{ showTitle: true, showIngredients: true, showCocoaPerc: false }} 
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3" style={{ position: 'sticky', top: '20px', alignSelf: 'flex-start' }}>
          {/* Coluna 2: Índices Técnicos (Gráfico) */}
          <div className="flex-column gap-3" style={{ width: '380px' }}>
            <div className="card" style={{ height: '360px', display: 'flex', flexDirection: 'column' }}>
              <h3>Análise Técnica (%)</h3>
              <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '10px' }}>Atualizado em tempo real</p>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={[
                      { name: 'Eutético', valor: Number(eutecticIndex.toFixed(1)), fill: eutecticIndex > 20 ? '#e74c3c' : '#d4af37' },
                      { name: 'Manteiga', valor: Number(totalCocoaFat.toFixed(1)), fill: totalCocoaFat < 30 ? '#e74c3c' : '#2ecc71' },
                      { name: 'Cacau', valor: Number(totalCocoaPerc.toFixed(1)), fill: '#3d1d13' }
                    ]} 
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }} 
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fontWeight: 600 }} />
                    <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} formatter={(value) => value + '%'} />
                    <ReferenceLine x={20} stroke="#e74c3c" strokeDasharray="3 3" label={{ position: 'top', value: 'Máx Eutético', fill: '#e74c3c', fontSize: 10 }} />
                    <ReferenceLine x={30} stroke="#2ecc71" strokeDasharray="3 3" label={{ position: 'top', value: 'Mín Manteiga', fill: '#2ecc71', fontSize: 10 }} />
                    <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={24} label={{ position: 'right', fill: '#666', fontSize: 12, formatter: (val) => val + '%' }}>
                      {
                        [
                          { name: 'Eutético', valor: Number(eutecticIndex.toFixed(1)), fill: eutecticIndex > 20 ? '#e74c3c' : '#d4af37' },
                          { name: 'Manteiga', valor: Number(totalCocoaFat.toFixed(1)), fill: totalCocoaFat < 30 ? '#e74c3c' : '#2ecc71' },
                          { name: 'Cacau', valor: Number(totalCocoaPerc.toFixed(1)), fill: '#3d1d13' }
                        ].map((entry, index) => (
                          <Cell key={"cell-" + index} fill={entry.fill} />
                        ))
                      }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-column gap-1 mt-2">
                {eutecticIndex > 20 && <p className="alert-box error m-0 p-2" style={{margin:0}}>Eutético Alto: Risco de Instabilidade Reológica.</p>}
                {totalCocoaFat < 30 && <p className="alert-box error m-0 p-2" style={{margin:0}}>Manteiga Baixa: Abaixo do mínimo técnico (30%).</p>}
                {eutecticIndex <= 20 && totalCocoaFat >= 30 && <p className="alert-box success m-0 p-2" style={{margin:0}}>Parâmetros Técnicos OK.</p>}
              </div>
            </div>
          </div>

          {/* Coluna 3: Controle de Custos */}
          <div className="flex-column gap-3" style={{ width: '420px' }}>
            <div className="card" style={{ borderLeft: '4px solid var(--primary)', height: '100%' }}>
              <h3>Controle de Custos e Margem</h3>
            <div className="table-container">
            <table className="w-full mt-3" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <th style={{ textAlign: 'left', padding: '4px' }}>Insumo</th>
                  <th style={{ textAlign: 'center', padding: '4px' }}>%</th>
                  <th style={{ textAlign: 'right', padding: '4px' }}>Custo</th>
                </tr>
              </thead>
              <tbody>
                {selectedItems.map((item, idx) => {
                  const itemCost = (Number(item.perc || 0) * Number(item.custo_unitario || 0) / 100);
                  return (
                    <tr key={idx}>
                      <td style={{ padding: '4px' }}>{item.nome}</td>
                      <td style={{ textAlign: 'center', padding: '4px' }}>{item.perc}%</td>
                      <td style={{ textAlign: 'right', padding: '4px' }}>R$ {itemCost.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 'bold', borderTop: '2px solid #eee' }}>
                  <td colSpan="2" style={{ padding: '8px 4px' }}>Custo Total (kg)</td>
                  <td style={{ textAlign: 'right', padding: '8px 4px' }}>R$ {totalCostPerKg.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
            </div>

            <div className="mt-4 p-3 bg-cream rounded">
              <div className="input-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Preço Estimado de Venda (R$/kg)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={vendaEstimada} 
                  onChange={e => setVendaEstimada(Number(e.target.value))}
                  style={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                />
              </div>
              
              {vendaEstimada > 0 && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px dashed #ccc' }}>
                  <div className="flex justify-between items-center">
                    <span style={{ fontSize: '0.9rem' }}>Lucro Bruto:</span>
                    <strong className={vendaEstimada - totalCostPerKg > 0 ? 'text-success' : 'text-error'}>
                      R$ {(vendaEstimada - totalCostPerKg).toFixed(2)}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span style={{ fontSize: '0.9rem' }}>Margem (%):</span>
                    <strong className={vendaEstimada - totalCostPerKg > 0 ? 'text-success' : 'text-error'}>
                      {(((vendaEstimada - totalCostPerKg) / vendaEstimada) * 100).toFixed(1)}%
                    </strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>


      <style dangerouslySetInnerHTML={{ __html: `
        .bg-cream { background: #fdfaf5; }
        .font-500 { font-weight: 500; }
        .font-600 { font-weight: 600; }
        .mt-3 { margin-top: 16px; }
        .mt-2 { margin-top: 8px; }
        .mb-4 { margin-bottom: 24px; }
        
        .eutectic-gauge { position: relative; }
        .gauge-bar {
          height: 12px;
          background: #eee;
          border-radius: 6px;
          overflow: visible;
          position: relative;
        }
        .gauge-fill {
          height: 100%;
          border-radius: 6px;
          transition: var(--transition);
        }
        .gauge-marker {
          position: absolute;
          top: -4px;
          height: 20px;
          width: 2px;
          background: var(--primary);
        }
        
        .alert-box {
          padding: 12px;
          border-radius: 8px;
          font-size: 0.85rem;
        }
        .alert-box.error { background: #fee2e2; color: #991b1b; }
        .alert-box.success { background: #dcfce7; color: #166534; }
        
        .border-error { border: 2px solid var(--error); }
        .border-success { border: 2px solid var(--success); }
      `}} />
    </div>
  );
};

export default Formulas;
