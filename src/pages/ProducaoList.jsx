import React, { useState, useEffect } from 'react';
import { Plus, Truck, ChevronRight, Clock, CheckCircle2, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const ProducaoList = () => {
  const [bateladas, setBateladas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBateladas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bateladas')
      .select('*, formulas(nome)')
      .order('created_at', { ascending: false });
    
    if (!error) setBateladas(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBateladas();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'planejado': return <span className="badge-status info"><Clock size={14}/> Planejado</span>;
      case 'em_processo': return <span className="badge-status warning"><PlayCircle size={14}/> Em Processo</span>;
      case 'concluido': return <span className="badge-status success"><CheckCircle2 size={14}/> Concluído</span>;
      default: return null;
    }
  };

  return (
    <div className="flex-column gap-3">
      <div className="flex justify-between items-center">
        <div>
          <h1>Produção</h1>
          <p className="text-muted">Acompanhe e registre suas bateladas de produção.</p>
        </div>
        <Link to="/producao/nova" className="btn-primary flex items-center gap-1">
          <Plus size={20} /> Nova Batelada
        </Link>
      </div>

      <div className="grid-production">
        {loading ? <p>Carregando...</p> : (
          bateladas.length === 0 ? (
            <div className="card text-center p-5">
              <Truck size={48} className="text-muted mb-2" />
              <p>Nenhuma batelada registrada.</p>
            </div>
          ) : (
            bateladas.map((b) => (
              <div key={b.id} className="card production-card flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="production-icon">
                    <Truck size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 style={{ margin: 0 }}>Lote: {b.lote_interno}</h3>
                      {getStatusBadge(b.status)}
                    </div>
                    <p className="text-muted mt-1">
                      Fórmula: <strong>{b.formulas?.nome}</strong> | Volume: <strong>{b.volume_total_kg}kg</strong>
                    </p>
                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                      Data: {new Date(b.data_producao).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Link to={`/producao/${b.id}`} className="btn-secondary flex items-center gap-1">
                  {b.status === 'concluido' ? 'Ver Detalhes' : 'Continuar'} <ChevronRight size={20} />
                </Link>
              </div>
            ))
          )
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .grid-production {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .production-card {
          border-left: 4px solid var(--secondary);
          transition: var(--transition);
        }
        .production-card:hover { transform: translateX(5px); }
        .production-icon {
          width: 50px; height: 50px;
          background: var(--bg-cream);
          color: var(--primary);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
        }
        .badge-status {
          display: flex; align-items: center; gap: 4px;
          padding: 2px 8px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;
        }
        .badge-status.info { background: #e3f2fd; color: #1976d2; }
        .badge-status.warning { background: #fff3e0; color: #f57c00; }
        .badge-status.success { background: #e8f5e9; color: #2e7d32; }
      `}} />
    </div>
  );
};

export default ProducaoList;
