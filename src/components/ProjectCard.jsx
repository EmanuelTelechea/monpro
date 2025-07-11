import { supabase } from '../supabase/client'
import { useState } from 'react'

export default function ProjectCard({ project, refresh, onEdit }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(project)

  const handleDelete = async () => {
    const { error } = await supabase.from('projects').delete().eq('id', project.id)
    if (!error) refresh()
  }

  const handleUpdate = async () => {
    const { error } = await supabase
      .from('projects')
      .update(form)
      .eq('id', project.id)

    if (!error) {
      setEditing(false)
      refresh()
    }
  }

  if (editing) {
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
          alignItems: 'stretch',
          justifyContent: 'flex-start',
          background: 'linear-gradient(90deg, #0055A4 0%, #fff 50%, #EF4135 100%)',
          padding: 0,
          margin: 0,
        }}
      >
        <div
          style={{
            width: '100vw',
            minWidth: '100vw',
            maxWidth: '100vw',
            background: '#fff',
            borderRadius: 0,
            boxShadow: 'none',
            padding: '2rem 0',
            margin: 0,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <h2 style={{ color: '#0055A4', marginBottom: 24 }}>Editar Proyecto</h2>
          <label style={{ color: '#0055A4', fontWeight: 600 }}>Nombre</label>
          <input
            name="nombre"
            style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #0055A4', borderRadius: 8, marginBottom: 8, padding: 8 }}
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            required
          />
          <label style={{ color: '#0055A4', fontWeight: 600 }}>Descripción</label>
          <input
            name="descripcion"
            style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #0055A4', borderRadius: 8, marginBottom: 8, padding: 8 }}
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            required
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
            onClick={handleUpdate}
          >
            Guardar
          </button>
          <button
            style={{
              marginTop: 16,
              background: '#fff',
              color: '#0055A4',
              border: '2px solid #0055A4',
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
              e.target.style.background = '#0055A4';
              e.target.style.color = '#fff';
            }}
            onMouseOut={e => {
              e.target.style.background = '#fff';
              e.target.style.color = '#0055A4';
            }}
            onClick={() => setEditing(false)}
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      border: '1px solid #ccc',
      padding: '1rem',
      margin: '1rem 0 0 0',
      width: '100%',
      minWidth: 0,
      boxSizing: 'border-box',
      display: 'block',
    }}>
      <h3>{project.nombre}</h3>
      <p>{project.descripcion}</p>
      <small>Inicio: {project.fecha_inicio || '-'}</small><br />
      <small>Fin: {project.fecha_fin || '-'}</small><br />
      <button style={{ width: '100%', marginTop: 8 }} onClick={() => setEditing(true)}>Editar (simple)</button>
      {onEdit && <button style={{ width: '100%', marginTop: 8 }} onClick={onEdit}>Editar (completo)</button>}
      <button style={{ width: '100%', marginTop: 8 }} onClick={handleDelete}>Eliminar</button>
    </div>
  )
}
