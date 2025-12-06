import { useState } from 'react';
import { supabase } from '../supabase/client';
import { Plus, Trash2, Save, Send } from 'lucide-react';

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

    // --- PALETA DE COLORES FRANCESA ---
    const COLORS = {
        primary: '#0F172A',     // Azul oscuro elegante (Slate 900)
        accent: '#0055A4',      // Azul Francia (Principal)
        highlight: '#EF4135',   // Rojo Marianne (Acción/Peligro)
        bg: '#F8FAFC',          // Fondo gris muy claro (Slate 50)
        white: '#FFFFFF',
        border: '#E2E8F0',      // Borde suave
        textMain: '#334155',
        textLight: '#64748B',
    }

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
            const { data, error } = await supabase
                .from('projects')
                .insert([{ ...form, user_id: userId }])
                .select()
                .single();
            if (!error && data) {
                onSave && onSave(data); // Esto debe pasar el objeto con id
            } else alert('Error al crear');
        }
    };

    // Renderiza campos de entrada de texto
    const renderInputField = (label, field, type = 'text', required = false) => (
        <div style={{ marginBottom: 16 }}>
            <label style={styles.label}>{label}</label>
            {type === 'textarea' ? (
                <textarea
                    style={styles.textarea}
                    value={form[field]}
                    onChange={(e) => handleChange(field, e.target.value)}
                    required={required}
                />
            ) : (
                <input
                    type={type}
                    style={styles.input}
                    value={form[field]}
                    onChange={(e) => handleChange(field, e.target.value)}
                    required={required}
                />
            )}
        </div>
    );
    
    // Renderiza campos de array (funcionalidades, tecnologías, etc.)
    const renderArrayField = (label, field) => (
        <div style={styles.arrayContainer}>
            <h3 style={styles.arrayLabel}>{label}</h3>
            {(form[field] || []).map((item, index) => (
                <div key={index} style={styles.arrayItem}>
                    <input
                        style={styles.arrayInput}
                        value={item}
                        onChange={(e) => handleArrayChange(field, index, e.target.value)}
                        placeholder={`Elemento ${index + 1}`}
                    />
                    <button 
                        type="button" 
                        onClick={() => removeArrayItem(field, index)} 
                        style={styles.removeButton}
                        title="Eliminar elemento"
                    >
                        <Trash2 size={16} color={COLORS.highlight} />
                    </button>
                </div>
            ))}
            <button 
                type="button" 
                onClick={() => addArrayItem(field)} 
                style={styles.addButton}
            >
                <Plus size={16} /> Agregar {label.split(' ')[0]}
            </button>
        </div>
    );

    // --- ESTILOS INLINE ELEGANTES ---
    const styles = {
        form: {
        width: '100%',
        // AÑADE ESTO: Limita el ancho del formulario, incluso si se desborda el grid.
        maxWidth: '900px', 
        margin: '0 auto', // Lo centra dentro de su padre.
        boxSizing: 'border-box',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px 32px',
        padding: '20px', // Añade un padding interno seguro
    },
        header: {
            gridColumn: '1 / -1', // Ocupa todo el ancho
            fontSize: '24px',
            marginBottom: '16px',
            color: COLORS.primary,
            borderBottom: `2px solid ${COLORS.border}`,
            paddingBottom: '10px',
            fontWeight: 700
        },
        section: {
            gridColumn: '1 / -1', // Ocupa todo el ancho
            margin: '16px 0 8px 0',
            fontSize: '18px',
            color: COLORS.accent,
            borderLeft: `3px solid ${COLORS.accent}`,
            paddingLeft: '10px',
            fontWeight: 600,
        },
        label: {
            display: 'block',
            marginBottom: '6px',
            fontWeight: 600,
            fontSize: '14px',
            color: COLORS.textMain,
        },
        input: {
            width: '100%',
            padding: '10px 12px',
            border: `1px solid ${COLORS.border}`,
            borderRadius: '8px',
            boxSizing: 'border-box',
            fontSize: '16px',
            transition: 'border-color 0.2s, box-shadow 0.2s',
        },
        textarea: {
            width: '100%',
            padding: '10px 12px',
            border: `1px solid ${COLORS.border}`,
            borderRadius: '8px',
            boxSizing: 'border-box',
            fontSize: '16px',
            minHeight: '80px',
            transition: 'border-color 0.2s, box-shadow 0.2s',
        },
        arrayContainer: {
            gridColumn: '1 / -1', // Ocupa todo el ancho
            background: COLORS.bg,
            borderRadius: 12,
            padding: 16,
            border: `1px solid ${COLORS.border}`,
            marginBottom: 16,
        },
        arrayLabel: {
            margin: '0 0 12px 0',
            fontSize: '16px',
            color: COLORS.primary,
            fontWeight: 700,
        },
        arrayItem: {
            display: 'flex',
            gap: 8,
            marginBottom: 8,
            alignItems: 'center',
        },
        arrayInput: {
            flex: 1,
            padding: '8px 10px',
            border: `1px solid ${COLORS.border}`,
            borderRadius: '6px',
            boxSizing: 'border-box',
            fontSize: '14px',
        },
        removeButton: {
            background: 'transparent',
            border: `1px solid ${COLORS.border}`,
            borderRadius: '6px',
            padding: '4px',
            cursor: 'pointer',
            height: '34px',
            width: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.2s, border-color 0.2s',
        },
        addButton: {
            background: COLORS.white,
            color: COLORS.accent,
            border: `1px solid ${COLORS.accent}`,
            borderRadius: '6px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'background 0.2s, color 0.2s',
        },
        submitButton: {
            gridColumn: '1 / -1', // Ocupa todo el ancho
            marginTop: 24,
            padding: '14px 24px',
            background: COLORS.accent,
            color: COLORS.white,
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '16px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 85, 164, 0.3)',
            transition: 'transform 0.2s, background 0.2s, box-shadow 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
        }
    };

    return (
        <form onSubmit={handleSubmit} style={styles.form}>
            <style>{`
                /* Estilos CSS para los inputs y botones al interactuar */
                .form-input:focus {
                    border-color: ${COLORS.accent} !important;
                    box-shadow: 0 0 0 3px ${COLORS.accent}33 !important;
                    outline: none;
                }
                .form-input:hover {
                    border-color: ${COLORS.accent}77 !important;
                }
                .array-remove-btn:hover {
                    background: ${COLORS.highlight}10 !important;
                    border-color: ${COLORS.highlight} !important;
                }
                .array-add-btn:hover {
                    background: ${COLORS.accent} !important;
                    color: ${COLORS.white} !important;
                    box-shadow: 0 2px 8px ${COLORS.accent}33;
                }
                .submit-btn:hover {
                    transform: translateY(-2px);
                    background: ${COLORS.primary} !important;
                    box-shadow: 0 6px 16px ${COLORS.primary}44 !important;
                }
                /* Media Query para una sola columna en móvil */
                @media (max-width: 768px) {
                    form {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>

            <h2 style={styles.header}>
                {project ? 'Editar Proyecto' : 'Nuevo Proyecto'}
            </h2>

            {/* --- SECCIÓN PRINCIPAL --- */}
            <div style={{ gridColumn: '1 / -1' }}>
                <h3 style={styles.section}>Información Básica</h3>
            </div>
            {renderInputField('Nombre del Proyecto', 'nombre', 'text', true)}
            {renderInputField('Descripción Breve', 'descripcion', 'textarea')}
            {renderInputField('Fecha de Inicio', 'fecha_inicio', 'date')}
            {renderInputField('Fecha de Fin Estimada', 'fecha_fin', 'date')}
            <div style={{ gridColumn: '1 / -1' }}>
                {renderInputField('Explicación Detallada', 'explicacion', 'textarea')}
            </div>

            {/* --- SECCIÓN DETALLES TÉCNICOS --- */}
            <div style={{ gridColumn: '1 / -1' }}>
                <h3 style={styles.section}>Alcance y Especificaciones</h3>
            </div>
            {renderArrayField('Funcionalidades Requeridas', 'funcionalidades')}
            {renderArrayField('Características Técnicas', 'caracteristicas')}
            {renderInputField('Control de Versionado', 'versionado', 'textarea')}
            {renderArrayField('Tecnologías a Usar', 'tecnologias')}
            {renderArrayField('URLs de Wireframes (Imágenes)', 'wireframes')}
            {renderArrayField('URLs de Diagramas (Imágenes)', 'diagramas')}

            {/* --- SECCIÓN IDENTIDAD Y RECURSOS --- */}
            <div style={{ gridColumn: '1 / -1' }}>
                <h3 style={styles.section}>Identidad y Recursos</h3>
            </div>
            {renderArrayField('Códigos de Color (Ej: #0055A4)', 'identidad_colores')}
            {renderInputField('Tipografía (Fuente)', 'identidad_tipografia')}
            {renderInputField('URL del Logo', 'identidad_logo')}
            {renderInputField('URL GitHub', 'github')}
            {renderInputField('URL GitLab', 'gitlab')}
            {renderInputField('URL Figma/Prototipo', 'figma')}

            <button
                type="submit"
                className="submit-btn"
                style={styles.submitButton}
            >
                {project ? <><Save size={20} /> Guardar Cambios</> : <><Send size={20} /> Crear Proyecto</>}
            </button>
        </form>
    );
}