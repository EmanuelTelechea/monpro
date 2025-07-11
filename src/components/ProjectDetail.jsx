import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import ProjectForm from './ProjectForm';
import TaskList from './TaskList';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const fetchProject = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        setError("Error al cargar el proyecto.");
      } else {
        setProject(data);
      }
    };

    // Nueva función para traer tareas del proyecto
    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, estado')
        .eq('project_id', id);
      if (!error) setTasks(data);
    };

    fetchProject();
    fetchTasks();
    // eslint-disable-next-line
  }, [id]);

  // Cuando se actualiza una tarea, refresca la lista
  const handleTaskUpdate = () => {
    fetchTasks();
  };

  const handleSave = () => {
    setEditing(false);
    // Refresca los datos después de editar
    supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => setProject(data));
  };

  if (error) return <p style={{ color: 'red', padding: 16 }}>{error}</p>;
  if (!project) return <p style={{ padding: 16 }}>Cargando proyecto...</p>;

  if (editing) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        width: '100%',
        maxWidth: '100vw',
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}>
        <div style={{
          maxWidth: 600,
          width: '100%',
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 2px 12px #0002',
          padding: '2rem',
          margin: '0 8px',
          boxSizing: 'border-box',
        }}>
          <ProjectForm project={project} onSave={handleSave} userId={project.user_id} />
          <button
            style={{
              marginTop: 24,
              background: '#eee',
              color: '#333',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 16,
              padding: '10px 24px',
              cursor: 'pointer',
              width: '100%',
              maxWidth: 300,
              marginLeft: 'auto',
              marginRight: 'auto',
              display: 'block',
            }}
            onClick={() => setEditing(false)}
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  // Calcular progreso de tareas
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.estado === 'completada').length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div style={{
      minHeight: 'calc(100vh - 80px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(90deg, #0055A4 0%, #fff 60%, #EF4135 100%)',
      width: '100%',
      maxWidth: '100vw',
      boxSizing: 'border-box',
      overflowX: 'hidden',
    }}>
      <div style={{
        maxWidth: '100%',
        width: '100%',
        background: 'rgba(255,255,255,0.95)',
        borderRadius: 16,
        boxShadow: '0 2px 24px #0055A455',
        padding: '2rem',
        margin: 0,
        position: 'relative',
        border: '3px solid #0055A4'
      }}>
        <button
          style={{
            position: 'absolute',
            top: 24,
            right: 32,
            background: '#0055A4',
            color: '#fff',
            border: '2px solid #0055A4',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 15,
            padding: '8px 20px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px #0055A433'
          }}
          onClick={() => setEditing(true)}
        >
          Editar
        </button>
        <h1 style={{ fontSize: 32, marginBottom: 8, textAlign: 'center', color: '#0055A4', letterSpacing: 1 }}>{project.nombre}</h1>
        <p style={{ color: '#222', marginBottom: 24, textAlign: 'center', background: 'rgba(0,85,164,0.07)', borderRadius: 8, padding: 8 }}>{project.descripcion}</p>
        <div style={{ marginBottom: 16, textAlign: 'center', color: '#0055A4', fontWeight: 600 }}>
          <b>Fecha de inicio:</b> {project.fecha_inicio || '-'}<br />
          <b>Fecha de fin:</b> {project.fecha_fin || '-'}
        </div>
        <div style={{ marginBottom: 16, background: 'rgba(0,85,164,0.04)', borderRadius: 8, padding: 8 }}>
          <b>Explicación:</b>
          <div style={{ marginTop: 4 }}>{project.explicacion || <span style={{ color: '#aaa' }}>Sin explicación</span>}</div>
        </div>
        <div style={{ marginBottom: 16, background: 'rgba(0,85,164,0.04)', borderRadius: 8, padding: 8 }}>
          <b>Funcionalidades:</b>
          <ul>
            {(project.funcionalidades && project.funcionalidades.length > 0)
              ? project.funcionalidades.map((f, i) => <li key={i}>{f}</li>)
              : <li style={{ color: '#aaa' }}>Sin funcionalidades</li>}
          </ul>
        </div>
        <div style={{ marginBottom: 16, background: 'rgba(0,85,164,0.04)', borderRadius: 8, padding: 8 }}>
          <b>Características:</b>
          <ul>
            {(project.caracteristicas && project.caracteristicas.length > 0)
              ? project.caracteristicas.map((c, i) => <li key={i}>{c}</li>)
              : <li style={{ color: '#aaa' }}>Sin características</li>}
          </ul>
        </div>
        <div style={{ marginBottom: 16, background: 'rgba(0,85,164,0.04)', borderRadius: 8, padding: 8 }}>
          <b>Tecnologías:</b>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            {(project.tecnologias && project.tecnologias.length > 0)
              ? project.tecnologias.map((t, i) => (
                  <span key={i} style={{
                    background: '#f3f4f6',
                    borderRadius: 8,
                    padding: '2px 12px',
                    fontSize: 13,
                    color: '#222'
                  }}>{t}</span>
                ))
              : <span style={{ color: '#aaa' }}>Sin tecnologías</span>}
          </div>
        </div>
        <div style={{ marginBottom: 16, background: 'rgba(0,85,164,0.04)', borderRadius: 8, padding: 8 }}>
          <b>Identidad Visual:</b>
          <div>
            <b>Colores:</b> {(project.identidad_colores && project.identidad_colores.length > 0)
              ? (
                  <span style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                    {project.identidad_colores.map((color, i) => (
                      <span key={i} title={color} style={{
                        display: 'inline-block',
                        width: 44,
                        height: 44,
                        borderRadius: 8,
                        background: color,
                        border: '2px solid #ccc',
                        boxShadow: '0 1px 6px #0002',
                        verticalAlign: 'middle'
                      }} />
                    ))}
                  </span>
                )
              : <span style={{ color: '#aaa' }}>Sin colores</span>}
          </div>
          <div>
            <b>Tipografía:</b> {project.identidad_tipografia || <span style={{ color: '#aaa' }}>Sin tipografía</span>}
          </div>
          <div>
            <b>Logo:</b> {project.identidad_logo
              ? <a href={project.identidad_logo} target="_blank" rel="noopener noreferrer">
                  <img src={project.identidad_logo} alt="Logo" style={{ height: 60, verticalAlign: 'middle', marginLeft: 8, borderRadius: 8, boxShadow: '0 1px 6px #0002' }} />
                </a>
              : <span style={{ color: '#aaa' }}>Sin logo</span>}
          </div>
        </div>
        <div style={{ marginBottom: 16, background: 'rgba(0,85,164,0.04)', borderRadius: 8, padding: 8 }}>
          <b>Recursos:</b>
          <ul>
            {project.github && (
              <li>
                <a href={project.github} target="_blank" rel="noopener noreferrer">
                  <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub" style={{ height: 32, verticalAlign: 'middle', marginRight: 8 }} />
                  GitHub
                </a>
              </li>
            )}
            {project.gitlab && (
              <li>
                <a href={project.gitlab} target="_blank" rel="noopener noreferrer">
                  <img src="https://about.gitlab.com/images/press/logo/png/gitlab-icon-rgb.png" alt="GitLab" style={{ height: 32, verticalAlign: 'middle', marginRight: 8 }} />
                  GitLab
                </a>
              </li>
            )}
            {project.figma && (
              <li>
                <a href={project.figma} target="_blank" rel="noopener noreferrer">
                  <img src="https://static.figma.com/app/icon/1/favicon.png" alt="Figma" style={{ height: 32, verticalAlign: 'middle', marginRight: 8 }} />
                  Figma
                </a>
              </li>
            )}
            {!project.github && !project.gitlab && !project.figma && <li style={{ color: '#aaa' }}>Sin recursos</li>}
          </ul>
        </div>
        <div style={{ marginBottom: 16, background: 'rgba(0,85,164,0.04)', borderRadius: 8, padding: 8 }}>
          <b>Wireframes:</b>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, padding: 0 }}>
            {(project.wireframes && project.wireframes.length > 0)
              ? project.wireframes.map((w, i) => (
                  <a key={i} href={w} target="_blank" rel="noopener noreferrer">
                    <img src={w} alt={`Wireframe ${i + 1}`} style={{ maxHeight: 120, maxWidth: 180, borderRadius: 8, boxShadow: '0 1px 6px #0002', display: 'block', marginBottom: 4 }} />
                  </a>
                ))
              : <span style={{ color: '#aaa' }}>Sin wireframes</span>}
          </div>
        </div>
        <div style={{ marginBottom: 16, background: 'rgba(0,85,164,0.04)', borderRadius: 8, padding: 8 }}>
          <b>Diagramas:</b>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, padding: 0 }}>
            {(project.diagramas && project.diagramas.length > 0)
              ? project.diagramas.map((d, i) => (
                  <a key={i} href={d} target="_blank" rel="noopener noreferrer">
                    <img src={d} alt={`Diagrama ${i + 1}`} style={{ maxHeight: 120, maxWidth: 180, borderRadius: 8, boxShadow: '0 1px 6px #0002', display: 'block', marginBottom: 4 }} />
                  </a>
                ))
              : <span style={{ color: '#aaa' }}>Sin diagramas</span>}
          </div>
        </div>
        {/* Barra de progreso de tareas */}
        <div style={{ margin: '16px 0 24px 0' }}>
          <div style={{
            background: '#0055A4',
            borderRadius: 6,
            height: 12,
            width: '100%',
            overflow: 'hidden',
            border: '1.5px solid #0055A4',
            boxShadow: '0 1px 6px #0055A422'
          }}>
            <div style={{
              width: `${progress}%`,
              background: '#fff',
              height: '100%',
              transition: 'width 0.3s',
              borderRight: progress > 0 ? '3px solid #EF4135' : 'none'
            }} />
          </div>
          <div style={{ fontSize: 13, color: '#0055A4', marginTop: 4, fontWeight: 600 }}>
            {totalTasks > 0
              ? `${completedTasks} de ${totalTasks} tareas completadas (${progress}%)`
              : 'Sin tareas'}
          </div>
        </div>
        {/* Tareas del proyecto */}
        <TaskList projectId={project.id} onTaskUpdate={handleTaskUpdate} />
      </div>
    </div>
  );
}
