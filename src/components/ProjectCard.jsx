import { supabase } from '../supabase/client'
import { useState, Fragment } from 'react'
import { guardarProyectoOffline, eliminarProyecto } from '../services/projectService'
import { Edit, Trash2, Save, X, Info } from 'lucide-react' 

export default function ProjectCard({ project, refresh, onEdit }) {
    const [editing, setEditing] = useState(false)
    const [form, setForm] = useState(project)

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
        offline: '#D97706',     // Amarillo/Naranja para offline
    }

    const handleDelete = async () => {
        if (!window.confirm(`¿Estás seguro de que quieres eliminar el proyecto "${project.nombre}"?`)) return;

        if (navigator.onLine) {
            const { error } = await supabase.from('projects').delete().eq('id', project.id)
            if (!error) refresh()
            else alert('Error al eliminar en Supabase.')
        } else {
            await eliminarProyecto(project.id)
            alert('❌ Proyecto marcado para eliminar cuando se recupere la conexión.')
            refresh()
        }
    }

    const handleUpdate = async () => {
        if (navigator.onLine) {
            const { error } = await supabase
                .from('projects')
                .update(form)
                .eq('id', project.id)

            if (!error) {
                setEditing(false)
                refresh()
            } else {
                alert('Error al actualizar en Supabase.')
            }
        } else {
            await guardarProyectoOffline({ ...form, id: project.id, offline_status: 'updated' })
            alert('🔄 Cambios guardados localmente. Se sincronizarán al estar online.')
            setEditing(false)
            refresh()
        }
    }

    // Estilo común para botones
    const getButtonStyle = (bg, border, color = COLORS.white) => ({
        marginTop: 16,
        background: bg,
        color: color,
        border: `2px solid ${border}`,
        borderRadius: '8px',
        fontWeight: 600,
        fontSize: 15,
        padding: '10px 20px',
        cursor: 'pointer',
        minWidth: 120,
        transition: 'background 0.2s, color 0.2s, transform 0.1s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    })

    // --- MODO EDICIÓN RÁPIDA (MODAL A PANTALLA COMPLETA EN PC) ---
    if (editing) {
        
        // --- 🔑 EL TRUCO PARA EL ANCHO COMPLETO EN PC ---
        // Estilos base: Diseño para Desktop (ancho completo)
        const modalContentStyle = {
            width: 'calc(100% - 100px)', // Ocupa todo el espacio menos un margen de 50px a cada lado
            maxWidth: 1200, // Establecemos un límite máximo razonable en pantallas grandes
            background: COLORS.white,
            borderRadius: 12,
            boxShadow: '0 10px 30px rgba(0, 85, 164, 0.4)', 
            padding: '2rem',
            margin: '50px', // Margen visible en desktop (50px por lado)
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
        };

        // Regla agresiva para móviles: limitar ancho, anular margen, bordes y sombra
        if (window.innerWidth <= 768) { 
            modalContentStyle.maxWidth = 500; // Restaurar el límite de ancho para móvil/tablet
            modalContentStyle.width = 'calc(100% - 32px)'; // Ancho completo menos un margen de 16px por lado
            modalContentStyle.margin = '16px'; // Centrado en móvil con un pequeño margen
            modalContentStyle.padding = '1.5rem'; 
            modalContentStyle.borderRadius = 12; // Mantener bordes redondeados en móvil (o 0 si quieres el efecto de la última vez)
            modalContentStyle.boxShadow = '0 10px 30px rgba(0, 85, 164, 0.4)'; // Mantener sombra
        }
        // --------------------------------------------------------

        return (
            <Fragment>
                {/* INYECCIÓN DE ESTILOS GLOBALES: solo para asegurar que no haya scroll horizontal */}
                <style>{`
                    body {
                        overflow-x: hidden !important; 
                        /* Dejamos margin y padding fuera de aquí para no interferir con otros componentes */
                    }
                `}</style>
                
                <div style={{
                    // El overlay fijo de pantalla completa
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100%', 
                    height: '100%', 
                    background: 'rgba(15, 23, 42, 0.95)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center', // Alineación al centro vertical
                    justifyContent: 'center', // Alineación al centro horizontal
                    padding: 0, 
                    overflowY: 'auto', 
                    boxSizing: 'border-box',
                }}>
                    <div 
                        style={modalContentStyle} // <-- Aplicamos el estilo condicional aquí
                    >
                        {/* ... Contenido del Formulario de Edición (sin cambios) ... */}
                        <h2 style={{ color: COLORS.accent, marginBottom: 12, borderBottom: `2px solid ${COLORS.border}`, paddingBottom: 8, fontSize: 22 }}>
                            Editar Rápido
                        </h2>

                        <label style={{ color: COLORS.textMain, fontWeight: 600, fontSize: 14 }}>Nombre</label>
                        <input
                            name="nombre"
                            style={{ width: '100%', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: 10, boxSizing: 'border-box' }}
                            value={form.nombre}
                            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                        />
                        
                        <label style={{ color: COLORS.textMain, fontWeight: 600, fontSize: 14, marginTop: 12 }}>Descripción</label>
                        <textarea
                            name="descripcion"
                            rows={4}
                            style={{ width: '100%', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: 10, boxSizing: 'border-box' }}
                            value={form.descripcion}
                            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                        />

                        {/* Botones de acción */}
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                            <button
                                style={{ ...getButtonStyle(COLORS.white, COLORS.textLight, COLORS.textMain), transition: 'none', boxShadow: 'none' }}
                                onClick={() => setEditing(false)}
                                onMouseOver={e => { e.target.style.background = COLORS.border }}
                                onMouseOut={e => { e.target.style.background = COLORS.white }}
                            >
                                <X size={16} /> Cancelar
                            </button>
                            <button
                                style={{ ...getButtonStyle(COLORS.accent, COLORS.accent), transition: 'none', boxShadow: '0 4px 10px #0055A433' }}
                                onClick={handleUpdate}
                                onMouseOver={e => { e.target.style.background = COLORS.primary }}
                                onMouseOut={e => { e.target.style.background = COLORS.accent }}
                            >
                                <Save size={16} /> Guardar
                            </button>
                        </div>
                    </div>
                </div>
            </Fragment>
        )
    }

    // --- VISTA DE TARJETA ESTÁNDAR ---
    const isOfflinePending = project.offline_status === 'updated' || project.offline_status === 'deleted' || project.offline_status === 'created';

    return (
        <div 
            style={{
                background: COLORS.white,
                border: isOfflinePending ? `2px solid ${COLORS.offline}` : `1px solid ${COLORS.border}`,
                borderRadius: 12,
                padding: '1.5rem',
                marginBottom: 16,
                width: '100%', 
                boxSizing: 'border-box',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.boxShadow = '0 6px 15px rgba(0, 85, 164, 0.1)'}
            onMouseOut={e => e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.05)'}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <h3 style={{ fontSize: 18, margin: 0, color: COLORS.primary, fontWeight: 700 }}>
                    {project.nombre}
                </h3>
                {isOfflinePending && (
                    <span style={{ 
                        background: COLORS.offline, 
                        color: COLORS.white, 
                        padding: '4px 8px', 
                        borderRadius: 4, 
                        fontSize: 12, 
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                    }} title={`Acción pendiente: ${project.offline_status}`}>
                        <Info size={14} /> OFFLINE PENDIENTE
                    </span>
                )}
            </div>

            <p style={{ color: COLORS.textMain, marginBottom: 12, fontSize: 14 }}>
                {project.descripcion}
            </p>
            
            <div style={{ color: COLORS.textLight, fontSize: 13, lineHeight: 1.6 }}>
                **Inicio:** <span style={{ fontWeight: 600 }}>{project.fecha_inicio || '-'}</span> |
                **Fin:** <span style={{ fontWeight: 600 }}>{project.fecha_fin || '-'}</span>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                
                <button 
                    style={{ 
                        ...getButtonStyle(COLORS.bg, COLORS.textLight, COLORS.textMain), 
                        flexGrow: 1, 
                        minWidth: 'auto',
                        padding: '8px 16px',
                    }} 
                    onClick={() => setEditing(true)}
                    onMouseOver={e => e.target.style.background = COLORS.border}
                    onMouseOut={e => e.target.style.background = COLORS.bg}
                >
                    <Edit size={16} /> Editar (Simple)
                </button>
                
                {onEdit && (
                    <button 
                        style={{ 
                            ...getButtonStyle(COLORS.accent, COLORS.accent, COLORS.white), 
                            flexGrow: 1, 
                            minWidth: 'auto',
                            padding: '8px 16px',
                        }} 
                        onClick={onEdit}
                        onMouseOver={e => e.target.style.background = COLORS.primary}
                        onMouseOut={e => e.target.style.background = COLORS.accent}
                    >
                        <Info size={16} /> Ver Detalles
                    </button>
                )}

                <button 
                    style={{ 
                        ...getButtonStyle(COLORS.highlight, COLORS.highlight, COLORS.white), 
                        flexGrow: 1, 
                        minWidth: 'auto',
                        padding: '8px 16px',
                        background: COLORS.highlight,
                    }} 
                    onClick={handleDelete}
                    onMouseOver={e => e.target.style.background = COLORS.primary}
                    onMouseOut={e => e.target.style.background = COLORS.highlight}
                >
                    <Trash2 size={16} /> Eliminar
                </button>
            </div>
        </div>
    )
}