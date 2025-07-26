import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectForm from './ProjectForm';
import { guardarProyectoOffline, sincronizarPendientes } from '../services/projectService';

const NewProject = ({ session }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Intenta sincronizar al volver a estar online
    window.addEventListener('online', sincronizarPendientes);
    return () => {
      window.removeEventListener('online', sincronizarPendientes);
    };
  }, []);

  const handleSave = async (data) => {
    try {
      if (navigator.onLine) {
        // Si hay conexión, se guarda normalmente desde ProjectForm
        // Ahora espera que ProjectForm llame a onSave con el proyecto creado (incluyendo id)
        if (data && data.id) {
          navigate(`/project/${data.id}`);
        }
        // Si no hay id, no navega (asegúrate de que ProjectForm lo envía)
        return;
      } else {
        // Guardar offline
        await guardarProyectoOffline(data);
        alert('Proyecto guardado localmente. Se sincronizará cuando tengas conexión.');
        navigate('/');
      }
    } catch (error) {
      console.error('Error al guardar el proyecto offline:', error);
      alert('Hubo un problema al guardar el proyecto.');
    }
  };

  if (!session?.user?.id) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'red' }}>
        No hay usuario autenticado. Por favor inicia sesión.
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 80px)',
        width: '100vw',
        boxSizing: 'border-box',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(90deg, #0055A4 0%, #fff 50%, #EF4135 100%)',
        padding: 0,
        margin: 0,
      }}
    >
      <style>{`
        body {
          overflow-x: hidden !important;
        }
        @media (max-width: 900px) {
          .new-container {
            max-width: 100vw !important;
            margin: 16px 0 !important;
            padding: 1rem !important;
          }
        }
      `}</style>
      <div
        className="new-container"
        style={{
          maxWidth: 600,
          width: '100%',
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 2px 12px #0002',
          padding: '2rem',
          margin: '32px auto',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <ProjectForm
          project={null}
          onSave={handleSave}
          userId={session.user.id}
        />
        <button
          style={{
            marginTop: 24,
            background: '#0055A4',
            color: '#fff',
            border: '2px solid #EF4135',
            borderRadius: '50px',
            fontWeight: 600,
            fontSize: 16,
            padding: '10px 32px',
            cursor: 'pointer',
            width: 'fit-content',
            minWidth: 120,
            marginLeft: 'auto',
            marginRight: 'auto',
            display: 'block',
            transition: 'background 0.2s, color 0.2s',
          }}
          onMouseOver={e => {
            e.target.style.background = '#EF4135';
            e.target.style.color = '#fff';
          }}
          onMouseOut={e => {
            e.target.style.background = '#0055A4';
            e.target.style.color = '#fff';
          }}
          onClick={() => navigate(-1)}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default NewProject;
