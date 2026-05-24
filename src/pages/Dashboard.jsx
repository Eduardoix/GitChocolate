import React, { useState, useEffect } from 'react';
import { Package, Beaker, ShoppingBag, History, AlertTriangle, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState([
    { title: 'Insumos', value: '0', icon: <Package size={24} />, color: '#3d1d13' },
    { title: 'Fórmulas', value: '0', icon: <Beaker size={24} />, color: '#d4af37' },
    { title: 'Valor em Estoque', value: 'R$ 0,00', icon: <ShoppingBag size={24} />, color: '#8b4513' },
    { title: 'Bateladas', value: '0', icon: <History size={24} />, color: '#5d352b' },
  ]);
  const [recentBateladas, setRecentBateladas] = useState([]);
  const [lowStockInsumos, setLowStockInsumos] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      // Counts
      const { count: formulasCount } = await supabase.from('formulas').select('*', { count: 'exact', head: true });
      const { count: bateladasCount } = await supabase.from('bateladas').select('*', { count: 'exact', head: true });
      
      // Insumos data for value and low stock
      const { data: insumos } = await supabase.from('insumos').select('*');
      
      let insumosCount = 0;
      let totalValue = 0;
      let lowStock = [];

      if (insumos) {
        insumosCount = insumos.length;
        insumos.forEach(ins => {
          totalValue += Number(ins.estoque_atual || 0) * Number(ins.custo_unitario || 0);
          if (Number(ins.estoque_atual || 0) <= 0.5) {
            lowStock.push(ins);
          }
        });
      }

      const { data: recent } = await supabase.from('bateladas').select('*, formulas(nome)').order('data_producao', { ascending: false }).limit(5);

      setStats([
        { title: 'Insumos', value: String(insumosCount), icon: <Package size={24} />, color: '#3d1d13' },
        { title: 'Fórmulas', value: String(formulasCount || 0), icon: <Beaker size={24} />, color: '#d4af37' },
        { title: 'Valor em Estoque', value: `R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: <ShoppingBag size={24} />, color: '#8b4513' },
        { title: 'Bateladas', value: String(bateladasCount || 0), icon: <History size={24} />, color: '#5d352b' },
      ]);
      if (recent) setRecentBateladas(recent);
      setLowStockInsumos(lowStock);
    };
    fetchStats();
  }, []);

  return (
    <div className="flex-column gap-3">
      <div className="flex justify-between items-center">
        <div>
          <h1>Painel de Controle</h1>
          <p className="text-muted">Bem-vindo ao ChocoFlow. Aqui está o resumo da sua produção.</p>
        </div>
      </div>

      {lowStockInsumos.length > 0 && (
        <div className="alert-banner">
          <div className="flex items-center gap-2" style={{ color: '#b45309', fontWeight: 600, marginBottom: '8px' }}>
            <AlertTriangle size={20} />
            Atenção: Insumos com estoque baixo
          </div>
          <div className="flex gap-2 flex-wrap">
            {lowStockInsumos.map(ins => (
              <span key={ins.id} className="low-stock-badge">
                {ins.nome}: {Number(ins.estoque_atual).toFixed(2)} {ins.unidade}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid-stats">
        {stats.map((stat, i) => (
          <div key={i} className="card flex items-center gap-2">
            <div className="stat-icon" style={{ backgroundColor: stat.color + '15', color: stat.color }}>
              {stat.icon}
            </div>
            <div>
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>{stat.title}</p>
              <h3 style={{ margin: 0 }}>{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3" style={{ marginTop: '20px' }}>
        <div className="card flex-1">
          <div className="flex justify-between items-center mb-3">
            <h3 style={{ margin: 0 }}>Bateladas Recentes</h3>
            <button className="btn-ghost btn-sm flex items-center gap-1" onClick={() => navigate('/producao')} style={{ border: 'none' }}>
              Ver todas <ArrowRight size={16} />
            </button>
          </div>
          <div className="flex-column gap-2">
            {recentBateladas.length === 0 ? <p className="text-muted">Nenhuma batelada registrada.</p> : 
              recentBateladas.map((b, i) => (
                <div key={i} className="flex justify-between items-center p-2 border-b">
                  <div className="flex items-center gap-2">
                    <div className="dot" />
                    <div>
                      <p style={{ margin: 0, fontWeight: 500 }}>{b.formulas?.nome || 'Fórmula Desconhecida'}</p>
                      <span className="text-muted" style={{ fontSize: '0.8rem' }}>{new Date(b.data_producao).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.9rem' }}>{b.volume_total_kg}kg</div>
                </div>
              ))
            }
          </div>
        </div>

        <div className="card" style={{ width: '350px' }}>
          <h3>Ações Rápidas</h3>
          <div className="flex-column gap-1 mt-3">
            <button className="btn-primary w-full" onClick={() => navigate('/producao/new')}>Nova Batelada</button>
            <button className="btn-secondary w-full" style={{ marginTop: '8px' }} onClick={() => navigate('/formulas/new')}>Criar Fórmula</button>
            <button className="btn-secondary w-full" style={{ marginTop: '8px' }} onClick={() => navigate('/etiquetas')}>Ver / Criar Etiquetas</button>
            <button className="btn-secondary w-full" style={{ marginTop: '8px' }} onClick={() => navigate('/estoque')}>Gerenciar Estoque</button>
            <button className="btn-ghost w-full" style={{ marginTop: '8px', border: '1px solid #e1e1e1' }} onClick={() => alert('Módulo de relatórios em desenvolvimento.')}>Gerar Relatório</button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .grid-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--secondary);
        }
        .border-b {
          border-bottom: 1px solid #f0f0f0;
          padding-bottom: 12px;
        }
        .alert-banner {
          background: #fffbeb;
          border: 1px solid #fcd34d;
          padding: 16px;
          border-radius: 12px;
        }
        .low-stock-badge {
          background: #fef3c7;
          color: #b45309;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          border: 1px solid #fde68a;
        }
      `}} />
    </div>
  );
};

export default Dashboard;
