import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectForm from './ProjectForm';

const NewProject = ({ session }) => {
  const navigate = useNavigate();

  const handleSave = () => {
    navigate('/');
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
        maxWidth: '100vw',
        boxSizing: 'border-box',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(90deg, #0055A4 0%, #fff 50%, #EF4135 100%)',
        padding: 0,
        margin: 0,
      }}
    >
      <div
        style={{
          maxWidth: 600,
          width: '100%',
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 2px 12px #0002',
          padding: '2rem',
          margin: '32px 8px',
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
