import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Save, Beaker, CheckCircle2, AlertCircle, Plus, Trash2, Scale, RefreshCw } from 'lucide-react';

const ProducaoEditor = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [formulaId, setFormulaId] = useState(searchParams.get('formulaId') || '');
  const [volumeTotal, setVolumeTotal] = useState(10);
  const [dataProducao, setDataProducao] = useState(new Date().toISOString().split('T')[0]);
  const [lote, setLote] = useState('');
  const [status, setStatus] = useState('planejado');
  const [pesoFinal, setPesoFinal] = useState(0);
  const [perda, setPerda] = useState(0);
  const [observacoes, setObservacoes] = useState('');

  // Data State
  const [formulas, setFormulas] = useState([]);
  const [batchItens, setBatchItens] = useState([]);
  const [adicoes, setAdicoes] = useState([]);
  const [batchData, setBatchData] = useState(null);
  const [addWeights, setAddWeights] = useState({}); // Tracking inputs per item
  const [manualVolume, setManualVolume] = useState(volumeTotal);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    const { data: fData } = await supabase.from('formulas').select('*');
    if (fData) setFormulas(fData);

    if (id && id !== 'nova') {
      const { data: bData } = await supabase.from('bateladas').select('*, formulas(*)').eq('id', id).single();
      if (bData) {
        setBatchData(bData);
        setFormulaId(bData.formula_id);
        setVolumeTotal(bData.volume_total_kg);
        setDataProducao(bData.data_producao.split('T')[0]);
        setLote(bData.lote_interno);
        setStatus(bData.status);
        setStep(bData.status === 'planejado' ? 1 : 2);

        const { data: iData } = await supabase.from('batelada_itens').select('*, insumos(*)').eq('batelada_id', id).order('id');
        if (iData) setBatchItens(iData);

        const { data: aData } = await supabase.from('batelada_adicoes').select('*').eq('batelada_id', id).order('created_at', { ascending: true });
        if (aData) setAdicoes(aData);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (volumeTotal) setManualVolume(volumeTotal);
  }, [volumeTotal]);

  const startBatch = async () => {
    if (!formulaId || !volumeTotal || !lote) return alert('Preencha os dados básicos');
    setLoading(true);

    const batchDataToSave = {
      formula_id: formulaId,
      volume_total_kg: volumeTotal,
      data_producao: dataProducao,
      lote_interno: lote,
      status: 'em_processo',
      data_inicio: new Date().toISOString()
    };

    if (id && id !== 'nova') {
      batchDataToSave.id = id;
    }

    const { data: bData, error } = await supabase
      .from('bateladas')
      .upsert([batchDataToSave])
      .select()
      .single();

    if (error) {
      alert('Erro ao iniciar batelada: ' + error.message);
      setLoading(false);
      return;
    }

    // Generate batch items from formula
    const { data: fItens } = await supabase.from('formula_itens').select('*, insumos(*)').eq('formula_id', formulaId);
    if (fItens) {
      const batchItensToSave = fItens.map(it => ({
        batelada_id: bData.id,
        insumo_id: it.insumo_id,
        peso_previsto_kg: (volumeTotal * it.percentual / 100).toFixed(3),
        percentual: it.percentual
      }));
      await supabase.from('batelada_itens').insert(batchItensToSave);
    }

    setLoading(false);
    navigate(`/producao/${bData.id}`);
    fetchData(); // Reload
  };

  const addWeight = async (insumoId, batchItemId) => {
    const weightGrams = parseFloat(addWeights[insumoId]);
    if (!weightGrams || weightGrams <= 0) return;

    const weightKg = weightGrams / 1000;
    setLoading(true);
    
    // Save the addition log
    const { error: aError } = await supabase.from('batelada_adicoes').insert([{
      batelada_id: id,
      insumo_id: insumoId,
      peso_kg: weightKg
    }]);

    if (!aError) {
      const item = batchItens.find(it => it.id === batchItemId);
      const percent = Number(item.percentual);
      const newPesoAtual = (Number(item.peso_atual_kg || 0) + weightKg).toFixed(3);
      
      // CHECK FOR SCALING: If added weight exceeds current required weight
      if (Number(newPesoAtual) > Number(item.peso_previsto_kg) && percent > 0) {
        // Calculate new total volume based on this ingredient's percentage
        // Total = Weight / (Percent / 100)
        const newVolumeTotal = (Number(newPesoAtual) / (percent / 100)).toFixed(3);
        
        if (!isNaN(newVolumeTotal) && isFinite(newVolumeTotal)) {
          // 1. Update the Main Batch Volume
          await supabase.from('bateladas').update({ volume_total_kg: newVolumeTotal }).eq('id', id);

          // 2. Recalculate all items in the batch
          const updates = batchItens.map(it => {
            const itPercent = Number(it.percentual);
            const newPrevisto = (newVolumeTotal * itPercent / 100).toFixed(3);
            const isCompleted = Number(it.id === batchItemId ? newPesoAtual : (it.peso_atual_kg || 0)) >= Number(newPrevisto) - 0.001;
            
            return supabase.from('batelada_itens').update({ 
              peso_previsto_kg: newPrevisto,
              adicionado: isCompleted,
              peso_atual_kg: it.id === batchItemId ? newPesoAtual : it.peso_atual_kg
            }).eq('id', it.id);
          });
          await Promise.all(updates);
          
          alert(`Batelada recalculada! Novo volume total: ${newVolumeTotal}kg.`);
        }
      } else {
        // Normal update
        const isCompleted = Number(newPesoAtual) >= (Number(item.peso_previsto_kg) || 0) - 0.001;
        await supabase.from('batelada_itens')
          .update({ peso_atual_kg: newPesoAtual, adicionado: isCompleted })
          .eq('id', batchItemId);
      }
      
      setAddWeights({ ...addWeights, [insumoId]: '' });
      fetchData(); // Refresh everything
    }
    setLoading(false);
  };

  const recalculateBatch = async () => {
    const newVol = parseFloat(manualVolume);
    if (isNaN(newVol) || newVol <= 0) return alert('Informe um volume válido');
    if (!window.confirm(`Deseja recalcular toda a batelada para ${newVol}kg?`)) return;
    
    setLoading(true);
    try {
      // 1. Update the Main Batch Volume
      await supabase.from('bateladas').update({ volume_total_kg: newVol }).eq('id', id);

      // 2. Recalculate all items in the batch
      const updates = batchItens.map(it => {
        const itPercent = Number(it.percentual);
        const newPrevisto = (newVol * itPercent / 100).toFixed(3);
        const isCompleted = Number(it.peso_atual_kg || 0) >= Number(newPrevisto) - 0.001;
        
        return supabase.from('batelada_itens').update({ 
          peso_previsto_kg: newPrevisto,
          adicionado: isCompleted
        }).eq('id', it.id);
      });
      await Promise.all(updates);
      
      setVolumeTotal(newVol);
      await fetchData(); // Reload
      alert(`Batelada recalculada para ${newVol}kg!`);
    } catch (err) {
      alert('Erro ao recalcular: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeWeight = async (logId, batchItem) => {
    if (!window.confirm('Deseja remover este registro de adição?')) return;
    setLoading(true);
    
    // 1. Get Log and Delete
    const { data: logData } = await supabase.from('batelada_adicoes').select('*').eq('id', logId).single();
    if (!logData) return setLoading(false);
    
    const { error: dError } = await supabase.from('batelada_adicoes').delete().eq('id', logId);
    
    if (!dError) {
      // 2. Update Batelada Item Weight
      const weightToRemove = Number(logData.peso_kg);
      const newPesoAtual = Math.max(0, Number(batchItem.peso_atual_kg || 0) - weightToRemove).toFixed(3);
      const isCompleted = Number(newPesoAtual) >= (Number(batchItem.peso_previsto_kg) || 0) - 0.001;

      const { error: uError } = await supabase.from('batelada_itens')
        .update({ peso_atual_kg: newPesoAtual, adicionado: isCompleted })
        .eq('id', batchItem.id);

      if (!uError) {
        fetchData();
      } else {
        alert('Erro ao atualizar peso: ' + uError.message);
      }
    } else {
      alert('Erro ao excluir registro: ' + dError.message);
    }
    setLoading(false);
  };

  const finishBatch = async () => {
    if (pesoFinal <= 0) return alert('Informe o peso final obtido');
    setLoading(true);

    try {
      // 1. Calculate and Deduct Raw Materials (Insumos)
      let totalCostCalculated = 0;
      for (const item of batchItens) {
        if (Number(item.peso_atual_kg) > 0) {
          // Get current stock AND cost
          const { data: ins } = await supabase.from('insumos').select('estoque_atual, custo_unitario').eq('id', item.insumo_id).single();
          
          totalCostCalculated += (Number(item.peso_atual_kg) * Number(ins?.custo_unitario || 0));
          
          const newStock = (Number(ins?.estoque_atual || 0) - Number(item.peso_atual_kg)).toFixed(3);
          await supabase.from('insumos').update({ estoque_atual: newStock }).eq('id', item.insumo_id);
          
          await supabase.from('movimentacao_estoque').insert([{
            insumo_id: item.insumo_id,
            batelada_id: id,
            tipo: 'saida',
            quantidade: item.peso_atual_kg,
            motivo: `Consumo na batelada ${lote}`
          }]);
        }
      }

      // 2. Update Batch Status and Cost
      const totalCostWithOverhead = (totalCostCalculated * 1.05).toFixed(2);
      
      const { error: bError } = await supabase
        .from('bateladas')
        .update({ 
          status: 'concluido', 
          peso_final_kg: pesoFinal, 
          perda_kg: Math.max(0, (volumeTotal - pesoFinal).toFixed(3)),
          custo_total_materia_prima: totalCostWithOverhead,
          observacoes
        })
        .eq('id', id);
      
      if (bError) throw bError;

      // 3. Add Finished Product Movement (Massa Base)
      await supabase.from('movimentacao_estoque').insert([{
        batelada_id: id,
        tipo: 'entrada',
        quantidade: pesoFinal,
        motivo: `Produção concluída lote ${lote}`
      }]);

      alert('Batelada concluída e estoque atualizado!');
      navigate('/producao');
    } catch (err) {
      alert('Erro ao finalizar batelada: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const allAdded = batchItens.length > 0 && batchItens.every(it => it.adicionado);

  // Calculate effective start time (first addition or data_inicio)
  const firstLog = adicoes.length > 0 ? adicoes[0].created_at : batchData?.data_inicio;
  // Calculate real total weight currently added
  const totalRealKg = batchItens.reduce((acc, it) => acc + (Number(it.peso_atual_kg) || 0), 0);

  return (
    <div className="flex-column gap-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link to="/producao" className="btn-ghost" title="Voltar"><ArrowLeft size={24} /></Link>
          <div className="flex-column" style={{ alignItems: 'flex-start' }}>
            <div className="flex items-center gap-2">
              <h1>{id === 'nova' ? 'Planejar Batelada' : `Batelada: ${lote}`}</h1>
              {id !== 'nova' && <span className="badge-primary">Alvo: {volumeTotal * 1000}g</span>}
              {id !== 'nova' && <span className="badge-secondary">Real: {(totalRealKg * 1000).toFixed(0)}g</span>}
            </div>
            {firstLog && (
              <span className="text-secondary" style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                Início: {new Date(firstLog).toLocaleString('pt-BR')}
                {status === 'em_processo' && (
                  <>
                    <span style={{ margin: '0 8px', color: '#ccc' }}>|</span>
                    Tempo em processo: {(() => {
                      const diffMs = now - new Date(firstLog);
                      const diffHrs = Math.floor(diffMs / 3600000);
                      const diffMins = Math.floor((diffMs % 3600000) / 60000);
                      return `${diffHrs}h ${diffMins}m`;
                    })()}
                  </>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {step === 1 && (
        <div className="card max-w-600">
          <h3>Configuração da Produção</h3>
          <div className="grid-2 mt-3">
            <div className="form-group">
              <label>Escolha a Fórmula</label>
              <select value={formulaId} onChange={(e) => setFormulaId(e.target.value)} disabled={id !== 'nova'}>
                <option value="">Selecione...</option>
                {formulas.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Volume Total (kg)</label>
              <input type="number" step="0.1" value={volumeTotal} onChange={(e) => setVolumeTotal(e.target.value)} disabled={id !== 'nova'} />
            </div>
            <div className="form-group">
              <label>Data de Produção</label>
              <input type="date" value={dataProducao} onChange={(e) => setDataProducao(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Número do Lote</label>
              <input type="text" value={lote} onChange={(e) => setLote(e.target.value)} />
            </div>
          </div>
          <button className="btn-primary w-100 mt-4" onClick={startBatch} disabled={loading}>
            {loading ? 'Processando...' : (id === 'nova' ? 'Iniciar Produção' : 'Atualizar Dados')}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="grid-production-process">
          <div className="flex-column gap-3">
            <div className="card">
              <h3>Ingredientes para a Massa ({volumeTotal}kg)</h3>
              <p className="text-muted mb-3">Adicione os insumos conforme a balança.</p>
              
              <div className="ingredient-checklist">
                {batchItens.map(it => {
                  const itemLogs = adicoes.filter(a => a.insumo_id === it.insumo_id);
                  const previstoKg = Number(it.peso_previsto_kg) || 0;
                  const atualKg = Number(it.peso_atual_kg) || 0;
                  const missing = Math.max(0, previstoKg - atualKg).toFixed(3);
                  const previstoG = Math.round(previstoKg * 1000);
                  const atualG = Math.round(atualKg * 1000);
                  const missingG = Math.round(Number(missing) * 1000);
                  
                  return (
                    <div key={it.id} className={`checklist-item ${it.adicionado ? 'completed' : ''}`}>
                      <div className="item-main">
                        <div className="item-info">
                          <span className="item-name">{it.insumos?.nome}</span>
                          <span className="item-weight">Previsto: {previstoG} g</span>
                          <span className="item-current">Adicionado: {atualG} g</span>
                        </div>
                        
                        <div className="item-actions">
                          <div className="input-with-label">
                            <span>Adicionar (g):</span>
                            <input 
                              type="number" 
                              step="1" 
                              className="small-input"
                              value={addWeights[it.insumo_id] || ''}
                              onChange={(e) => setAddWeights({...addWeights, [it.insumo_id]: e.target.value})}
                              placeholder={missingG > 0 ? missingG : '0'}
                            />
                          </div>
                          <button className="btn-secondary btn-sm" onClick={() => addWeight(it.insumo_id, it.id)} disabled={loading}>
                            Adicionar
                          </button>
                        </div>

                        {it.adicionado && (
                          <div className="item-status text-success ml-2">
                             ✓
                          </div>
                        )}
                      </div>

                      {itemLogs.length > 0 && (
                        <div className="item-logs mt-2">
                          <p><strong>Registro de Adições:</strong></p>
                          <ul>
                            {itemLogs.map((log, idx) => {
                              const logTime = new Date(log.created_at);
                              const diffMinutes = Math.floor((now - logTime) / 60000);
                              
                              return (
                                <li key={log.id} className="flex justify-between items-center py-1">
                                  <span>{idx + 1}ª Adição: <strong>{log.peso_kg * 1000} g</strong> - {logTime.toLocaleTimeString()} ({diffMinutes} min atrás)</span>
                                  <button type="button" className="btn-remove-log" onClick={() => removeWeight(log.id, it)} title="Remover adição acidental">
                                    <Trash2 size={14} />
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                      
                      {!it.adicionado && (
                        <div className="item-missing mt-1 text-error">
                          Faltando: <strong>{missingG} g</strong>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex-column gap-3">
              <div className="card">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="m-0">Resumo do Processo</h3>
                  <div className="flex items-center gap-2">
                    <div className="input-with-label">
                      <input 
                        type="number" 
                        step="0.1" 
                        className="small-input"
                        value={manualVolume}
                        onChange={(e) => setManualVolume(e.target.value)}
                        style={{ width: '70px', textAlign: 'center' }}
                      />
                    </div>
                    <button 
                      className="btn-secondary btn-sm flex items-center gap-1" 
                      onClick={recalculateBatch}
                      disabled={loading}
                      title="Recalcular pesos com base no novo volume"
                    >
                      <RefreshCw size={14} className={loading ? 'spin' : ''} />
                      Recalcular
                    </button>
                  </div>
                </div>
                
                <div className="process-stats mt-2">
                  <div className="stat-row">
                    <span>Progresso:</span>
                    <strong>{batchItens.filter(it => it.adicionado).length} / {batchItens.length}</strong>
                  </div>
                  <div className="stat-row">
                    <span>Status:</span>
                    <span className="badge-warning">Em Processo</span>
                  </div>

                  {/* Engenharia da Fórmula */}
                  <div className="border-top mt-3 pt-3">
                    <h4 className="mb-2" style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>Composição da Fórmula</h4>
                    <div className="flex-column gap-1 mb-3">
                      {batchItens.map(it => (
                        <div key={it.id} className="flex justify-between text-sm">
                          <span style={{ color: '#555' }}>{it.insumos?.nome}</span>
                          <span className="font-600">{Number(it.percentual).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex-column gap-1 bg-cream p-2 rounded border mt-3">
                      {(() => {
                        const fatTotal = batchItens.reduce((acc, it) => acc + (it.percentual * Number(it.insumos?.perc_gordura_total || 0) / 100), 0);
                        const milkFat = batchItens.reduce((acc, it) => acc + (it.percentual * Number(it.insumos?.perc_gordura_lactea || 0) / 100), 0);
                        const cocoaFatTotal = batchItens.reduce((acc, it) => acc + (it.percentual * Number(it.insumos?.perc_manteiga_cacau || 0) / 100), 0);
                        const eutecticIdx = fatTotal > 0 ? (milkFat / fatTotal) * 100 : 0;
                        
                        return (
                          <>
                            <div className="flex justify-between text-sm py-1 border-bottom-dashed">
                              <span style={{ color: '#555' }}>Índice Eutético</span>
                              <span className={`font-700 ${eutecticIdx > 20 ? 'text-error' : 'text-secondary'}`}>{eutecticIdx.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between text-sm py-1">
                              <span style={{ color: '#555' }}>Gordura de Cacau</span>
                              <span className={`font-700 ${cocoaFatTotal < 30 ? 'text-error' : ''}`} style={{ color: cocoaFatTotal < 30 ? 'var(--error)' : '#2e7d32' }}>{cocoaFatTotal.toFixed(1)}%</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Timeline de Produção (3 Dias Estimados) */}
                    {firstLog && (
                      <div className="mt-4 pt-3 border-top">
                        <h4 className="mb-2" style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>Timeline da Batelada (72h)</h4>
                        {(() => {
                          const diffMs = now - new Date(firstLog);
                          const totalHrs = diffMs / 3600000;
                          
                          return (
                            <div className="flex-column gap-2">
                              <div className="timeline-container">
                                <div className="timeline-segment" style={{ opacity: totalHrs < 24 ? 1 : 0.6 }}>
                                  <div className="segment-fill moagem" style={{ width: `${Math.min((totalHrs/24)*100, 100)}%` }} />
                                  <span>Moagem</span>
                                </div>
                                <div className="timeline-segment" style={{ opacity: totalHrs >= 24 && totalHrs < 48 ? 1 : (totalHrs >= 48 ? 0.6 : 0.3) }}>
                                  <div className="segment-fill refino" style={{ width: `${totalHrs < 24 ? 0 : Math.min(((totalHrs-24)/24)*100, 100)}%` }} />
                                  <span>Refino</span>
                                </div>
                                <div className="timeline-segment" style={{ opacity: totalHrs >= 48 ? 1 : 0.3 }}>
                                  <div className="segment-fill conchagem" style={{ width: `${totalHrs < 48 ? 0 : Math.min(((totalHrs-48)/24)*100, 100)}%` }} />
                                  <span>Conchagem</span>
                                </div>
                              </div>
                              <div className="text-center text-xs text-muted font-600 uppercase mt-1">
                                {totalHrs < 24 && `Fase Atual: Moagem (${totalHrs.toFixed(1)}h decorridas)`}
                                {totalHrs >= 24 && totalHrs < 48 && `Fase Atual: Refino (${(totalHrs-24).toFixed(1)}h nesta fase)`}
                                {totalHrs >= 48 && totalHrs < 72 && `Fase Atual: Conchagem (${(totalHrs-48).toFixed(1)}h nesta fase)`}
                                {totalHrs >= 72 && 'Produção Estimada Concluída! Pronto para fechar.'}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              
              {allAdded && (
                <div className="finish-section mt-4 pt-4 border-top">
                  <h4 className="flex items-center gap-1"><Scale size={18} /> Finalização do Lote</h4>
                  <div className="form-group mt-2">
                    <label>Peso Final Obtido (kg)</label>
                    <input 
                      type="number" 
                      step="0.001" 
                      placeholder="Ex: 9.850" 
                      onChange={(e) => {
                        setPesoFinal(e.target.value);
                        setPerda((volumeTotal - e.target.value).toFixed(3));
                      }} 
                    />
                  </div>
                  {pesoFinal > 0 && (
                    <div className="perda-info mt-2">
                      Perda Calculada: <strong>{perda} kg</strong> ({((perda/volumeTotal)*100).toFixed(1)}%)
                    </div>
                  )}
                  <button className="btn-primary w-100 mt-3" onClick={finishBatch}>
                    Concluir e Salvar no Estoque
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .max-w-600 { max-width: 600px; margin: 0 auto; }
        .grid-production-process {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 20px;
        }
        .ingredient-checklist {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .checklist-item {
          display: flex;
          flex-direction: column;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 12px;
          border-left: 4px solid #ddd;
          transition: var(--transition);
        }
        .item-main {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }
        .checklist-item.completed {
          background: #e8f5e9;
          border-left-color: #2e7d32;
        }
        .item-info { display: flex; flex-direction: column; gap: 2px; }
        .item-name { font-weight: 700; color: var(--primary); font-size: 1.1rem; }
        .item-weight { font-size: 0.9rem; color: var(--text-muted); }
        .item-current { font-size: 1rem; font-weight: 600; color: var(--secondary); }
        
        .item-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .input-with-label {
          display: flex;
          flex-direction: column;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .small-input {
          width: 80px;
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid #ddd;
          font-weight: 600;
        }
        .btn-sm { padding: 6px 12px; font-size: 0.85rem; }

        .item-logs {
          font-size: 0.8rem;
          padding-top: 10px;
          border-top: 1px dashed #ddd;
          color: #555;
        }
        .item-logs ul { list-style: none; padding: 0; margin-top: 5px; }
        .item-logs li { padding: 2px 0; }
        .item-missing { font-size: 0.85rem; font-weight: 600; }
        
        .btn-remove-log {
          background: none;
          border: none;
          color: #d32f2f;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background 0.2s;
        }
        .btn-remove-log:hover { background: #fee2e2; }

        .process-stats { display: flex; flex-direction: column; gap: 8px; }
        .stat-row { display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid #eee; }
        .badge-warning { background: #fff3e0; color: #f57c00; padding: 2px 8px; border-radius: 10px; font-size: 0.8rem; font-weight: 700; }
        .badge-primary { background: #e3f2fd; color: #1976d2; padding: 4px 10px; border-radius: 15px; font-size: 0.85rem; font-weight: 700; border: 1px solid #bbdefb; }
        .badge-secondary { background: #f3e5f5; color: #7b1fa2; padding: 4px 10px; border-radius: 15px; font-size: 0.85rem; font-weight: 700; border: 1px solid #e1bee7; }
        
        /* Timeline Styles */
        .timeline-container { display: flex; gap: 4px; height: 32px; width: 100%; margin-top: 8px; }
        .timeline-segment { 
          flex: 1; 
          background: #eee; 
          border-radius: 4px; 
          position: relative; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-size: 0.7rem; 
          font-weight: 700; 
          text-transform: uppercase; 
          color: #888; 
          overflow: hidden; 
        }
        .segment-fill { position: absolute; left: 0; top: 0; height: 100%; transition: width 0.5s ease; z-index: 1; opacity: 0.3; }
        .segment-fill.moagem { background: #2196f3; }
        .segment-fill.refino { background: #4caf50; }
        .segment-fill.conchagem { background: #9c27b0; }
        .timeline-segment span { position: relative; z-index: 2; }
        
        .border-top { border-top: 1px solid #eee; }
        .border-bottom-dashed { border-bottom: 1px dashed #eee; }
        .perda-info { color: var(--error); font-size: 0.9rem; }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
      `}} />
    </div>
  );
};

export default ProducaoEditor;
