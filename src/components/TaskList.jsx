import { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';

export default function TaskList({ projectId, onTaskUpdate, githubUrl, githubStats }) {
  const [tasks, setTasks] = useState([]);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (!error) setTasks(data);
    setLoading(false);
  };

  useEffect(() => {
    if (projectId) fetchTasks();
    // eslint-disable-next-line
  }, [projectId]);

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

  // Agrupa tareas por estado
  const pendientes = tasks.filter(t => (t.estado || 'pendiente') === 'pendiente');
  const enProgreso = tasks.filter(t => t.estado === 'en progreso');
  const completadas = tasks.filter(t => t.estado === 'completada');

  return (
    <div
      style={{
        marginTop: 32,
        display: 'flex',
        gap: 32,
        background: '#f5f7fa',
        borderRadius: 12,
        boxShadow: '0 2px 12px #0002',
        padding: 16,
        width: '100%',
        boxSizing: 'border-box',
        overflowX: 'auto',
      }}
    >
      {/* Task Board - 70% */}
      <div style={{ flex: 7, minWidth: 0 }}>
        <h3 style={{ color: '#0055A4', fontWeight: 700, marginBottom: 8 }}>Tareas</h3>
        <button
          style={{
            marginBottom: 12,
            background: '#0055A4',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontWeight: 600,
            fontSize: 15,
            padding: '8px 20px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px #0055A422',
            transition: 'background 0.2s',
          }}
          onMouseOver={e => {
            e.currentTarget.style.background = '#EF4135';
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = '#0055A4';
          }}
          onClick={() => setShowForm(v => !v)}
        >
          {showForm ? 'Cancelar' : '+ Tarea'}
        </button>
        {showForm && (
          <form onSubmit={handleAddTask} style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <input
              placeholder="Título"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              required
              style={{ flex: 2, minWidth: 120, border: '1.5px solid #0055A4', borderRadius: 4, padding: 6 }}
            />
            <input
              placeholder="Descripción"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              style={{ flex: 3, minWidth: 120, border: '1.5px solid #0055A4', borderRadius: 4, padding: 6 }}
            />
            <input
              type="date"
              value={fechaLimite}
              onChange={e => setFechaLimite(e.target.value)}
              style={{ flex: 1, minWidth: 120, border: '1.5px solid #0055A4', borderRadius: 4, padding: 6 }}
              title="Fecha límite"
            />
            <button
              type="submit"
              style={{
                background: '#EF4135',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                fontWeight: 600,
                padding: '6px 18px',
                cursor: 'pointer',
                boxShadow: '0 1px 4px #EF413522',
                transition: 'background 0.2s',
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = '#0055A4';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = '#EF4135';
              }}
            >
              Guardar
            </button>
          </form>
        )}
        {loading ? (
          <div>Cargando tareas...</div>
        ) : (
          <div style={{ display: 'flex', gap: 24 }}>
            {/* Pendientes */}
            <div style={{ flex: 1, background: '#fff', border: '1.5px solid #0055A4', borderRadius: 8, padding: 10, boxShadow: '0 1px 4px #0055A422' }}>
              <h4 style={{ textAlign: 'center', color: '#0055A4', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Pendientes</h4>
              <ul style={{ padding: 0, listStyle: 'none' }}>
                {pendientes.map(task => (
                  <li key={task.id} style={{ marginBottom: 10, background: '#e6f0fa', borderRadius: 5, padding: 7, borderLeft: '4px solid #0055A4', fontSize: 15 }}>
                    <span style={{ color: '#0055A4', fontWeight: 600 }}>{task.titulo}</span>
                    {task.descripcion && <span style={{ color: '#222', marginLeft: 6 }}>{task.descripcion}</span>}
                    {task.fecha_limite && (
                      <span style={{ marginLeft: 8, color: '#888' }}>
                        {task.fecha_limite}
                      </span>
                    )}
                    <select
                      value={task.estado || 'pendiente'}
                      onChange={e => handleChangeEstado(task.id, e.target.value)}
                      style={{ marginLeft: 12, border: '1.2px solid #0055A4', borderRadius: 4, padding: 3 }}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="en progreso">En progreso</option>
                      <option value="completada">Completada</option>
                    </select>
                  </li>
                ))}
                {pendientes.length === 0 && <li style={{ color: '#aaa' }}>Sin tareas</li>}
              </ul>
            </div>
            {/* En progreso */}
            <div style={{ flex: 1, background: '#f0f6ff', border: '1.5px solid #EF4135', borderRadius: 8, padding: 10, boxShadow: '0 1px 4px #EF413522' }}>
              <h4 style={{ textAlign: 'center', color: '#EF4135', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>En progreso</h4>
              <ul style={{ padding: 0, listStyle: 'none' }}>
                {enProgreso.map(task => (
                  <li key={task.id} style={{ marginBottom: 10, background: '#fff2f2', borderRadius: 5, padding: 7, borderLeft: '4px solid #EF4135', fontSize: 15 }}>
                    <span style={{ color: '#EF4135', fontWeight: 600 }}>{task.titulo}</span>
                    {task.descripcion && <span style={{ color: '#222', marginLeft: 6 }}>{task.descripcion}</span>}
                    {task.fecha_limite && (
                      <span style={{ marginLeft: 8, color: '#888' }}>
                        {task.fecha_limite}
                      </span>
                    )}
                    <select
                      value={task.estado}
                      onChange={e => handleChangeEstado(task.id, e.target.value)}
                      style={{ marginLeft: 12, border: '1.2px solid #EF4135', borderRadius: 4, padding: 3 }}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="en progreso">En progreso</option>
                      <option value="completada">Completada</option>
                    </select>
                  </li>
                ))}
                {enProgreso.length === 0 && <li style={{ color: '#aaa' }}>Sin tareas</li>}
              </ul>
            </div>
            {/* Completadas */}
            <div style={{ flex: 1, background: '#f6fff6', border: '1.5px solid #22c55e', borderRadius: 8, padding: 10, boxShadow: '0 1px 4px #22c55e22' }}>
              <h4 style={{ textAlign: 'center', color: '#22c55e', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Completadas</h4>
              <ul style={{ padding: 0, listStyle: 'none' }}>
                {completadas.map(task => (
                  <li key={task.id} style={{ marginBottom: 10, background: '#eafaf0', borderRadius: 5, padding: 7, borderLeft: '4px solid #22c55e', fontSize: 15 }}>
                    <span style={{ color: '#22c55e', fontWeight: 600 }}>{task.titulo}</span>
                    {task.descripcion && <span style={{ color: '#222', marginLeft: 6 }}>{task.descripcion}</span>}
                    {task.fecha_limite && (
                      <span style={{ marginLeft: 8, color: '#888' }}>
                        {task.fecha_limite}
                      </span>
                    )}
                    <select
                      value={task.estado}
                      onChange={e => handleChangeEstado(task.id, e.target.value)}
                      style={{ marginLeft: 12, border: '1.2px solid #22c55e', borderRadius: 4, padding: 3 }}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="en progreso">En progreso</option>
                      <option value="completada">Completada</option>
                    </select>
                  </li>
                ))}
                {completadas.length === 0 && <li style={{ color: '#aaa' }}>Sin tareas</li>}
              </ul>
            </div>
          </div>
        )}
      </div>
      {/* GitHub Stats - 30% */}
      <div style={{
        flex: 3,
        maxWidth: 380,
        minWidth: 260,
        background: '#fff',
        borderRadius: 10,
        boxShadow: '0 1px 4px #0001',
        padding: 20,
        height: 'fit-content',
        border: '1.5px solid #0055A4',
        color: '#222',
      }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, color: '#0055A4' }}>GitHub</div>
        {githubUrl && (
          <a href={githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#EF4135', fontWeight: 600, fontSize: 15, textDecoration: 'underline' }}>
            {githubUrl.replace('https://', '').replace('www.', '')}
          </a>
        )}
        <div style={{ marginTop: 16, fontSize: 14 }}>
          {githubStats ? (
            <>
              <div style={{ color: '#0055A4' }}>⭐ {githubStats.stars ?? '-'}</div>
              <div style={{ color: '#EF4135' }}>🍴 {githubStats.forks ?? '-'}</div>
              <div style={{ color: '#0055A4' }}>👀 {githubStats.watchers ?? '-'}</div>
              <div style={{ color: '#EF4135' }}>🐞 {githubStats.issues ?? '-'}</div>
            </>
          ) : (
            <div style={{ color: '#aaa' }}>Sin datos</div>
          )}
        </div>
      </div>
    </div>
  );
}
