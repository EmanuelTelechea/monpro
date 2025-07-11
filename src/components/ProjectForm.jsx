import { useState } from 'react';
import { supabase } from '../supabase/client';

export default function ProjectForm({ project, onSave, userId }) {
  const [form, setForm] = useState({
    nombre: project?.nombre || '',
    descripcion: project?.descripcion || '',
    fecha_inicio: project?.fecha_inicio || '',
    fecha_fin: project?.fecha_fin || '',
    explicacion: project?.explicacion || '',
    funcionalidades: project?.funcionalidades || [],
    caracteristicas: project?.caracteristicas || [],
    versionado: project?.versionado || '',
    flujo_pantallas: project?.flujo_pantallas || [],
    tecnologias: project?.tecnologias || [],
    identidad_colores: project?.identidad_colores || [],
    identidad_tipografia: project?.identidad_tipografia || '',
    identidad_logo: project?.identidad_logo || '',
    github: project?.github || '',
    gitlab: project?.gitlab || '',
    figma: project?.figma || '',
    wireframes: project?.wireframes || [],
    diagramas: project?.diagramas || [],
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field, index, value) => {
    const newArray = [...(form[field] || [])];
    newArray[index] = value;
    setForm((prev) => ({ ...prev, [field]: newArray }));
  };

  const addArrayItem = (field) => {
    setForm((prev) => ({ ...prev, [field]: [...(prev[field] || []), ''] }));
  };

  const removeArrayItem = (field, index) => {
    const newArray = [...form[field]];
    newArray.splice(index, 1);
    setForm((prev) => ({ ...prev, [field]: newArray }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (project?.id) {
      // Editar
      const { error } = await supabase.from('projects').update(form).eq('id', project.id);
      if (!error) onSave?.();
      else alert('Error al guardar');
    } else {
      // Crear
      const { error } = await supabase.from('projects').insert([{ ...form, user_id: userId }]);
      if (!error) onSave?.();
      else alert('Error al crear');
    }
  };

  const renderArrayField = (label, field) => (
    <div>
      <label>{label}</label>
      {(form[field] || []).map((item, index) => (
        <div key={index}>
          <input
            value={item}
            onChange={(e) => handleArrayChange(field, index, e.target.value)}
          />
          <button type="button" onClick={() => removeArrayItem(field, index)}>❌</button>
        </div>
      ))}
      <button type="button" onClick={() => addArrayItem(field)}>Agregar</button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', boxSizing: 'border-box' }}>
      <h2>{project ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h2>

      <label>Nombre</label>
      <input style={{ width: '100%', boxSizing: 'border-box' }} value={form.nombre} onChange={(e) => handleChange('nombre', e.target.value)} required />
<br />
      <label>Descripción</label>
      <textarea style={{ width: '100%', boxSizing: 'border-box' }} value={form.descripcion} onChange={(e) => handleChange('descripcion', e.target.value)} />
<br />
      <label>Fecha de Inicio</label>
      <input type="date" style={{ width: '100%', boxSizing: 'border-box' }} value={form.fecha_inicio} onChange={(e) => handleChange('fecha_inicio', e.target.value)} />
<br />
      <label>Fecha de Fin</label>
      <input type="date" style={{ width: '100%', boxSizing: 'border-box' }} value={form.fecha_fin} onChange={(e) => handleChange('fecha_fin', e.target.value)} />
<br />
      <label>Explicación</label>
      <textarea style={{ width: '100%', boxSizing: 'border-box' }} value={form.explicacion} onChange={(e) => handleChange('explicacion', e.target.value)} />
<br />
      {renderArrayField('Funcionalidades', 'funcionalidades')}
      {renderArrayField('Características', 'caracteristicas')}

      <label>Versionado</label>
      <textarea style={{ width: '100%', boxSizing: 'border-box' }} value={form.versionado} onChange={(e) => handleChange('versionado', e.target.value)} />
<br />
      {renderArrayField('Flujo de Pantallas', 'flujo_pantallas')}
      {renderArrayField('Tecnologías', 'tecnologias')}
      {renderArrayField('Colores Identidad Visual', 'identidad_colores')}

      <label>Tipografía</label>
      <input style={{ width: '100%', boxSizing: 'border-box' }} value={form.identidad_tipografia} onChange={(e) => handleChange('identidad_tipografia', e.target.value)} />
<br />
      <label>Logo (URL)</label>
      <input style={{ width: '100%', boxSizing: 'border-box' }} value={form.identidad_logo} onChange={(e) => handleChange('identidad_logo', e.target.value)} />
<br />
      <label>GitHub</label>
      <input style={{ width: '100%', boxSizing: 'border-box' }} value={form.github} onChange={(e) => handleChange('github', e.target.value)} />
<br />
      <label>GitLab</label>
      <input style={{ width: '100%', boxSizing: 'border-box' }} value={form.gitlab} onChange={(e) => handleChange('gitlab', e.target.value)} />
<br />
      <label>Figma</label>
      <input style={{ width: '100%', boxSizing: 'border-box' }} value={form.figma} onChange={(e) => handleChange('figma', e.target.value)} />

      {renderArrayField('Wireframes (URLs)', 'wireframes')}
      {renderArrayField('Diagramas (URLs)', 'diagramas')}

      <button type="submit" style={{ width: '100%', boxSizing: 'border-box', marginTop: 16 }}>{project ? 'Guardar Cambios' : 'Crear Proyecto'}</button>
    </form>
  );
}