import { useState, useEffect } from 'react'
import { supabase } from '../supabase/client'
import ProjectCard from './ProjectCard'
import ProjectForm from './ProjectForm'
import { useNavigate } from 'react-router-dom'

export default function ProjectsPage({ session }) {
  const [projects, setProjects] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editProject, setEditProject] = useState(null)
  const [tasksByProject, setTasksByProject] = useState({})
  const [filter, setFilter] = useState('todos')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const navigate = useNavigate()

  const LOCAL_STORAGE_KEY = `projects_${session.user.id}`

  const fetchProjects = async () => {
    // Consulta Supabase
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (!error) {
      setProjects(data)
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data)) // Guarda en localStorage
    }
  }

  const loadProjectsFromLocalStorage = () => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setProjects(parsed)
      } catch (e) {
        console.warn('No se pudieron cargar proyectos desde localStorage')
      }
    }
  }

  const fetchTasksByProject = async (projectIds) => {
    if (!projectIds.length) return
    const { data, error } = await supabase
      .from('tasks')
      .select('id, project_id, estado')

    if (!error) {
      const grouped = {}
      projectIds.forEach(pid => grouped[pid] = [])
      data.forEach(task => {
        if (grouped[task.project_id]) grouped[task.project_id].push(task)
      })
      setTasksByProject(grouped)
    }
  }

  const handleCreate = () => {
    navigate('/projects/new')
  }

  const handleEdit = (project) => {
    setEditProject(project)
    setShowForm(true)
  }

  const handleSave = () => {
    setShowForm(false)
    setEditProject(null)
    fetchProjects() // Refresca y actualiza localStorage
  }

  // Eliminar proyecto
  const handleDelete = async (projectId) => {
    if (!window.confirm('¿Seguro que deseas eliminar este proyecto? Esta acción no se puede deshacer.')) return;
    // Elimina en Supabase
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', session.user.id)
    if (!error) {
      // Actualiza estado y localStorage
      const updated = projects.filter(p => p.id !== projectId)
      setProjects(updated)
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
    } else {
      alert('Error al eliminar el proyecto')
    }
  }

  useEffect(() => {
    loadProjectsFromLocalStorage()
    fetchProjects()
  }, [])

  useEffect(() => {
    if (projects.length > 0) {
      const ids = projects.map(p => p.id)
      fetchTasksByProject(ids)
    }
  }, [projects])

  // Estadísticas y lógica de estado por tareas
  const getProjectStatus = (project) => {
    const tasks = tasksByProject[project.id] || [];
    if (tasks.length === 0) return 'pendiente';
    const completadas = tasks.filter(t => t.estado === 'completada').length;
    if (completadas === 0) return 'pendiente';
    if (completadas === tasks.length) return 'completado';
    return 'activo';
  };

  // Estadísticas simples
  const total = projects.length;
  const completados = projects.filter(p => getProjectStatus(p) === 'completado').length;
  const activos = projects.filter(p => getProjectStatus(p) === 'activo').length;
  const pendientes = projects.filter(p => getProjectStatus(p) === 'pendiente').length;

  // Filtro de proyectos
  let filteredProjects = projects;
  if (filter === 'activos') filteredProjects = projects.filter(p => getProjectStatus(p) === 'activo');
  if (filter === 'completados') filteredProjects = projects.filter(p => getProjectStatus(p) === 'completado');
  if (filter === 'pendiente') filteredProjects = projects.filter(p => getProjectStatus(p) === 'pendiente');

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      minHeight: 'calc(100vh - 80px)',
      background: '#f5f7fa',
      width: '100vw',
      boxSizing: 'border-box',
      overflowX: 'hidden',
      margin: 0,
      padding: 0,
    }}>
      <style>{`
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          overflow-x: hidden !important;
          background: #f5f7fa !important;
        }
        @media (max-width: 900px) {
          aside {
            width: 100vw !important;
            min-width: 0 !important;
            border-right: none !important;
            border-top: 4px solid #EF4135 !important;
            box-shadow: none !important;
            padding: 24px 8px 8px 8px !important;
          }
          main {
            padding: 24px 8px !important;
          }
        }
      `}</style>
      {/* Sidebar */}
      <aside style={{
        width: 320,
        minWidth: 260,
        background: 'linear-gradient(135deg, #f7fafd 0%, #e6f0fa 60%, #dbeafe 100%)',
        backgroundClip: 'padding-box',
        overflow: 'hidden',
        borderRight: '4px solid #0055A4',
        padding: '32px 16px 16px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        boxShadow: '0 2px 12px #0055A422',
        position: 'relative',
        flex: '1 1 320px',
        maxWidth: '100vw',
      }}>
        <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 0, color: '#0055A4', letterSpacing: 0.5, position: 'relative', userSelect: 'none' }}>
          <div style={{
            background: 'linear-gradient(90deg, #0055A4 0%, #EF4135 100%)',
            color: '#fff',
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            borderTopRightRadius: 16,
            borderBottomRightRadius: 16,
            padding: '10px 18px',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 6px #0055A422',
            width: '95%',
            marginLeft: '-15px',
            marginRight: 'auto',
          }}>
            <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: 0.5 }}>Mis Proyectos</span>
            <span
              style={{ color: '#fff', cursor: 'pointer', padding: '2px 8px', borderRadius: 6, background: dropdownOpen ? '#EF4135' : 'rgba(255,255,255,0.12)', transition: 'background 0.2s' }}
              onClick={() => setDropdownOpen(v => !v)}
              tabIndex={0}
              onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
            >
              ⏷
              {dropdownOpen && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: 40,
                  background: '#fff',
                  border: '1.5px solid #0055A4',
                  borderRadius: 8,
                  boxShadow: '0 2px 8px #0055A422',
                  zIndex: 10,
                  minWidth: 140,
                  fontSize: 15,
                  fontWeight: 500,
                  color: '#0055A4',
                  padding: 0,
                }}>
                  <div
                    style={{ padding: '10px 18px', cursor: 'pointer', background: filter === 'todos' ? '#e6f0fa' : 'transparent', borderRadius: 8 }}
                    onClick={() => { setFilter('todos'); setDropdownOpen(false); }}
                  >Todos</div>
                  <div
                    style={{ padding: '10px 18px', cursor: 'pointer', background: filter === 'pendiente' ? '#e6f0fa' : 'transparent', borderRadius: 8 }}
                    onClick={() => { setFilter('pendiente'); setDropdownOpen(false); }}
                  >Pendiente</div>
                  <div
                    style={{ padding: '10px 18px', cursor: 'pointer', background: filter === 'activos' ? '#e6f0fa' : 'transparent', borderRadius: 8 }}
                    onClick={() => { setFilter('activos'); setDropdownOpen(false); }}
                  >Activos</div>
                  <div
                    style={{ padding: '10px 18px', cursor: 'pointer', background: filter === 'completados' ? '#e6f0fa' : 'transparent', borderRadius: 8 }}
                    onClick={() => { setFilter('completados'); setDropdownOpen(false); }}
                  >Completados</div>
                </div>
              )}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredProjects.map(project => {
            const tasks = tasksByProject[project.id] || [];
            const totalT = tasks.length;
            const completadas = tasks.filter(t => t.estado === 'completada').length;
            const progreso = totalT > 0 ? Math.round((completadas / totalT) * 100) : 0;
            const status = getProjectStatus(project);
            let statusColor = '#0055A4';
            if (status === 'completado') statusColor = '#22c55e';
            if (status === 'activo') statusColor = '#EF4135';
            if (status === 'pendiente') statusColor = '#0055A4';
            let statusText = '';
            if (status === 'completado') statusText = 'Completado';
            if (status === 'activo') statusText = 'Activo';
            if (status === 'pendiente') statusText = 'Pendiente';
            return (
              <div
                key={project.id}
                style={{
                  background: '#f7f8fa',
                  borderRadius: 12,
                  padding: '16px 14px',
                  marginBottom: 0,
                  boxShadow: '0 1px 2px #0001',
                  cursor: 'pointer',
                  border: '1px solid #f0f0f0',
                  position: 'relative'
                }}
                onClick={() => navigate(`/project/${project.id}`)}
              >
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8, color: '#0055A4' }}>
                  {project.nombre}
                  <span style={{
                    fontSize: 12,
                    background: statusColor,
                    borderRadius: 8,
                    padding: '2px 10px',
                    marginLeft: 8,
                    color: '#fff',
                    fontWeight: 600
                  }}>{statusText}</span>
                </div>
                <div style={{ color: '#888', fontSize: 14, marginBottom: 4 }}>{project.descripcion}</div>
                {/* Barra de progreso de tareas */}
                <div style={{ margin: '8px 0 4px 0' }}>
                  <div style={{
                    background: '#e5e7eb',
                    borderRadius: 6,
                    height: 8,
                    width: '100%',
                    overflow: 'hidden',
                    border: '1.5px solid #0055A4',
                  }}>
                    <div style={{
                      width: `${progreso}%`,
                      background: `linear-gradient(90deg, #0055A4 0%, #EF4135 100%)`,
                      height: '100%',
                      transition: 'width 0.3s',
                    }} />
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                    {totalT > 0
                      ? `${completadas} de ${totalT} tareas completadas (${progreso}%)`
                      : 'Sin tareas'}
                  </div>
                </div>
                <div style={{ color: '#aaa', fontSize: 13 }}>
                  {status === 'completado'
                    ? `Completado el ${project.fecha_fin || '-'}`
                    : `Actualizado hace 1 día`}
                  <span style={{ float: 'right' }}>
                    {project.progreso ? `${project.progreso}% completo` : ''}
                  </span>
                </div>
                {/* Botón eliminar */}
                <button
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: '#EF4135',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    fontWeight: 600,
                    fontSize: 13,
                    padding: '2px 10px',
                    cursor: 'pointer',
                    boxShadow: '0 1px 4px #EF413522',
                  }}
                  title="Eliminar proyecto"
                  onClick={e => {
                    e.stopPropagation();
                    handleDelete(project.id);
                  }}
                >
                  Eliminar
                </button>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 32, fontSize: 15, color: '#888', borderTop: '2px solid #EF4135', paddingTop: 16 }}>
          <div style={{ marginBottom: 4 }}>Total de proyectos <span style={{ float: 'right', color: '#222' }}>{total}</span></div>
          <div style={{ marginBottom: 4 }}>Pendientes <span style={{ float: 'right', color: '#222' }}>{pendientes}</span></div>
          <div style={{ marginBottom: 4 }}>Activos <span style={{ float: 'right', color: '#222' }}>{activos}</span></div>
          <div>Completados <span style={{ float: 'right', color: '#222' }}>{completados}</span></div>
        </div>
      </aside>
      {/* Main Content */}
      <main style={{
        flex: '2 1 600px',
        padding: '48px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'rgba(255,255,255,0.85)',
        minWidth: 0,
        maxWidth: '100vw',
        boxSizing: 'border-box',
      }}>
        <style>{`
          @media (max-width: 900px) {
            aside {
              width: 100vw !important;
              min-width: 0 !important;
              border-right: none !important;
              border-top: 4px solid #EF4135 !important;
              box-shadow: none !important;
              padding: 24px 8px 8px 8px !important;
            }
            main {
              padding: 24px 8px !important;
            }
          }
        `}</style>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: 32
        }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <button
              onClick={handleCreate}
              style={{
                width: 80,
                aspectRatio: '1 / 1',
                borderRadius: '50%',
                background: '#0055A4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 44,
                color: '#fff',
                boxShadow: '0 2px 8px #0055A422',
                border: '4px solid #fff',
                cursor: 'pointer',
                transition: 'background 0.2s, border 0.2s',
                outline: 'none',
                padding: 0,
              }}
              title="Crear nuevo proyecto"
              onMouseOver={e => { e.currentTarget.style.background = '#EF4135'; e.currentTarget.style.border = '4px solid #EF4135'; }}
              onMouseOut={e => { e.currentTarget.style.background = '#0055A4'; e.currentTarget.style.border = '4px solid #fff'; }}
            >
              <span style={{fontSize: 44, fontWeight: 700, lineHeight: 1, display: 'block', marginTop: 0}}>+</span>
            </button>
          </div>
          <div style={{ fontWeight: 600, fontSize: 24, marginBottom: 8 }}>Crear Nuevo Proyecto</div>
          <div style={{ color: '#888', fontSize: 16, marginBottom: 24, textAlign: 'center' }}>
            Comienza un nuevo proyecto y organiza tu trabajo de manera eficiente
          </div>
          <button
            style={{
              background: '#EF4135',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 16,
              padding: '12px 32px',
              marginBottom: 24,
              cursor: 'pointer',
              boxShadow: '0 2px 8px #0055A422',
              transition: 'background 0.2s',
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = '#0055A4';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = '#EF4135';
            }}
            onClick={handleCreate}
          >
            + Crear Proyecto
          </button>
        </div>
        <div style={{
          display: 'flex',
          gap: 32,
          width: '100%',
          justifyContent: 'center',
          marginBottom: 32
        }}>
          <div style={{
          }}>
          </div>
          <div style={{
            background: '#fff',
            border: '2px solid #EF4135',
            borderRadius: 12,
            padding: 32,
            minWidth: 260,
            maxWidth: 320,
            textAlign: 'center',
            boxShadow: '0 1px 4px #EF413522',
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#EF4135',
              margin: '0 auto 12px auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              color: '#fff',
              boxShadow: '0 1px 4px #EF413522',
            }}>⭳</div>
            <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 4 }}>Importar Proyecto</div>
            <div style={{ color: '#888', fontSize: 14, marginBottom: 12 }}>Importa un proyecto existente desde Git o archivo</div>
            <a href="#" style={{ color: '#222', fontWeight: 500, fontSize: 14, textDecoration: 'none' }}>Importar &rarr;</a>
          </div>
        </div>
      </main>
    </div>
  )
}
