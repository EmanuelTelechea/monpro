import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
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
  const PROJECT_KEY = id ? `projectDetail_${id}` : null;
  const TASKS_KEY = id ? `projectTasks_${id}` : null;
  let calendarDates = [];

  // Función para marcar los días con eventos
  function tileContent({ date, view }) {
    if (view === 'month') {
      const found = calendarDates.find(d => d.date.toDateString() === date.toDateString());
      if (found) {
        let color = '#0055A4';
        if (found.type === 'fin') color = '#EF4135';
        if (found.type === 'entrega') color = '#222';
        if (found.type === 'tarea') color = '#009688';
        return <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, margin: '0 auto', marginTop: 2 }} title={found.descripcion || found.type}></div>;
      }
    }
    return null;
  }

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();
        if (error || !data) {
          // Si hay error o no hay datos, intenta cargar de localStorage
          const local = PROJECT_KEY && localStorage.getItem(PROJECT_KEY);
          if (local) {
            setProject(JSON.parse(local));
          } else {
            setError("Error al cargar el proyecto.");
          }
        } else {
          setProject(data);
          PROJECT_KEY && localStorage.setItem(PROJECT_KEY, JSON.stringify(data));
        }
      } catch {
        const local = PROJECT_KEY && localStorage.getItem(PROJECT_KEY);
        if (local) setProject(JSON.parse(local));
        else setError("Error al cargar el proyecto.");
      }
    };

    const fetchTasks = async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('id, estado, fecha')
          .eq('project_id', id);
        if (error || !data) {
          // Si hay error o no hay datos, intenta cargar de localStorage
          const local = TASKS_KEY && localStorage.getItem(TASKS_KEY);
          if (local) setTasks(JSON.parse(local));
        } else {
          setTasks(data);
          TASKS_KEY && localStorage.setItem(TASKS_KEY, JSON.stringify(data));
        }
      } catch {
        const local = TASKS_KEY && localStorage.getItem(TASKS_KEY);
        if (local) setTasks(JSON.parse(local));
      }
    };

    fetchProject();
    fetchTasks();
    // eslint-disable-next-line
  }, [id]);

  // Cuando se actualiza una tarea, refresca la lista y localStorage
  const handleTaskUpdate = () => {
    // fetchTasks está definido dentro de useEffect, así que lo repetimos aquí
    const fetchTasks = async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('id, estado, fecha')
          .eq('project_id', id);
        if (error || !data) {
          const local = TASKS_KEY && localStorage.getItem(TASKS_KEY);
          if (local) setTasks(JSON.parse(local));
        } else {
          setTasks(data);
          TASKS_KEY && localStorage.setItem(TASKS_KEY, JSON.stringify(data));
        }
      } catch {
        const local = TASKS_KEY && localStorage.getItem(TASKS_KEY);
        if (local) setTasks(JSON.parse(local));
      }
    };
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
      .then(({ data }) => {
        setProject(data);
        PROJECT_KEY && localStorage.setItem(PROJECT_KEY, JSON.stringify(data));
      });
  };

  // Eliminar proyecto
  const handleDelete = async () => {
    if (!window.confirm('¿Seguro que deseas eliminar este proyecto? Esta acción no se puede deshacer.')) return;
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    if (!error) {
      // Limpia localStorage y navega fuera
      PROJECT_KEY && localStorage.removeItem(PROJECT_KEY);
      TASKS_KEY && localStorage.removeItem(TASKS_KEY);
      navigate('/');
    } else {
      alert('Error al eliminar el proyecto');
    }
  };

  if (error) return <p style={{ color: 'red', padding: 16 }}>{error}</p>;
  if (!project) return <p style={{ padding: 16 }}>Cargando proyecto...</p>;
  // Si el proyecto está vacío o no tiene datos mínimos
  if (project && Object.keys(project).length === 0) {
    return <p style={{ color: 'red', padding: 16 }}>No se encontraron datos del proyecto.</p>;
  }

  // Reunir todas las fechas relevantes para el calendario (solo si project existe)
  calendarDates = [];
  if (project.fecha_inicio) calendarDates.push({ date: new Date(project.fecha_inicio), type: 'inicio' });
  if (project.fecha_fin) calendarDates.push({ date: new Date(project.fecha_fin), type: 'fin' });
  if (project.entregas && Array.isArray(project.entregas)) {
    project.entregas.forEach((e, i) => {
      if (e.fecha) calendarDates.push({ date: new Date(e.fecha), type: 'entrega', descripcion: e.descripcion });
    });
  }
  // Suponiendo que cada tarea tiene una propiedad 'fecha'
  if (tasks && Array.isArray(tasks)) {
    tasks.forEach((t, i) => {
      if (t.fecha) calendarDates.push({ date: new Date(t.fecha), type: 'tarea', id: t.id });
    });
  }

  if (editing) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 80px)',
          width: '100vw',
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
        <style>{`
          body {
            overflow-x: hidden !important;
          }
          @media (max-width: 900px) {
            .edit-container {
              max-width: 100vw !important;
              margin: 16px 0 !important;
              padding: 1rem !important;
            }
          }
        `}</style>
        <div
          className="edit-container"
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
            project={project}
            onSave={handleSave}
            userId={project.user_id}
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
  }

  // Calcular progreso de tareas
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.estado === 'completada').length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div style={{
      minHeight: 'calc(100vh - 80px)',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(90deg, #0055A4 0%, #fff 60%, #EF4135 100%)',
      width: '100vw',
      boxSizing: 'border-box',
      overflowX: 'hidden',
      flexWrap: 'wrap',
      margin: 0,
      padding: 0,
    }}>
      <style>{`
        body {
          overflow-x: hidden !important;
        }
      `}</style>
      <div style={{
        maxWidth: 1200,
        width: '100%',
        background: 'rgba(255,255,255,0.95)',
        borderRadius: 16,
        boxShadow: '0 2px 24px #0055A455',
        padding: '2rem',
        position: 'relative',
        border: '3px solid #0055A4',
        boxSizing: 'border-box',
        margin: '0 auto',
        overflowX: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 32,
      }}>
        <div style={{ display: 'flex', width: '100%', gap: 32 }}>
          {/* Detalles del proyecto (70%) */}
          <div style={{ flex: '0 1 70%', minWidth: 0 }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginTop: 24, marginBottom: 8, gap: 12 }}>
              <button
                style={{
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
              <button
                style={{
                  background: '#EF4135',
                  color: '#fff',
                  border: '2px solid #EF4135',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 15,
                  padding: '8px 20px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px #EF413522'
                }}
                onClick={handleDelete}
                title="Eliminar proyecto"
              >
                Eliminar
              </button>
            </div>
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
          </div>
          {/* Recursos (30%) */}
        <div style={{ flex: '0 1 30%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
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
          {/* Calendario visual */}
          <div style={{ background: 'rgba(0,85,164,0.04)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
            <b>Calendario:</b>
            <div style={{ marginTop: 8 }}>
              <Calendar
                tileContent={tileContent}
                locale="es-ES"
                showNeighboringMonth={false}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ fontSize: 13, marginTop: 12 }}>
              <div><span style={{ width: 10, height: 10, background: '#0055A4', borderRadius: '50%', display: 'inline-block', marginRight: 6 }} /> Inicio</div>
              <div><span style={{ width: 10, height: 10, background: '#EF4135', borderRadius: '50%', display: 'inline-block', marginRight: 6 }} /> Fin</div>
              <div><span style={{ width: 10, height: 10, background: '#222', borderRadius: '50%', display: 'inline-block', marginRight: 6 }} /> Entrega</div>
              <div><span style={{ width: 10, height: 10, background: '#009688', borderRadius: '50%', display: 'inline-block', marginRight: 6 }} /> Tarea</div>
            </div>
          </div>
        </div>
        </div>
        {/* Barra de progreso de tareas y lista de tareas (100%) */}
        <div style={{ width: '100%' }}>
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
          <TaskList projectId={project.id} onTaskUpdate={handleTaskUpdate} />
        </div>
      </div>
    </div>
  );
}
