import { useEffect, useState } from 'react'
import { supabase } from './supabase/client'
import Auth from './components/Auth'
import ProjectsPage from './components/ProjectsPage'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import ProjectDetail from './components/ProjectDetail'
import NewProject from './components/NewProject'
import logo from './assets/Logo.PNG'
import { sincronizarPendientes } from './services/projectService';

function Header({ user, onLogout }) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 2rem',
        borderBottom: '3px solid #0055A4',
        background: '#0055A4',
        position: 'relative',
        zIndex: 2,
        flexWrap: 'wrap',
      }}
    >
      <style>{`
        @media (max-width: 600px) {
          header {
            flex-direction: column !important;
            align-items: flex-start !important;
            padding: 0.5rem 0.5rem !important;
            gap: 0.5rem !important;
          }
          header img {
            height: 36px !important;
          }
          header span {
            font-size: 0.95rem !important;
          }
          header button {
            font-size: 14px !important;
            padding: 7px 12px !important;
          }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link to="/">
          <button style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
            <img src={logo} alt="Logo" style={{ height: 44, background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px #0055A422', padding: 4, maxWidth: 120 }} />
          </button>
        </Link>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '1rem', color: '#fff', fontWeight: 600, textShadow: '0 1px 4px #0055A4', wordBreak: 'break-all' }}>{user?.email}</span>
        <button
          style={{
            background: '#0055A4',
            color: '#fff',
            border: '2px solid #fff',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 15,
            padding: '8px 20px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px #0055A433',
            transition: 'background 0.2s, border 0.2s',
            minWidth: 90,
          }}
          onMouseOver={e => {
            e.currentTarget.style.background = '#EF4135';
            e.currentTarget.style.border = '2px solid #EF4135';
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = '#0055A4';
            e.currentTarget.style.border = '2px solid #fff';
          }}
          onClick={onLogout}
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
  // Obtener la sesión inicial
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setLoading(false);
  });

  // Escuchar cambios en la sesión
  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
    setLoading(false);
  });

  // Sincronizar cuando esté online
  sincronizarPendientes();
  window.addEventListener('online', sincronizarPendientes);

  // Cleanup: eliminar listeners
  return () => {
    listener.subscription.unsubscribe();
    window.removeEventListener('online', sincronizarPendientes);
  };
}, []);


  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  if (loading) return <div>Cargando...</div>

  return (
    <BrowserRouter>
      <div>
        {session ? (
          <>
            <Header user={session.user} onLogout={handleLogout} />
            <Routes>
              <Route path="/" element={<ProjectsPage session={session} />} />
              <Route path="/project/:id" element={<ProjectDetail />} />
              <Route path="/projects/new" element={<NewProject session={session} />} />
            </Routes>
          </>
        ) : (
          <Auth />
        )}
      </div>
    </BrowserRouter>
  )
}

export default App
