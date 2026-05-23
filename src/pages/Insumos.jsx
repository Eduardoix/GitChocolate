import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Insumos = () => {
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    nome: '', unidade: 'kg', custo_unitario: 0,
    perc_gordura_total: 0, perc_gordura_lactea: 0, perc_manteiga_cacau: 0,
    modo_preparo: '', valor_energetico_kcal: 0, carboidratos_g: 0,
    acucar_total_g: 0, acucar_adicionado_g: 0, proteinas_g: 0,
    gorduras_totais_g: 0, gorduras_saturadas_g: 0, gorduras_trans_g: 0,
    fibra_alimentar_g: 0, sodio_mg: 0
  });

  const fetchInsumos = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('insumos').select('*').order('nome');
    if (!error) setInsumos(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchInsumos();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    let error;
    
    if (editId) {
      const { error: err } = await supabase.from('insumos').update(formData).eq('id', editId);
      error = err;
    } else {
      const { error: err } = await supabase.from('insumos').insert([formData]);
      error = err;
    }

    if (!error) {
      closeModal();
      fetchInsumos();
    } else {
      alert('Erro ao salvar: ' + error.message);
    }
  };

  const handleEdit = (insumo) => {
    setEditId(insumo.id);
    setFormData({
      nome: insumo.nome,
      unidade: insumo.unidade,
      custo_unitario: insumo.custo_unitario,
      perc_gordura_total: insumo.perc_gordura_total,
      perc_gordura_lactea: insumo.perc_gordura_lactea,
      perc_manteiga_cacau: insumo.perc_manteiga_cacau,
      modo_preparo: insumo.modo_preparo || '',
      valor_energetico_kcal: insumo.valor_energetico_kcal || 0,
      carboidratos_g: insumo.carboidratos_g || 0,
      acucar_total_g: insumo.acucar_total_g || 0,
      acucar_adicionado_g: insumo.acucar_adicionado_g || 0,
      proteinas_g: insumo.proteinas_g || 0,
      gorduras_totais_g: insumo.gorduras_totais_g || 0,
      gorduras_saturadas_g: insumo.gorduras_saturadas_g || 0,
      gorduras_trans_g: insumo.gorduras_trans_g || 0,
      fibra_alimentar_g: insumo.fibra_alimentar_g || 0,
      sodio_mg: insumo.sodio_mg || 0
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setFormData({ 
      nome: '', unidade: 'kg', custo_unitario: 0, perc_gordura_total: 0, perc_gordura_lactea: 0, perc_manteiga_cacau: 0,
      modo_preparo: '', valor_energetico_kcal: 0, carboidratos_g: 0,
      acucar_total_g: 0, acucar_adicionado_g: 0, proteinas_g: 0,
      gorduras_totais_g: 0, gorduras_saturadas_g: 0, gorduras_trans_g: 0,
      fibra_alimentar_g: 0, sodio_mg: 0 
    });
  };

  const handleDelete = async (id) => {
    if (confirm('Deseja excluir este insumo?')) {
      const { error } = await supabase.from('insumos').delete().eq('id', id);
      if (!error) fetchInsumos();
    }
  };

  return (
    <div className="flex-column gap-3">
      <div className="flex justify-between items-center">
        <div>
          <h1>Gestão de Insumos</h1>
          <p className="text-muted">Cadastre e controle os custos das matérias-primas.</p>
        </div>
        <button className="btn-primary flex items-center gap-1" onClick={() => setShowModal(true)}>
          <Plus size={20} /> Novo Insumo
        </button>
      </div>

      <div className="card">
        {loading ? <p>Carregando...</p> : (
          <div className="table-container">
            <table className="w-full">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Unidade</th>
                <th>Estoque</th>
                <th>Custo/Un</th>
                <th>Gordura Tot.</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {insumos.map((i) => (
                <tr key={i.id}>
                  <td><strong>{i.nome}</strong></td>
                  <td>{i.unidade}</td>
                  <td className={i.estoque_atual <= 0.5 ? 'text-error' : ''}>
                    <strong>{Number(i.estoque_atual || 0).toFixed(2)}</strong> {i.unidade}
                  </td>
                  <td>R$ {Number(i.custo_unitario).toFixed(2)}</td>
                  <td>{i.perc_gordura_total}%</td>
                  <td style={{ textAlign: 'center', width: '120px' }}>
                    <div className="flex items-center gap-4 justify-center">
                      <button className="btn-ghost p-1" style={{ color: '#d4af37' }} title="Editar" onClick={() => handleEdit(i)}>
                        <Edit2 size={20} />
                      </button>
                      <button className="btn-ghost p-1 text-error" title="Excluir" onClick={() => handleDelete(i.id)}>
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h3>{editId ? 'Editar Insumo' : 'Novo Insumo'}</h3>
            <form onSubmit={handleSave} className="flex-column gap-2 mt-3">
              <div className="input-group">
                <label>Nome</label>
                <input required type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
              </div>

              <div className="input-group mt-2">
                <label>Modo de preparo / marca (opcional)</label>
                <textarea 
                  value={formData.modo_preparo} 
                  onChange={e => setFormData({...formData, modo_preparo: e.target.value})} 
                  placeholder="Ex: Assado, frito, cozido ou Marca Exemplo"
                  rows={2}
                  style={{ width: '100%', resize: 'vertical' }}
                />
                <small className="text-muted" style={{ fontSize: '0.8rem' }}>Esta informação é apenas para seu controle e não aparecerá na tabela nutricional.</small>
              </div>

              <div className="nutritional-box" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', padding: '16px', marginTop: '16px', marginBottom: '16px' }}>
                <h4 className="flex items-center gap-2 mb-3" style={{ color: '#d35400', fontSize: '1.05rem', margin: '0 0 16px 0' }}>
                  <span role="img" aria-label="calculator">🧮</span> Insira os valores referente a porção padrão de 100g/100ml
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="input-group">
                    <label>Valor Energético (kcal)</label>
                    <input type="number" value={formData.valor_energetico_kcal} onChange={e => setFormData({...formData, valor_energetico_kcal: Number(e.target.value)})} />
                  </div>
                  <div className="input-group">
                    <label>Carboidratos (g)</label>
                    <input type="number" value={formData.carboidratos_g} onChange={e => setFormData({...formData, carboidratos_g: Number(e.target.value)})} />
                  </div>
                  
                  <div className="input-group">
                    <label>Açúcar Total (g)</label>
                    <input type="number" value={formData.acucar_total_g} onChange={e => setFormData({...formData, acucar_total_g: Number(e.target.value)})} />
                  </div>
                  <div className="input-group">
                    <label>Açúcar Adicionado (g)</label>
                    <input type="number" value={formData.acucar_adicionado_g} onChange={e => setFormData({...formData, acucar_adicionado_g: Number(e.target.value)})} />
                  </div>

                  <div className="input-group">
                    <label>Proteínas (g)</label>
                    <input type="number" value={formData.proteinas_g} onChange={e => setFormData({...formData, proteinas_g: Number(e.target.value)})} />
                  </div>
                  <div className="input-group">
                    <label>Gorduras Totais (g)</label>
                    <input type="number" value={formData.gorduras_totais_g} onChange={e => setFormData({...formData, gorduras_totais_g: Number(e.target.value)})} />
                  </div>

                  <div className="input-group">
                    <label>Gorduras Saturadas (g)</label>
                    <input type="number" value={formData.gorduras_saturadas_g} onChange={e => setFormData({...formData, gorduras_saturadas_g: Number(e.target.value)})} />
                  </div>
                  <div className="input-group">
                    <label>Gorduras Trans (g)</label>
                    <input type="number" value={formData.gorduras_trans_g} onChange={e => setFormData({...formData, gorduras_trans_g: Number(e.target.value)})} />
                  </div>

                  <div className="input-group">
                    <label>Fibra Alimentar (g)</label>
                    <input type="number" value={formData.fibra_alimentar_g} onChange={e => setFormData({...formData, fibra_alimentar_g: Number(e.target.value)})} />
                  </div>
                  <div className="input-group">
                    <label>Sódio (mg)</label>
                    <input type="number" value={formData.sodio_mg} onChange={e => setFormData({...formData, sodio_mg: Number(e.target.value)})} />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="input-group flex-1">
                  <label>Unidade</label>
                  <select value={formData.unidade} onChange={e => setFormData({...formData, unidade: e.target.value})}>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="un">un</option>
                  </select>
                </div>
                <div className="input-group flex-1">
                  <label>Custo por Unidade</label>
                  <input type="number" step="0.01" value={formData.custo_unitario} onChange={e => setFormData({...formData, custo_unitario: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="input-group flex-1">
                  <label>% Gordura Total</label>
                  <input type="number" value={formData.perc_gordura_total} onChange={e => setFormData({...formData, perc_gordura_total: e.target.value})} />
                </div>
                <div className="input-group flex-1">
                  <label>% Gordura Láctea</label>
                  <input type="number" value={formData.perc_gordura_lactea} onChange={e => setFormData({...formData, perc_gordura_lactea: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-3 mt-3">
                <button type="button" className="btn-ghost flex-1" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn-primary flex-1">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          width: 650px; max-width: 95vw; max-height: 90vh; overflow-y: auto; padding: 30px; background: white;
        }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 12px; color: var(--text-muted); font-weight: 500; border-bottom: 2px solid #f0f0f0; }
        td { padding: 16px 12px; border-bottom: 1px solid #f0f0f0; }
        .text-error { color: var(--error); }
      `}} />
    </div>
  );
};

export default Insumos;
