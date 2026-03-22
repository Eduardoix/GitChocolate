import React, { useState, useEffect } from 'react';
import { Plus, Beaker, ChevronRight, Trash2, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const FormulaList = () => {
  const [formulas, setFormulas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFormulas = async () => {
    setLoading(true);
    // Fetch formulas with items and their ingredient costs
    const { data, error } = await supabase
      .from('formulas')
      .select('*, formula_itens(*, insumos(custo_unitario))')
      .order('created_at', { ascending: false });
    
    if (!error) {
      const formulasWithCost = data.map(f => {
        const cost = f.formula_itens?.reduce((acc, item) => {
          return acc + (Number(item.percentual || 0) * Number(item.insumos?.custo_unitario || 0) / 100);
        }, 0);
        return { ...f, costPerKg: cost };
      });
      setFormulas(formulasWithCost);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFormulas();
  }, []);

  const handleDelete = async (id) => {
    if (confirm('Deseja excluir esta fórmula?')) {
      const { error } = await supabase.from('formulas').delete().eq('id', id);
      if (!error) fetchFormulas();
    }
  };

  return (
    <div className="flex-column gap-3">
      <div className="flex justify-between items-center">
        <div>
          <h1>Minhas Fórmulas</h1>
          <p className="text-muted">Gerencie suas receitas base de chocolate.</p>
        </div>
        <Link to="/formulas/new" className="btn-primary flex items-center gap-1">
          <Plus size={20} /> Nova Fórmula
        </Link>
      </div>

      <div className="grid-formulas">
        {loading ? <p>Carregando...</p> : (
          formulas.length === 0 ? (
            <div className="card text-center p-5">
              <Beaker size={48} className="text-muted mb-2" />
              <p>Nenhuma fórmula cadastrada ainda.</p>
            </div>
          ) : (
            formulas.map((f) => (
              <div key={f.id} className="card formula-card flex justify-between items-end">
                <div className="flex gap-3 items-start">
                  <div className="formula-icon">
                    <Beaker size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0 }}>{f.nome}</h3>
                    <p className="text-muted" style={{ fontSize: '0.9rem' }}>{f.descricao || 'Sem descrição'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="badge">{f.formula_itens?.length || 0} Insumos</span>
                      <span className="badge-cost">Custo: R$ {Number(f.costPerKg || 0).toFixed(2)}/kg</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-column items-end gap-3">
                  <div className="flex items-center gap-2">
                    <button className="btn-ghost text-error" onClick={() => handleDelete(f.id)}>
                      <Trash2 size={20} />
                    </button>
                    <Link to={`/formulas/${f.id}`} className="btn-secondary p-1 rounded">
                      <ChevronRight size={24} />
                    </Link>
                  </div>
                  <Link 
                    to={`/producao/nova?formulaId=${f.id}`} 
                    className="btn-fabricar flex items-center gap-1"
                    title="Iniciar Produção deste Lote"
                  >
                    <PlayCircle size={18} /> Fabricar
                  </Link>
                </div>
              </div>
            ))
          )
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .grid-formulas {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 20px;
        }
        .formula-card {
          transition: var(--transition);
          border-left: 4px solid var(--secondary);
        }
        .formula-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }
        .formula-icon {
          width: 50px; height: 50px;
          background: var(--bg-cream);
          color: var(--primary);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
        }
        .badge {
          background: #f0f0f0;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          color: var(--text-muted);
          display: inline-block;
        }
        .badge-cost {
          background: #fff8e1;
          border: 1px solid #ffcc00;
          color: #856404;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .btn-fabricar {
          background: #2e7d32;
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9rem;
          transition: var(--transition);
          text-decoration: none;
        }
        .btn-fabricar:hover {
          background: #1b5e20;
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(46, 125, 50, 0.3);
        }
      `}} />
    </div>
  );
};

export default FormulaList;
