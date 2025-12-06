import { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import { Plus, X, Save, Clock, Menu, Zap, CheckCircle, GitBranch, Star, Eye, Bug, Loader2 } from 'lucide-react';

export default function TaskList({ projectId, onTaskUpdate, githubUrl }) {
  const [tasks, setTasks] = useState([]);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingGithub, setLoadingGithub] = useState(false);
  const [githubStats, setGithubStats] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // --- PALETA DE COLORES ---
  const COLORS = {
    primary: '#1E40AF', 
    accent: '#DC2626', 
    success: '#10B981', 
    bgLight: '#F3F4F6', 
    bgCard: '#FFFFFF',  
    border: '#D1D5DB', 
    textMain: '#1F2937', 
    textSub: '#6B7280', 
    pendingBg: '#FEF3C7', 
    progressBg: '#FEE2E2', 
    completeBg: '#D1FAE5', 
  };

  // --- Tareas ---
  const fetchTasks = async () => {
    setLoadingTasks(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (!error) setTasks(data);
    setLoadingTasks(false);
  };

  // --- GitHub: FUNCIÓN PARA CARGAR ESTADÍSTICAS (sin cambios) ---
  const fetchGithubStats = async () => {
    if (!githubUrl) {
      setGithubStats(null);
      return;
    }
    
    try {
        setLoadingGithub(true);
        const urlParts = new URL(githubUrl);
        const pathParts = urlParts.pathname.split('/').filter(p => p.length > 0);
        
        if (pathParts.length < 2) {
            setGithubStats({ error: "URL de GitHub inválida." });
            setLoadingGithub(false);
            return;
        }

        const [owner, repo] = pathParts;
        
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`Error al cargar repo: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        setGithubStats({
            stars: data.stargazers_count,
            forks: data.forks_count,
            watchers: data.subscribers_count,
            issues: data.open_issues_count,
        });

    } catch (error) {
        console.error("Error fetching GitHub stats:", error);
        setGithubStats({ error: error.message || "Error al conectar con GitHub." });
    } finally {
        setLoadingGithub(false);
    }
  };

  // --- useEffects ---
  useEffect(() => {
    if (projectId) fetchTasks();
    // eslint-disable-next-line
  }, [projectId]);

  useEffect(() => {
    fetchGithubStats();
    // eslint-disable-next-line
  }, [githubUrl]);


  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!titulo) return;
    await supabase.from('tasks').insert([
      { project_id: projectId, titulo, descripcion, fecha_limite: fechaLimite || null }
    ]);
    setTitulo('');
    setDescripcion('');
    setFechaLimite('');
    setShowForm(false);
    fetchTasks();
    onTaskUpdate?.();
  };

  const handleChangeEstado = async (taskId, newEstado) => {
    await supabase.from('tasks').update({ estado: newEstado }).eq('id', taskId);
    fetchTasks();
    onTaskUpdate?.();
  };

  const pendientes = tasks.filter(t => (t.estado || 'pendiente') === 'pendiente');
  const enProgreso = tasks.filter(t => t.estado === 'en progreso');
  const completadas = tasks.filter(t => t.estado === 'completada');

  // --- COMPONENTE DE TAREA INDIVIDUAL (Card) (sin cambios) ---
  const TaskCard = ({ task, color, bg, borderColor, icon: Icon }) => (
    <li
      key={task.id}
      style={{
        marginBottom: 12,
        background: COLORS.bgCard,
        borderRadius: 8,
        padding: 12,
        borderLeft: `4px solid ${color}`,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        fontSize: 14,
        position: 'relative',
        transition: 'all 0.2s',
      }}
      onMouseOver={e => { e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)'; }}
      onMouseOut={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Icon size={16} color={color} />
        <span style={{ color: COLORS.textMain, fontWeight: 600 }}>{task.titulo}</span>
      </div>
      
      {task.descripcion && (
        <p style={{ color: COLORS.textSub, fontSize: 13, margin: '4px 0 8px 0' }}>
          {task.descripcion}
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {task.fecha_limite && (
          <span style={{ 
            fontSize: 12, 
            color: COLORS.textSub,
            display: 'flex', 
            alignItems: 'center', 
            gap: 4 
          }}>
            <Clock size={12} color={COLORS.textSub} />
            {new Date(task.fecha_limite).toLocaleDateString()}
          </span>
        )}

        <select
          value={task.estado || 'pendiente'}
          onChange={e => handleChangeEstado(task.id, e.target.value)}
          style={{ 
            border: `1px solid ${borderColor}`, 
            borderRadius: 6, 
            padding: '4px 8px',
            fontSize: 13,
            backgroundColor: bg,
            color: color,
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          <option value="pendiente">Pendiente</option>
          <option value="en progreso">En Progreso</option>
          <option value="completada">Completada</option>
        </select>
      </div>
    </li>
  );

  // --- Contenido Principal ---
  return (
    <div
      style={{
        marginTop: 32,
        display: 'flex',
        flexWrap: 'wrap', // Permite que el panel de GitHub se envuelva
        gap: 24,
        background: COLORS.bgLight,
        borderRadius: 16,
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
        padding: 32,
        width: '100%',
        boxSizing: 'border-box',
        overflowX: 'auto', // Permite desplazamiento horizontal si es necesario
      }}
    >
      {/* Task Board Container */}
      <div style={{ 
          // CAMBIO CLAVE: Fija el ancho mínimo para forzar las tres columnas
          flex: '1 0 auto', 
          minWidth: '950px', // Mínimo para que 3 columnas de 280px más el gap quepan
      }}>
        <h3 style={{ color: COLORS.textMain, fontWeight: 700, fontSize: 24, marginBottom: 16 }}>
            Tablero de Tareas
        </h3>
        
        {/* Botón y Formulario de Tarea (sin cambios) */}
        <button
          style={{
            marginBottom: 16,
            background: showForm ? COLORS.accent : COLORS.primary,
            color: COLORS.bgCard,
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 15,
            padding: '10px 24px',
            cursor: 'pointer',
            boxShadow: `0 4px 10px ${showForm ? COLORS.accent : COLORS.primary}22`,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
          onClick={() => setShowForm(v => !v)}
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Cerrar Formulario' : 'Nueva Tarea'}
        </button>
        
        {showForm && (
          <form onSubmit={handleAddTask} style={{ 
            marginBottom: 24, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 12,
            background: COLORS.bgCard,
            padding: 16,
            borderRadius: 10,
            border: `1px solid ${COLORS.border}`,
          }}>
            <input
              placeholder="Título de la tarea (Requerido)"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              required
              style={{ 
                border: `1px solid ${COLORS.border}`, 
                borderRadius: 6, 
                padding: 10, 
                fontSize: 15, 
                color: COLORS.textMain 
              }}
            />
            <textarea
              placeholder="Descripción (Opcional)"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              rows={2}
              style={{ 
                border: `1px solid ${COLORS.border}`, 
                borderRadius: 6, 
                padding: 10, 
                fontSize: 15, 
                color: COLORS.textMain, 
                resize: 'vertical' 
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <input
                    type="date"
                    title="Fecha límite"
                    value={fechaLimite}
                    onChange={e => setFechaLimite(e.target.value)}
                    style={{ 
                        flex: 1,
                        minWidth: 150,
                        border: `1px solid ${COLORS.border}`, 
                        borderRadius: 6, 
                        padding: 10,
                        fontSize: 15,
                        color: COLORS.textMain 
                    }}
                />
                <button
                    type="submit"
                    style={{
                        background: COLORS.success,
                        color: COLORS.bgCard,
                        border: 'none',
                        borderRadius: 6,
                        fontWeight: 600,
                        padding: '8px 20px',
                        cursor: 'pointer',
                        boxShadow: `0 2px 8px ${COLORS.success}22`,
                        transition: 'background 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = '#059669'; }}
                    onMouseOut={e => { e.currentTarget.style.background = COLORS.success; }}
                >
                    <Save size={18} /> Guardar Tarea
                </button>
            </div>
          </form>
        )}
        
        {loadingTasks ? (
          <div style={{ color: COLORS.textSub, fontSize: 16 }}>Cargando tareas...</div>
        ) : (
          // Contenedor de las 3 columnas - Fijo para evitar el apilamiento
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', // Fija 3 columnas iguales
            gap: 24 
          }}>
            
            {/* 1. Pendientes */}
            <div style={{ background: COLORS.pendingBg, borderRadius: 10, padding: 15, border: `1px solid ${COLORS.border}` }}>
              <h4 style={{ color: COLORS.textMain, fontWeight: 700, fontSize: 18, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Menu size={20} color={COLORS.primary} />
                Pendientes ({pendientes.length})
              </h4>
              <ul style={{ padding: 0, listStyle: 'none' }}>
                {pendientes.map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    color={COLORS.primary} 
                    bg={COLORS.pendingBg}
                    borderColor={COLORS.primary}
                    icon={Menu}
                  />
                ))}
                {pendientes.length === 0 && <li style={{ color: COLORS.textSub, fontSize: 14 }}>Nada pendiente por ahora.</li>}
              </ul>
            </div>
            
            {/* 2. En progreso */}
            <div style={{ background: COLORS.progressBg, borderRadius: 10, padding: 15, border: `1px solid ${COLORS.border}` }}>
              <h4 style={{ color: COLORS.textMain, fontWeight: 700, fontSize: 18, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={20} color={COLORS.accent} />
                En Progreso ({enProgreso.length})
              </h4>
              <ul style={{ padding: 0, listStyle: 'none' }}>
                {enProgreso.map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    color={COLORS.accent} 
                    bg={COLORS.progressBg}
                    borderColor={COLORS.accent}
                    icon={Zap}
                  />
                ))}
                {enProgreso.length === 0 && <li style={{ color: COLORS.textSub, fontSize: 14 }}>Aún nada en desarrollo.</li>}
              </ul>
            </div>
            
            {/* 3. Completadas */}
            <div style={{ background: COLORS.completeBg, borderRadius: 10, padding: 15, border: `1px solid ${COLORS.border}` }}>
              <h4 style={{ textAlign: 'center', color: COLORS.textMain, fontWeight: 700, fontSize: 18, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={20} color={COLORS.success} />
                Completadas ({completadas.length})
              </h4>
              <ul style={{ padding: 0, listStyle: 'none' }}>
                {completadas.map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    color={COLORS.success} 
                    bg={COLORS.completeBg}
                    borderColor={COLORS.success}
                    icon={CheckCircle}
                  />
                ))}
                {completadas.length === 0 && <li style={{ color: COLORS.textSub, fontSize: 14 }}>¡A trabajar!</li>}
              </ul>
            </div>
          </div>
        )}
      </div>
      
      {/* GitHub Stats Panel */}
      <div style={{
        // CAMBIO CLAVE: Permite que el panel se envuelva (wrap) si el contenedor principal se queda sin espacio horizontal.
        flex: '0 0 320px', // Ancho fijo, no crece ni encoge
        maxWidth: 320, 
        minWidth: 260,
        background: COLORS.bgCard,
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        padding: 24,
        height: 'fit-content',
        border: `1px solid ${COLORS.border}`,
        color: COLORS.textMain,
      }}>
        <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 16, color: COLORS.primary, borderBottom: `2px solid ${COLORS.border}`, paddingBottom: 8 }}>
            <GitBranch size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Estadísticas GitHub
        </div>
        
        {githubUrl ? (
            <a 
                href={githubUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ 
                    color: COLORS.accent, 
                    fontWeight: 600, 
                    fontSize: 14, 
                    textDecoration: 'none',
                    display: 'block',
                    marginBottom: 16,
                    wordBreak: 'break-all'
                }}
            >
                {githubUrl.replace('https://', '').replace('www.', '')}
            </a>
        ) : (
            <div style={{ color: COLORS.textSub, marginBottom: 16, fontSize: 14 }}>URL de GitHub no proporcionada.</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 15 }}>
          {loadingGithub ? (
            <div style={{ color: COLORS.textSub, textAlign: 'center', padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Loader2 size={16} className="spinner" /> Cargando...
            </div>
          ) : githubStats?.error ? (
            <div style={{ color: COLORS.accent, textAlign: 'center', padding: 10, border: `1px solid ${COLORS.accent}40`, borderRadius: 6, fontSize: 13 }}>
                {githubStats.error}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px dashed ${COLORS.border}` }}>
                <span style={{ color: COLORS.textMain, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}><Star size={16} color={COLORS.primary} /> Estrellas:</span>
                <span style={{ fontWeight: 700, color: COLORS.primary }}>{githubStats?.stars ?? 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px dashed ${COLORS.border}` }}>
                <span style={{ color: COLORS.textMain, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}><GitBranch size={16} color={COLORS.accent} /> Forks:</span>
                <span style={{ fontWeight: 700, color: COLORS.accent }}>{githubStats?.forks ?? 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px dashed ${COLORS.border}` }}>
                <span style={{ color: COLORS.textMain, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}><Eye size={16} color={COLORS.primary} /> Watchers:</span>
                <span style={{ fontWeight: 700, color: COLORS.primary }}>{githubStats?.watchers ?? 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                <span style={{ color: COLORS.textMain, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}><Bug size={16} color={COLORS.accent} /> Issues Abiertos:</span>
                <span style={{ fontWeight: 700, color: COLORS.accent }}>{githubStats?.issues ?? 0}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}