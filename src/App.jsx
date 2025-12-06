import { useEffect, useState } from 'react'
import { supabase } from './supabase/client'
import Auth from './components/Auth'
import ProjectsPage from './components/ProjectsPage'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import ProjectDetail from './components/ProjectDetail'
import NewProject from './components/NewProject'
import logo from './assets/Logo.PNG'
import { sincronizarPendientes } from './services/projectService';
import { LogOut, User } from 'lucide-react'

// Definimos los colores aquí para consistencia
const COLORS = {
  headerBg: '#FFFFFF',
  textDark: '#0F172A',     // Slate 900
  textGray: '#64748B',     // Slate 500
  accentBlue: '#0055A4',   // Azul Francia (Libertad/Estructura)
  accentRed: '#EF4135',    // Rojo Marianne (Fraternidad/Acción)
  accentWhite: '#F8FAFC',  // Fondo gris muy claro (Igualdad/Espacio)
  border: '#E2E8F0',
  bgHover: '#F8FAFC'
}

function Header({ user, onLogout }) {
  // Estilo principal del Header
  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    height: '70px',
    background: COLORS.headerBg,
    zIndex: 50,
    position: 'relative',
    // Borde inferior sutil
    borderBottom: `1px solid ${COLORS.border}`,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
  };

  // Estilo del botón de Logout (Rojo elegante)
  const logoutButtonStyle = {
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px',
    background: 'transparent', 
    border: `1px solid ${COLORS.border}`,
    color: COLORS.textDark, 
    borderRadius: '6px', 
    padding: '8px 16px',
    fontWeight: 500, 
    fontSize: '14px', 
    cursor: 'pointer', 
    transition: 'all 0.2s',
  };

  // Estilos responsivos y de hover inyectados (necesario para inline styles)
  return (
    <header style={headerStyle}>
      <style>{`
        /* Efecto Tricolor en el Borde Inferior */
        header::after {
          content: '';
          position: absolute;
          bottom: -2px; /* Superpuesto ligeramente para que se vea como un detalle */
          left: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, 
            ${COLORS.accentBlue} 0%, 
            ${COLORS.accentBlue} 33%, 
            ${COLORS.headerBg} 33%, 
            ${COLORS.headerBg} 66%, 
            ${COLORS.accentRed} 66%, 
            ${COLORS.accentRed} 100%
          );
        }
        
        .header-btn-logout:hover {
          border-color: ${COLORS.accentRed} !important; 
          color: ${COLORS.accentRed} !important; 
          background: #FEF2F2 !important; 
        }

        @media (max-width: 600px) {
          header { padding: 0 12px !important; }
          .user-email { display: none !important; }
        }
      `}</style>

      {/* Logo Area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img 
            src={logo} 
            alt="Logo" 
            style={{ 
              height: 40, 
              objectFit: 'contain',
              padding: 2,
              border: `1px solid ${COLORS.accentBlue}` // Pequeño marco azul
            }} 
          />
          <div style={{ width: 1, height: 24, background: COLORS.border, margin: '0 12px' }}></div>
          <span style={{ fontWeight: 800, fontSize: '18px', color: COLORS.accentBlue, letterSpacing: '0.5px' }}>
            PROJECTS
          </span>
        </Link>
      </div>

      {/* User & Actions Area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        
        {/* Info Usuario */}
        <div 
          className="user-email"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            fontSize: '14px', 
            color: COLORS.textDark, 
            fontWeight: 500,
            background: COLORS.bgHover,
            padding: '6px 12px',
            borderRadius: '20px'
          }}
        >
          <User size={16} color={COLORS.textGray} />
          {user?.email}
        </div>

        {/* Botón Logout (con handlers para hover) */}
        <button
          className="header-btn-logout"
          onClick={onLogout}
          title="Cerrar sesión"
          style={logoutButtonStyle}
          onMouseOver={e => {
            e.currentTarget.style.borderColor = COLORS.accentRed;
            e.currentTarget.style.color = COLORS.accentRed;
            e.currentTarget.style.backgroundColor = '#FEF2F2';
          }}
          onMouseOut={e => {
            e.currentTarget.style.borderColor = COLORS.border;
            e.currentTarget.style.color = COLORS.textDark;
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <span>Cerrar sesión</span> {/* Usamos un toque de francés para el texto */}
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    sincronizarPendientes();
    window.addEventListener('online', sincronizarPendientes);

    return () => {
      listener.subscription.unsubscribe();
      window.removeEventListener('online', sincronizarPendientes);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', color: COLORS.textGray }}>
      Cargando...
    </div>
  )

  return (
    <BrowserRouter>
      {/* Contenedor Principal: Flex Column para el layout */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh', 
        overflow: 'hidden',
        background: COLORS.accentWhite,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
      }}>
        
        {session ? (
          <>
            <Header user={session.user} onLogout={handleLogout} />
            
            {/* Área de Contenido (Ocupa el resto del espacio vertical) */}
            <div style={{ 
              flex: 1, 
              overflow: 'hidden', 
              position: 'relative',
              display: 'flex',
              flexDirection: 'column' 
            }}>
              <Routes>
                <Route path="/" element={<ProjectsPage session={session} />} />
                <Route path="/project/:id" element={<ProjectDetail />} />
                <Route path="/projects/new" element={<NewProject session={session} />} />
              </Routes>
            </div>
          </>
        ) : (
          <Auth />
        )}
      </div>
    </BrowserRouter>
  )
}

export default App