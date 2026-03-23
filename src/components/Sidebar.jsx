import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Beaker, Package, Truck, Boxes, LogOut, Menu, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Insumos', path: '/insumos', icon: <Package size={20} /> },
    { name: 'Fórmulas', path: '/formulas', icon: <Beaker size={20} /> },
    { name: 'Produção', path: '/producao', icon: <Truck size={20} /> },
    { name: 'Estoque', path: '/estoque', icon: <Boxes size={20} /> },
  ];

  return (
    <>
      {/* Cabeçalho Mobile */}
      <div className="mobile-header">
        <div className="mobile-header-logo">
          <div className="logo-icon" style={{width: 28, height: 28, fontSize: '1rem'}}>C</div>
          <h2>Choco<span>Flow</span></h2>
        </div>
        <button className="menu-toggle" onClick={() => setIsOpen(!isOpen)}>
          <Menu size={28} />
        </button>
      </div>

      {/* Fundo escuro atrás do Sidebar no mobile */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'show' : ''}`} 
        onClick={() => setIsOpen(false)}
      />

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">C</div>
          <h2>Choco<span>Flow</span></h2>
          <button className="menu-close-mobile" onClick={() => setIsOpen(false)}>
            <X size={24} />
          </button>
        </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button 
          className="nav-item btn-ghost" 
          style={{ width: '100%', justifyContent: 'flex-start' }}
          onClick={async () => {
            const { error } = await supabase.auth.signOut();
            if (error) alert("Erro ao sair: " + error.message);
          }}
        >
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .sidebar {
          width: 260px;
          height: 100vh;
          background: var(--primary);
          color: white;
          position: fixed;
          left: 0;
          top: 0;
          display: flex;
          flex-direction: column;
          padding: 30px 20px;
          z-index: 100;
        }
        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 40px;
        }
        .logo-icon {
          width: 32px;
          height: 32px;
          background: var(--secondary);
          border-radius: 8px;
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.2rem;
        }
        .sidebar-logo h2 {
          color: white;
          font-size: 1.4rem;
          margin: 0;
        }
        .sidebar-logo h2 span { color: var(--secondary); }
        .menu-close-mobile { display: none; background: transparent; color: white; border: none; }
        
        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          border-radius: 10px;
          transition: var(--transition);
        }
        .nav-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }
        .nav-item.active {
          background: var(--secondary);
          color: var(--primary);
          font-weight: 600;
        }
        .sidebar-footer {
          margin-top: auto;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 20px;
        }

        @media (max-width: 768px) {
          .sidebar-logo h2 { display: none; }
          .logo-icon { display: none; }
          .menu-close-mobile { display: block; margin-left: auto; }
          .sidebar-logo { margin-bottom: 20px; }
        }
      `}} />
    </aside>
    </>
  );
};

export default Sidebar;
