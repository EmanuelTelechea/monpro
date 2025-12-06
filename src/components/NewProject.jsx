import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectForm from './ProjectForm';
import { guardarProyectoOffline, sincronizarPendientes } from '../services/projectService';
import { XCircle } from 'lucide-react'; // Icono moderno para Cancelar

const NewProject = ({ session }) => {
    const navigate = useNavigate();

    // --- PALETA DE COLORES FRANCESA ---
    const COLORS = {
        primary: '#0F172A',     // Azul oscuro elegante
        accent: '#0055A4',      // Azul Francia (Principal)
        highlight: '#EF4135',   // Rojo Marianne
        bg: '#F8FAFC',          // Fondo de la página (gris muy suave)
        white: '#FFFFFF',       // Fondo del formulario
        border: '#E2E8F0',
        textMain: '#334155',
        textLight: '#64748B',
    }

    useEffect(() => {
        window.addEventListener('online', sincronizarPendientes);
        return () => {
            window.removeEventListener('online', sincronizarPendientes);
        };
    }, []);

    const handleSave = async (data) => {
        try {
            if (navigator.onLine) {
                if (data && data.id) {
                    navigate(`/project/${data.id}`);
                }
                return;
            } else {
                // Aseguramos que el user_id se incluye al guardar offline
                await guardarProyectoOffline({...data, user_id: session.user.id }); 
                alert('💾 Proyecto guardado localmente. Se sincronizará cuando tengas conexión.');
                navigate('/');
            }
        } catch (error) {
            console.error('Error al guardar el proyecto:', error);
            alert('❌ Hubo un problema al guardar el proyecto.');
        }
    };

    if (!session?.user?.id) {
        return (
            <div style={{ padding: 32, textAlign: 'center', color: COLORS.highlight, background: COLORS.bg, minHeight: '100vh' }}>
                <XCircle size={24} style={{ marginBottom: 8 }} />
                <p style={{ margin: 0 }}>No hay usuario autenticado. Por favor inicia sesión.</p>
            </div>
        );
    }

    // Estilos del botón Cancelar
    const cancelButtonStyles = {
        marginTop: 24,
        background: COLORS.white,
        color: COLORS.textMain,
        border: `2px solid ${COLORS.border}`,
        borderRadius: '8px', // Moderno
        fontWeight: 600,
        fontSize: 16,
        padding: '10px 32px',
        cursor: 'pointer',
        width: 'fit-content',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        transition: 'background 0.2s, color 0.2s, border-color 0.2s',
    };

    return (
        <div
            style={{
                // ESTRATEGIA DE ANCHO (CÓDIGO ORIGINAL): 
                // Mantener '100vw' para forzar la cobertura total del viewport.
                minHeight: 'calc(100vh - 80px)', 
                width: '100vw', 
                boxSizing: 'border-box',
                overflowX: 'hidden', // CLAVE: Previene el scroll horizontal causado por '100vw'
                display: 'flex',
                flexDirection: 'column',
                // CAMBIO DE ESTILO: Reemplazamos el degradado por un fondo sólido limpio.
                background: COLORS.bg, 
                padding: 0,
                margin: 0,
            }}
        >
            {/* INYECCIÓN DE ESTILOS GLOBALES NECESARIOS */}
            <style>{`
                /* Asegura que no haya márgenes en el cuerpo y que el scroll horizontal esté oculto */
                body {
                    overflow-x: hidden !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }
                .new-container {
                    margin: 32px auto;
                    transition: all 0.3s;
                }
                @media (max-width: 768px) {
                    .new-container {
                        max-width: 95% !important; /* Adaptar a móvil */
                        margin: 16px auto !important;
                        padding: 1rem !important;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                    }
                }
            `}</style>
            
            <div
                className="new-container"
                style={{
                    // Contenedor blanco (tarjeta)
                    maxWidth: 750, // Más espacio para el formulario
                    width: '95%',
                    background: COLORS.white,
                    borderRadius: 12, // Moderno
                    boxShadow: '0 8px 25px rgba(0, 85, 164, 0.15)', // Sombra elegante
                    padding: '2.5rem', // Más padding
                    margin: '32px auto',
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
                
                {/* Botón de Cancelar re-estilizado */}
                <button
                    className="cancel-btn"
                    style={cancelButtonStyles}
                    onClick={() => navigate(-1)}
                    onMouseOver={e => {
                        e.target.style.background = COLORS.border;
                        e.target.style.borderColor = COLORS.textLight;
                        e.target.style.color = COLORS.textMain;
                    }}
                    onMouseOut={e => {
                        e.target.style.background = COLORS.white;
                        e.target.style.borderColor = COLORS.border;
                        e.target.style.color = COLORS.textMain;
                    }}
                >
                    <XCircle size={16} /> Volver / Cancelar
                </button>
            </div>
        </div>
    );
};

export default NewProject;