import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Insumos from './pages/Insumos';
import Formulas from './pages/Formulas';
import FormulaList from './pages/FormulaList';
import ProducaoList from './pages/ProducaoList';
import ProducaoEditor from './pages/ProducaoEditor';
import Estoque from './pages/Estoque';
import Etiquetas from './pages/Etiquetas';
import Login from './pages/Login';
import { supabase } from './lib/supabase';

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  if (!session) {
    return <Login />;
  }

  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/insumos" element={<Insumos />} />
            <Route path="/formulas" element={<FormulaList />} />
            <Route path="/formulas/new" element={<Formulas />} />
            <Route path="/formulas/:id" element={<Formulas />} />
            <Route path="/producao" element={<ProducaoList />} />
            <Route path="/producao/:id" element={<ProducaoEditor />} />
            <Route path="/etiquetas" element={<Etiquetas />} />
            <Route path="/login" element={<Navigate to="/" />} />
            <Route path="/estoque" element={<Estoque />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
