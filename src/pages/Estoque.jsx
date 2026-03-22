import React, { useState, useEffect } from 'react';
import { Plus, Boxes, Package, ArrowUpRight, ArrowDownLeft, History, Search, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Estoque = () => {
  const [activeTab, setActiveTab] = useState('insumos'); 
  const [insumos, setInsumos] = useState([]);
  const [movements, setMovements] = useState([]);
  const [massaBase, setMassaBase] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [estoqueProdutos, setEstoqueProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showTransformModal, setShowTransformModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  
  // State for forms
  const [selectedInsumo, setSelectedInsumo] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [entryQty, setEntryQty] = useState('');
  const [saleQuantity, setSaleQuantity] = useState(1);
  const [newPrice, setNewPrice] = useState('');
  
  const [transformItems, setTransformItems] = useState([{ produto_id: '', quantidade: 1 }]);
  const [productForm, setProductForm] = useState({ nome: '', categoria: 'Barra', peso_liquido_g: '', preco_venda: '' });

  const fetchData = async () => {
    setLoading(true);
    
    // 1. Insumos
    const { data: insData } = await supabase.from('insumos').select('*').order('nome');
    setInsumos(insData || []);

    // 2. Massa Base (Bateladas Concluídas)
    const { data: batData } = await supabase.from('bateladas').select('*, formulas(nome), batelada_itens(*, insumos(custo_unitario))').eq('status', 'concluido').order('data_producao', { ascending: false });
    const { data: movsBatch } = await supabase.from('movimentacao_estoque').select('*').not('batelada_id', 'is', null);
    
    let totalMassKg = 0;
    let weightedTotalCost = 0;

    const massaComSaldo = batData?.map(bat => {
      const saidas = movsBatch?.filter(m => m.batelada_id === bat.id && m.tipo === 'saida' && m.motivo.includes('Transformação')) || [];
      const totalSaida = saidas.reduce((acc, s) => acc + Number(s.quantidade), 0);
      
      let activeCost = Number(bat.custo_total_materia_prima || 0);
      if (activeCost === 0 && bat.batelada_itens?.length > 0) {
        const materialCost = bat.batelada_itens.reduce((acc, item) => acc + (Number(item.peso_atual_kg || 0) * Number(item.insumos?.custo_unitario || 0)), 0);
        activeCost = materialCost * 1.05; 
      }

      const saldo = Number(bat.peso_final_kg) - totalSaida;
      const unitCostKg = Number(bat.peso_final_kg) > 0 ? (activeCost / Number(bat.peso_final_kg)) : 0;
      
      if (saldo > 0.001) {
        totalMassKg += saldo;
        weightedTotalCost += (saldo * unitCostKg);
      }

      return { ...bat, saldo_kg: saldo, custo_total_materia_prima: activeCost };
    }).filter(b => b.saldo_kg > 0.001) || [];

    const averageCostKg = totalMassKg > 0 ? (weightedTotalCost / totalMassKg) : 0;
    setMassaBase(massaComSaldo);

    // 3. Produtos Cadastrados
    const { data: prodList } = await supabase.from('produtos').select('*').order('nome');
    setProdutos(prodList || []);

    // 4. Estoque de Produtos Finais
    const { data: estProd } = await supabase.from('movimentacao_estoque').select('*, produtos(*)').not('produto_id', 'is', null);
    const saldosProd = prodList?.map(p => {
      const pMovs = estProd?.filter(m => m.produto_id === p.id) || [];
      const saldo = pMovs.reduce((acc, m) => acc + (m.tipo === 'entrada' ? Number(m.quantidade) : -Number(m.quantidade)), 0);
      const unitCost = (averageCostKg / 1000) * Number(p.peso_liquido_g || 0);
      const profit = Number(p.preco_venda || 0) - unitCost;
      const margin = p.preco_venda > 0 ? (profit / p.preco_venda) * 100 : 0;

      return { ...p, saldo_un: saldo, unitCost, margin };
    }) || [];
    setEstoqueProdutos(saldosProd);

    // 5. General Movements
    const { data: movData } = await supabase
      .from('movimentacao_estoque')
      .select('*, insumos(nome), produtos(nome), bateladas(lote)')
      .order('created_at', { ascending: false })
      .limit(50);
    setMovements(movData || []);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSale = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setLoading(true);
    if (Number(saleQuantity) > selectedProduct.saldo_un) {
      alert('Quantidade insuficiente em estoque.');
      setLoading(false); return;
    }
    const { error } = await supabase.from('movimentacao_estoque').insert([{
      produto_id: selectedProduct.id,
      tipo: 'saida',
      quantidade: Number(saleQuantity),
      motivo: 'Venda de Produto'
    }]);
    if (error) { alert('Erro na venda: ' + error.message); }
    else { setShowSaleModal(false); setSaleQuantity(1); fetchData(); }
    setLoading(false);
  };

  const handleUpdatePrice = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setLoading(true);
    const { error } = await supabase.from('produtos').update({ preco_venda: Number(newPrice) }).eq('id', selectedProduct.id);
    if (error) { alert('Erro ao atualizar preço: ' + error.message); }
    else { setShowPriceModal(false); setNewPrice(''); fetchData(); }
    setLoading(false);
  };

  const handleRegisterEntry = async (e) => {
    e.preventDefault();
    if (!selectedInsumo || !entryQty) return;
    setLoading(true);
    const qty = parseFloat(entryQty);
    try {
      const newStock = (Number(selectedInsumo.estoque_atual || 0) + qty).toFixed(3);
      await supabase.from('insumos').update({ estoque_atual: newStock }).eq('id', selectedInsumo.id);
      await supabase.from('movimentacao_estoque').insert([{
        insumo_id: selectedInsumo.id,
        tipo: 'entrada',
        quantidade: qty,
        motivo: 'Compra / Reposição'
      }]);
      setShowEntryModal(false); setEntryQty(''); fetchData();
    } catch (err) { alert('Erro ao registrar entrada: ' + err.message); }
    finally { setLoading(false); }
  };

  const openEntryModal = (ins) => { setSelectedInsumo(ins); setShowEntryModal(true); };

  const handleRegisterProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('produtos').insert([productForm]);
    if (error) { alert('Erro ao cadastrar: ' + error.message); }
    else { setShowProductModal(false); setProductForm({ nome: '', categoria: 'Barra', peso_liquido_g: '', preco_venda: '' }); fetchData(); }
    setLoading(false);
  };

  const handleTransform = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let totalWeightUsedKg = 0;
      const movementsToSave = [];
      for (const item of transformItems) {
        if (!item.produto_id || !item.quantidade) continue;
        const prod = produtos.find(p => p.id === item.produto_id);
        const weightKg = (Number(prod.peso_liquido_g) * Number(item.quantidade)) / 1000;
        totalWeightUsedKg += weightKg;
        movementsToSave.push({
          produto_id: item.produto_id,
          batelada_id: selectedBatch.id,
          tipo: 'entrada',
          quantidade: item.quantidade,
          motivo: `Transformação do Lote ${selectedBatch.lote}`
        });
      }
      if (totalWeightUsedKg > selectedBatch.saldo_kg + 0.001) throw new Error('Peso total insuficiente no lote.');
      await supabase.from('movimentacao_estoque').insert([{
        batelada_id: selectedBatch.id,
        tipo: 'saida',
        quantidade: totalWeightUsedKg,
        motivo: `Transformação em produtos (Lote ${selectedBatch.lote})`
      }]);
      await supabase.from('movimentacao_estoque').insert(movementsToSave);
      setShowTransformModal(false); setTransformItems([{ produto_id: '', quantidade: '' }]); fetchData();
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  const addTransformLine = () => setTransformItems([...transformItems, { produto_id: '', quantidade: '' }]);
  const removeTransformLine = (idx) => setTransformItems(transformItems.filter((_, i) => i !== idx));

  return (
    <div className="flex-column gap-3">
      <div className="flex justify-between items-center">
        <div>
          <h1>Gestão de Estoque</h1>
          <p className="text-muted">Controle de insumos, massa base e produtos finais.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-1" onClick={() => setShowProductModal(true)}>
            <Plus size={20} /> Cadastrar Produto
          </button>
        </div>
      </div>

      <div className="tabs-container">
        <button className={`tab-btn ${activeTab === 'insumos' ? 'active' : ''}`} onClick={() => setActiveTab('insumos')}>
          <Package size={18} /> Insumos
        </button>
        <button className={`tab-btn ${activeTab === 'massa_base' ? 'active' : ''}`} onClick={() => setActiveTab('massa_base')}>
          <Boxes size={18} /> Massa Base
        </button>
        <button className={`tab-btn ${activeTab === 'produtos_finais' ? 'active' : ''}`} onClick={() => setActiveTab('produtos_finais')}>
          <Boxes size={18} /> Produtos Finais
        </button>
      </div>

      <div className="grid-stock">
        <div className="flex-column gap-3">
          {activeTab === 'insumos' && (
            <div className="card">
              <h3>Estoque de Matérias-Primas</h3>
              <table className="w-full mt-3">
                <thead>
                  <tr><th>Insumo</th><th>Estoque</th><th>Unidade</th><th>Preço Unit.</th><th>Valor Total</th><th style={{ textAlign: 'center' }}>Ações</th></tr>
                </thead>
                <tbody>
                  {insumos.map(i => {
                    const totalVal = Number(i.estoque_atual || 0) * Number(i.custo_unitario || 0);
                    return (
                      <tr key={i.id}>
                        <td><strong>{i.nome}</strong></td>
                        <td className={i.estoque_atual <= 0.5 ? 'text-error' : ''}><strong>{Number(i.estoque_atual).toFixed(3)}</strong></td>
                        <td>{i.unidade}</td>
                        <td>R$ {Number(i.custo_unitario || 0).toFixed(2)}</td>
                        <td><strong style={{ color: '#1b5e20' }}>R$ {totalVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                        <td style={{ textAlign: 'center' }}><button className="btn-secondary btn-sm" onClick={() => openEntryModal(i)}>+ Compra</button></td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f9f9f9', fontWeight: 'bold' }}>
                    <td colSpan="4" style={{ textAlign: 'right', padding: '12px' }}>VALOR TOTAL EM ESTOQUE:</td>
                    <td style={{ padding: '12px' }}>
                      <span className="badge-cost">
                        R$ {insumos.reduce((acc, i) => acc + (Number(i.estoque_atual || 0) * Number(i.custo_unitario || 0)), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {activeTab === 'massa_base' && (
            <div className="card">
              <h3>Lotes de Chocolate (Massa)</h3>
              <table className="w-full mt-3">
                <thead>
                  <tr><th>Lote</th><th>Fórmula</th><th>Data</th><th>Saldo</th><th>Custo Total</th><th>Custo/kg</th><th style={{ textAlign: 'right' }}>Ações</th></tr>
                </thead>
                <tbody>
                  {massaBase.map(b => (
                    <tr key={b.id}>
                      <td><span className="badge-primary">{b.lote}</span></td>
                      <td><strong>{b.formulas?.nome}</strong></td>
                      <td>{new Date(b.data_producao).toLocaleDateString()}</td>
                      <td><strong>{b.saldo_kg.toFixed(3)} kg</strong></td>
                      <td>R$ {Number(b.custo_total_materia_prima || 0).toFixed(2)}</td>
                      <td className="text-muted">R$ {(b.custo_total_materia_prima / b.peso_final_kg).toFixed(2)}/kg</td>
                      <td style={{ textAlign: 'right' }}><button className="btn-primary btn-sm" onClick={() => { setSelectedBatch(b); setShowTransformModal(true); }}>Transformar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'produtos_finais' && (
            <div className="card">
              <h3>Produtos Prontos para Venda</h3>
              <table className="w-full mt-3">
                <thead>
                  <tr><th>Produto</th><th>Categoria</th><th>Peso</th><th>Custo Unit.</th><th>Preço Venda</th><th>Margem (%)</th><th>Estoque</th><th style={{ textAlign: 'right' }}>Ações</th></tr>
                </thead>
                <tbody>
                  {estoqueProdutos.map(p => (
                    <tr key={p.id}>
                      <td><strong>{p.nome}</strong></td>
                      <td>{p.categoria}</td>
                      <td>{p.peso_liquido_g}g</td>
                      <td>R$ {p.unitCost.toFixed(2)}</td>
                      <td><strong>R$ {Number(p.preco_venda || 0).toFixed(2)}</strong></td>
                      <td className={p.margin > 0 ? 'text-success' : 'text-error'}><strong>{p.margin.toFixed(1)}%</strong></td>
                      <td><span className="font-700" style={{ fontSize: '1.2rem', color: 'var(--secondary)' }}>{p.saldo_un} un</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex justify-end gap-2">
                          <button className="btn-secondary btn-sm" onClick={() => { setSelectedProduct(p); setNewPrice(p.preco_venda); setShowPriceModal(true); }}>Preço</button>
                          <button className="btn-primary btn-sm" disabled={p.saldo_un <= 0} onClick={() => { setSelectedProduct(p); setShowSaleModal(true); }}>Vender</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex-column gap-3" style={{ width: '420px' }}>
          <div className="card">
            <h3 className="flex items-center gap-2 mb-3"><History size={18} /> Últimas Movimentações</h3>
            <div className="movements-list">
              {movements.map(m => (
                <div key={m.id} className="movement-item">
                  <div className={`movement-icon ${m.tipo}`}>{m.tipo === 'entrada' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}</div>
                  <div className="movement-info">
                    <span className="movement-title">{m.insumos?.nome || m.produtos?.nome || `Lote ${m.bateladas?.lote || 'N/A'}`}</span>
                    <span className="movement-desc">{m.motivo}</span>
                    <span className="movement-date">{new Date(m.created_at).toLocaleString()}</span>
                  </div>
                  <div className={`movement-qty ${m.tipo}`}>{m.tipo === 'entrada' ? '+' : '-'}{Number(m.quantidade).toFixed(m.produtos ? 0 : 3)} {m.produtos ? 'un' : (m.insumos ? m.insumos.unidade : 'kg')}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEntryModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '400px' }}>
            <h3>Entrada de Estoque: {selectedInsumo?.nome}</h3>
            <form onSubmit={handleRegisterEntry} className="flex-column gap-3 mt-3">
              <div className="input-group"><label>Quantidade ({selectedInsumo?.unidade})</label><input type="number" step="0.001" required value={entryQty} onChange={e => setEntryQty(e.target.value)} /></div>
              <button type="submit" className="btn-primary w-full">Confirmar Entrada</button>
              <button type="button" className="btn-ghost w-full" onClick={() => setShowEntryModal(false)}>Cancelar</button>
            </form>
          </div>
        </div>
      )}

      {showSaleModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '400px' }}>
            <h3>Registrar Venda</h3>
            <p>Produto: <strong>{selectedProduct.nome}</strong> | Estoque: <strong>{selectedProduct.saldo_un} un</strong></p>
            <form onSubmit={handleSale} className="flex-column gap-3 mt-3">
              <div className="input-group"><label>Quantidade Vendida</label><input type="number" min="1" max={selectedProduct.saldo_un} value={saleQuantity} onChange={e => setSaleQuantity(e.target.value)} required /></div>
              <button type="submit" className="btn-primary w-full">Confirmar Venda</button>
              <button type="button" className="btn-ghost w-full" onClick={() => setShowSaleModal(false)}>Cancelar</button>
            </form>
          </div>
        </div>
      )}

      {showPriceModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '400px' }}>
            <h3>Ajustar Preço: {selectedProduct.nome}</h3>
            <form onSubmit={handleUpdatePrice} className="flex-column gap-3 mt-3">
              <div className="input-group"><label>Novo Preço de Venda (R$)</label><input type="number" step="0.01" value={newPrice} onChange={e => setNewPrice(e.target.value)} required /></div>
              <button type="submit" className="btn-primary w-full">Salvar Preço</button>
              <button type="button" className="btn-ghost w-full" onClick={() => setShowPriceModal(false)}>Cancelar</button>
            </form>
          </div>
        </div>
      )}

      {showProductModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '450px' }}>
            <h3>Cadastrar Novo Produto</h3>
            <form onSubmit={handleRegisterProduct} className="flex-column gap-3 mt-3">
              <div className="input-group"><label>Nome</label><input required type="text" value={productForm.nome} onChange={e => setProductForm({...productForm, nome: e.target.value})} /></div>
              <div className="flex gap-2">
                <div className="input-group flex-1"><label>Categoria</label><select value={productForm.categoria} onChange={e => setProductForm({...productForm, categoria: e.target.value})}><option value="Barra">Barra</option><option value="Bombom">Bombom</option><option value="Pacote">Pacote</option></select></div>
                <div className="input-group flex-1"><label>Peso (g)</label><input required type="number" value={productForm.peso_liquido_g} onChange={e => setProductForm({...productForm, peso_liquido_g: e.target.value})} /></div>
              </div>
              <div className="input-group"><label>Preço de Venda (R$)</label><input required type="number" step="0.01" value={productForm.preco_venda} onChange={e => setProductForm({...productForm, preco_venda: e.target.value})} /></div>
              <button type="submit" className="btn-primary w-full">Cadastrar</button>
              <button type="button" className="btn-ghost w-full" onClick={() => setShowProductModal(false)}>Cancelar</button>
            </form>
          </div>
        </div>
      )}

      {showTransformModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '650px' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="m-0">Transformar Lote {selectedBatch?.lote}</h3>
              <span className="badge-primary">{selectedBatch?.saldo_kg.toFixed(3)}kg disponíveis</span>
            </div>
            
            <form onSubmit={handleTransform} className="flex-column gap-3 mt-3">
              <div className="transform-rows flex-column gap-2 mb-3">
                {transformItems.map((item, idx) => (
                  <div key={idx} className="transform-row">
                    <div className="input-group m-0 flex-1">
                      <label>Produto</label>
                      <select required value={item.produto_id} onChange={e => {
                        const newItems = [...transformItems]; newItems[idx].produto_id = e.target.value; setTransformItems(newItems);
                      }}>
                        <option value="">Selecione...</option>
                        {produtos.map(p => <option key={p.id} value={p.id}>{p.nome} ({p.peso_liquido_g}g)</option>)}
                      </select>
                    </div>
                    <div className="input-group m-0" style={{ width: '100px' }}>
                      <label>Qtd (Un)</label>
                      <input required type="number" min="1" value={item.quantidade} onChange={e => {
                        const newItems = [...transformItems]; newItems[idx].quantidade = e.target.value; setTransformItems(newItems);
                      }} />
                    </div>
                    <button type="button" className="btn-icon text-error" onClick={() => removeTransformLine(idx)}>
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>

              <button type="button" className="btn-secondary btn-sm flex items-center gap-1 w-full justify-center" onClick={addTransformLine}>
                <Plus size={16} /> Adicionar Produto
              </button>

              <div className="summary-banner p-3 mt-2 rounded flex justify-between items-center">
                <span className="text-muted">Massa a ser utilizada:</span>
                <div className="flex items-center gap-2">
                  <strong style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>
                    {(() => {
                      const totalG = transformItems.reduce((acc, it) => {
                        const p = produtos.find(prod => prod.id === it.produto_id);
                        return acc + (Number(p?.peso_liquido_g || 0) * Number(it.quantidade || 0));
                      }, 0);
                      return (totalG / 1000).toFixed(3);
                    })()} kg
                  </strong>
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>/ {selectedBatch?.saldo_kg.toFixed(3)}kg</span>
                </div>
              </div>

              <div className="flex-column gap-2 mt-4">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Processando...' : 'Confirmar Transformação'}
                </button>
                <button type="button" className="btn-ghost" onClick={() => setShowTransformModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .tabs-container { display: flex; gap: 12px; margin-bottom: 2px; }
        .tab-btn { padding: 14px 28px; border-radius: 12px 12px 0 0; background: #f1f1f1; border: none; cursor: pointer; font-weight: 700; color: #888; display: flex; align-items: center; gap: 10px; transition: var(--transition); font-size: 0.95rem; }
        .tab-btn.active { background: white; color: var(--primary); border-top: 4px solid var(--secondary); box-shadow: 0 -4px 10px rgba(0,0,0,0.05); }
        .grid-stock { display: grid; grid-template-columns: 1fr 420px; gap: 30px; align-items: flex-start; }
        table { border-collapse: separate; border-spacing: 0; width: 100%; }
        th { text-align: left; padding: 12px 15px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; font-size: 0.72rem; letter-spacing: 0.05em; border-bottom: 2px solid #f8f9fa; }
        td { padding: 10px 15px; border-bottom: 1px solid #f8f9fa; }
        .badge-cost { background: #fff8e1; border: 1px solid #ffcc00; color: #856404; padding: 4px 12px; border-radius: 8px; font-weight: 700; }
        .text-success { color: #2e7d32; }
        .text-error { color: #d32f2f; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: #fff; padding: 30px; border-radius: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.15); }
        .input-group label { display: block; font-size: 0.85rem; font-weight: 700; color: #6d4c41; margin-bottom: 8px; }
        .input-group input, .input-group select { width: 100%; padding: 12px 16px; border-radius: 12px; border: 2px solid #edede9; }
        .btn-primary { background: #3d2b1f; color: #fff; border: none; padding: 14px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; }
        .btn-secondary { background: #fdfaf5; color: #8b5e3c; border: 2px solid #e7c8a0; padding: 10px 20px; border-radius: 12px; font-weight: 700; cursor: pointer; }
        .btn-ghost { background: transparent; color: #6d4c41; border: 2px solid #edede9; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; }
        .btn-sm { padding: 6px 12px; font-size: 0.8rem; border-radius: 8px; }

        .transform-row { display: grid; grid-template-columns: 1fr 100px 40px; gap: 15px; align-items: end; border-bottom: 1px solid #f0f0f0; padding-bottom: 15px; }
        .btn-icon { background: none; border: none; cursor: pointer; padding: 8px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; border-radius: 8px; }
        .btn-icon:hover { background: #fff1f0; }
        .summary-banner { background: #fdfaf5; border: 1px solid #e7c8a0; }
        
        /* Utilities */
        .w-full { width: 100%; }
        .flex-column { display: flex; flex-direction: column; }
        .justify-center { justify-content: center; }
        .m-0 { margin: 0; }
        .mb-4 { margin-bottom: 1.5rem; }
        .mt-4 { margin-top: 1.5rem; }
      `}} />
    </div>
  );
};

export default Estoque;
