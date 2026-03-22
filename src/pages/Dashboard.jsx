import React, { useState, useEffect } from 'react';
import { Package, Beaker, ShoppingBag, History, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Dashboard = () => {
  const [stats, setStats] = useState([
    { title: 'Insumos', value: '0', icon: <Package size={24} />, color: '#3d1d13' },
    { title: 'Fórmulas', value: '0', icon: <Beaker size={24} />, color: '#d4af37' },
    { title: 'Estoque', value: '0kg', icon: <ShoppingBag size={24} />, color: '#8b4513' },
    { title: 'Bateladas', value: '0', icon: <History size={24} />, color: '#5d352b' },
  ]);
  const [recentBateladas, setRecentBateladas] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      const { count: insumosCount } = await supabase.from('insumos').select('*', { count: 'exact', head: true });
      const { count: formulasCount } = await supabase.from('formulas').select('*', { count: 'exact', head: true });
      const { count: bateladasCount } = await supabase.from('bateladas').select('*', { count: 'exact', head: true });
      
      const { data: recent } = await supabase.from('bateladas').select('*, formulas(nome)').order('data_producao', { ascending: false }).limit(5);

      setStats([
        { title: 'Insumos', value: String(insumosCount || 0), icon: <Package size={24} />, color: '#3d1d13' },
        { title: 'Fórmulas', value: String(formulasCount || 0), icon: <Beaker size={24} />, color: '#d4af37' },
        { title: 'Estoque', value: '0kg', icon: <ShoppingBag size={24} />, color: '#8b4513' },
        { title: 'Bateladas', value: String(bateladasCount || 0), icon: <History size={24} />, color: '#5d352b' },
      ]);
      if (recent) setRecentBateladas(recent);
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
          <h3>Bateladas Recentes</h3>
          <div className="flex-column gap-2" style={{ marginTop: '16px' }}>
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
            <button className="btn-secondary w-full">Nova Batelada</button>
            <button className="btn-primary w-full" style={{ marginTop: '8px' }}>Gerar Relatório</button>
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
      `}} />
    </div>
  );
};

export default Dashboard;
