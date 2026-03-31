import React, { useState, useEffect } from 'react';
import { Beaker, AlertTriangle, CheckCircle, Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate, useParams, Link } from 'react-router-dom';
import NutritionalLabel from '../components/NutritionalLabel';

const Formulas = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [batchSize, setBatchSize] = useState(10);
  const [allInsumos, setAllInsumos] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [vendaEstimada, setVendaEstimada] = useState(0);

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
    kcal: Math.round(selectedItems.reduce((acc, curr) => acc + (curr.perc * Number(curr.kcal_100g || 0) / 100), 0)),
    carb: Math.round(selectedItems.reduce((acc, curr) => acc + (curr.perc * Number(curr.carboidratos_g || 0) / 100), 0)),
    sugarTotal: Math.round(selectedItems.reduce((acc, curr) => acc + (curr.perc * Number(curr.acucares_totais_g || 0) / 100), 0)),
    sugarAdded: Math.round(selectedItems.reduce((acc, curr) => acc + (curr.perc * Number(curr.acucares_adicionados_g || 0) / 100), 0)),
    protein: Math.round(selectedItems.reduce((acc, curr) => acc + (curr.perc * Number(curr.proteinas_g || 0) / 100), 0)),
    fatTotal: Math.round(gTotal),
    fatSat: Math.round(selectedItems.reduce((acc, curr) => acc + (curr.perc * Number(curr.gorduras_saturadas_g || 0) / 100), 0)),
    fatTrans: 0,
    fiber: Math.round(selectedItems.reduce((acc, curr) => acc + (curr.perc * Number(curr.fibras_g || 0) / 100), 0)),
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
        .update({ nome, descricao })
        .eq('id', id);
      
      if (error) return alert('Erro ao atualizar fórmula');
      
      // Delete existing items to replace them
      const { error: dError } = await supabase.from('formula_itens').delete().eq('formula_id', id);
      if (dError) return alert('Erro ao atualizar itens da fórmula');
    } else {
      // Create new formula
      const { data: formula, error } = await supabase
        .from('formulas')
        .insert([{ nome, descricao }])
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
        <div className="input-group">
          <label>Nome da Fórmula</label>
          <input type="text" placeholder="Ex: Chocolate 70% Dark" value={nome} onChange={e => setNome(e.target.value)} />
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
            <div className="bg-cream p-4 rounded mt-2">
              <NutritionalLabel data={nutrition} ingredients={selectedItems} />
            </div>
          </div>
        </div>

        <div className="flex gap-3" style={{ position: 'sticky', top: '20px', alignSelf: 'flex-start' }}>
          {/* Coluna 2: Índices Técnicos */}
          <div className="flex-column gap-3" style={{ width: '380px' }}>
            <div className={`card ${eutecticIndex > 20 ? 'border-error' : 'border-success'}`}>
              <h3>Índice Eutético</h3>
              <div className="eutectic-gauge mt-2">
                <div className="gauge-bar">
                  <div className="gauge-fill" style={{ 
                    width: `${Math.min(eutecticIndex * 5, 100)}%`,
                    backgroundColor: eutecticIndex > 20 ? 'var(--error)' : 'var(--secondary)'
                  }} />
                </div>
              </div>
              <h2 className="mt-2" style={{ textAlign: 'center' }}>{eutecticIndex.toFixed(1)}%</h2>
              {eutecticIndex > 20 && <p className="alert-box error mt-2">Risco de Instabilidade Reológica.</p>}
            </div>

            <div className={`card ${totalCocoaFat < 30 ? 'border-error' : 'border-success'}`}>
              <h3>Manteiga de Cacau Total</h3>
              <div className="eutectic-gauge mt-2">
                <div className="gauge-bar">
                  <div className="gauge-fill" style={{ 
                    width: `${Math.min(totalCocoaFat * 2, 100)}%`, 
                    backgroundColor: totalCocoaFat < 30 ? 'var(--error)' : '#2e7d32'
                  }} />
                </div>
              </div>
              <h2 className="mt-2" style={{ textAlign: 'center' }}>{totalCocoaFat.toFixed(1)}%</h2>
              {totalCocoaFat < 30 && <p className="alert-box error mt-2">Abaixo do mínimo técnico (30%).</p>}
            </div>

            <div className="card border-primary">
              <h3>Cacau Total (Nibs+Liquor+Manteiga)</h3>
              <div className="eutectic-gauge mt-2">
                <div className="gauge-bar">
                  <div className="gauge-fill" style={{ 
                    width: `${totalCocoaPerc}%`, 
                    backgroundColor: 'var(--primary)'
                  }} />
                </div>
              </div>
              <h2 className="mt-2" style={{ textAlign: 'center' }}>{totalCocoaPerc.toFixed(1)}%</h2>
              <p className="alert-box success mt-2" style={{ backgroundColor: '#efebe9' }}>Referência comercial do chocolate.</p>
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
