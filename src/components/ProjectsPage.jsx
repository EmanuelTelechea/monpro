import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase/client'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, ChevronDown, Folder, Layout, Upload } from 'lucide-react'

export default function ProjectsPage({ session }) {
    const [projects, setProjects] = useState([])
    const [tasksByProject, setTasksByProject] = useState({})
    const [filter, setFilter] = useState('todos')
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const navigate = useNavigate()

    const fileInputRef = useRef(null) 

    const LOCAL_STORAGE_KEY = `projects_${session.user.id}`
    
    // Colores "Esencia Francesa"
    const COLORS = {
        primary: '#001b5aff', 
        accent: '#0055A4', 
        highlight: '#EF4135', 
        bg: '#F8FAFC',
        white: '#FFFFFF',
        border: '#E2E8F0',
        textMain: '#334155',
        textLight: '#64748B'
    }

    // --- LÓGICA DE DATOS Y EFECTOS (fetch, load, delete) ---
    const fetchProjects = async () => {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })

        if (!error) {
            setProjects(data)
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data))
        }
    }

    const loadProjectsFromLocalStorage = () => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
        if (saved) {
            try { setProjects(JSON.parse(saved)) } catch (e) {}
        }
    }

    const fetchTasksByProject = async (projectIds) => {
        if (!projectIds.length) return
        const { data, error } = await supabase
            .from('tasks')
            .select('id, project_id, estado')
            .in('project_id', projectIds) 

        if (!error) {
            const grouped = {}
            projectIds.forEach(pid => grouped[pid] = [])
            data.forEach(task => {
                if (grouped[task.project_id]) grouped[task.project_id].push(task)
            })
            setTasksByProject(grouped)
        }
    }

    const handleCreate = () => navigate('/projects/new')

    const handleDelete = async (projectId) => {
        if (!window.confirm('¿Confirma eliminar este proyecto? Se eliminarán todas las tareas asociadas.')) return;
        
        await supabase.from('tasks').delete().eq('project_id', projectId);

        const { error } = await supabase.from('projects').delete().eq('id', projectId).eq('user_id', session.user.id)
        
        if (!error) {
            const updated = projects.filter(p => p.id !== projectId)
            setProjects(updated)
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
        } else {
            alert(`Error al eliminar el proyecto: ${error.message}`);
        }
    }

    // --- LÓGICA DE IMPORTACIÓN GENÉRICA (JSON) ---

    const handleImportClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const json = JSON.parse(e.target.result);
                    importProjects(json);
                } catch (error) {
                    alert('Error al leer el archivo. Asegúrate de que sea un JSON válido.');
                    console.error('Error parsing JSON:', error);
                }
            };
            reader.readAsText(file);
        }
        event.target.value = null; 
    };

    const importProjects = async (projectsToImport) => {
        // Asegura que pueda manejar un solo objeto o un array de objetos (aunque el JSON de exportación es un objeto con tareas)
        const projectsArray = Array.isArray(projectsToImport) ? projectsToImport : [projectsToImport];
        
        if (projectsArray.length === 0) {
            return alert('No se encontraron proyectos válidos para importar.');
        }
        
        // La importación JSON solo importa los datos del proyecto, no las tareas anidadas
        const projectsToInsert = projectsArray.map(p => ({
            nombre: p.nombre || 'Proyecto importado sin nombre',
            descripcion: p.descripcion,
            user_id: session.user.id, 
            fecha_inicio: p.fecha_inicio || null,
        }));

        const { error } = await supabase
            .from('projects')
            .insert(projectsToInsert);

        if (error) {
            alert('Error al importar proyectos: ' + error.message);
            console.error('Error de Supabase:', error);
        } else {
            alert(`✅ Importación exitosa: Se agregaron ${projectsToInsert.length} proyecto(s).`);
            fetchProjects(); 
        }
    };
    
    // --- LÓGICA DE EXPORTACIÓN (sin cambios) ---
    
    const fetchProjectDetailsAndExport = async (projectId, projectName) => {
        const { data: projectData, error: projectError } = await supabase
            .from('projects')
            .select('*') 
            .eq('id', projectId)
            .single();

        if (projectError || !projectData) {
            alert("Error al obtener detalles del proyecto. Intente de nuevo.");
            console.error(projectError);
            return;
        }

        const { data: tasksData, error: tasksError } = await supabase
            .from('tasks')
            .select('*') 
            .eq('project_id', projectId)
            .order('created_at', { ascending: true });

        if (tasksError) {
            console.error("Error al obtener tareas asociadas:", tasksError);
        }
        
        const dataToExport = {
            nombre: projectData.nombre,
            descripcion: projectData.descripcion,
            fecha_inicio: projectData.fecha_inicio,
            created_at: projectData.created_at, 
            
            tareas: tasksData ? tasksData.map(task => ({
                titulo: task.titulo,
                descripcion: task.descripcion,
                estado: task.estado,
                fecha_vencimiento: task.fecha_vencimiento,
                prioridad: task.prioridad,
            })) : [],
        };

        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        const safeName = projectName.replace(/[^a-zA-Z0-9]/g, '_');
        a.download = `proyecto_${safeName}_${new Date().toISOString().slice(0, 10)}.json`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert(`✅ Proyecto "${projectName}" exportado con éxito.`);
    };
    
    // --- EFECTOS Y CÁLCULOS ---

    useEffect(() => { loadProjectsFromLocalStorage(); fetchProjects() }, [])
    useEffect(() => { if (projects.length > 0) fetchTasksByProject(projects.map(p => p.id)) }, [projects])

    const getProjectStatus = (project) => {
        const tasks = tasksByProject[project.id] || [];
        if (tasks.length === 0) return 'pendiente';
        const completadas = tasks.filter(t => t.estado === 'completada').length;
        if (completadas === tasks.length) return 'completado';
        return 'activo';
    };

    let filteredProjects = projects;
    if (filter === 'activos') filteredProjects = projects.filter(p => getProjectStatus(p) === 'activo');
    if (filter === 'completados') filteredProjects = projects.filter(p => getProjectStatus(p) === 'completado');
    if (filter === 'pendiente') filteredProjects = projects.filter(p => getProjectStatus(p) === 'pendiente');

    const total = projects.length;
    const activos = projects.filter(p => getProjectStatus(p) === 'activo').length;
    const completados = projects.filter(p => getProjectStatus(p) === 'completado').length;
    const pendientes = projects.filter(p => getProjectStatus(p) === 'pendiente').length;


    return (
        <div style={{
            display: 'flex',
            width: '100vw',
            height: '100vh',
            background: COLORS.bg,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            color: COLORS.textMain
        }}>
            <style>{`
                body, html, #root { margin: 0; padding: 0; width: 100%; height: 100%; }
                * { box-sizing: border-box; }
                .project-card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border-color: ${COLORS.accent}; }
                .btn-create:hover { background-color: ${COLORS.accent} !important; transform: scale(1.05); }
                .action-btn {
                    width: 28px; height: 28px; border-radius: 6px; 
                    display: flex; align-items: center; justify-content: center;
                    border: none; cursor: pointer; transition: all 0.2s;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                }
                .action-btn:hover {
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    transform: scale(1.08);
                }
            `}</style>

            {/* --- SIDEBAR --- */}
            <aside style={{
                width: '350px', 
                background: COLORS.white,
                borderRight: `1px solid ${COLORS.border}`,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                flexShrink: 0,
                zIndex: 10
            }}>
                {/* Sidebar Header (Título, Contadores y Filtro) */}
                <div style={{ padding: '24px 20px', borderBottom: `1px solid ${COLORS.border}` }}>
                    
                    {/* Título de Proyectos */}
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: 16
                    }}>
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: COLORS.primary, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Layout size={20} color={COLORS.accent}/> Mis Proyectos
                        </h2>
                    </div>
                    
                    {/* Contadores de Proyectos (Total, Activos, Pendientes, Completados) */}
                    <div style={{ 
                        marginBottom: 20, 
                        padding: '12px 16px', 
                        background: COLORS.bg, 
                        borderRadius: '8px',
                        border: `1px solid ${COLORS.border}`
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: COLORS.textMain, marginBottom: 4 }}>
                            <span>Total de Proyectos:</span> <strong style={{color: COLORS.primary}}>{total}</strong>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center' }}>
                            <div style={{ padding: '4px 0', borderRadius: '4px', background: '#FEF3C7', color: '#B45309' }}>Activos: {activos}</div>
                            <div style={{ padding: '4px 0', borderRadius: '4px', background: '#DCFCE7', color: '#166534' }}>Comp: {completados}</div>
                            <div style={{ padding: '4px 0', borderRadius: '4px', background: '#F1F5F9', color: COLORS.textLight }}>Pend: {pendientes}</div>
                        </div>
                    </div>
                    
                    {/* Selector de Filtro Estilizado */}
                    <div style={{ position: 'relative' }}>
                        <button 
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            style={{
                                width: '100%', padding: '10px 12px', borderRadius: '8px',
                                border: `1px solid ${COLORS.border}`, background: COLORS.white,
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: COLORS.textMain,
                                transition: 'all 0.2s', boxShadow: dropdownOpen ? `0 0 0 2px ${COLORS.accent}1A` : 'none'
                            }}
                        >
                            <span style={{ textTransform: 'capitalize' }}>{filter}</span>
                            <ChevronDown size={16} color={COLORS.textLight} style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                        </button>
                        
                        {dropdownOpen && (
                            <div style={{
                                position: 'absolute', top: '110%', left: 0, width: '100%',
                                background: COLORS.white, border: `1px solid ${COLORS.border}`,
                                borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                zIndex: 20, overflow: 'hidden'
                            }}>
                                {['todos', 'pendiente', 'activos', 'completados'].map(opt => (
                                    <div 
                                        key={opt}
                                        onClick={() => { setFilter(opt); setDropdownOpen(false); }}
                                        style={{
                                            padding: '10px 14px', fontSize: '14px', cursor: 'pointer',
                                            background: filter === opt ? '#F1F5F9' : 'transparent',
                                            color: filter === opt ? COLORS.accent : COLORS.textMain,
                                            textTransform: 'capitalize'
                                        }}
                                    >
                                        {opt}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Lista de Proyectos (Scrollable) */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                    {filteredProjects.length === 0 && (
                        <p style={{ textAlign: 'center', color: COLORS.textLight, fontSize: '13px', marginTop: '20px' }}>No hay proyectos aquí.</p>
                    )}

                    {filteredProjects.map(project => {
                        const status = getProjectStatus(project);
                        let badgeBg = '#F1F5F9';
                        let badgeColor = COLORS.textLight;
                        if (status === 'completado') { badgeBg = '#DCFCE7'; badgeColor = '#166534'; }
                        if (status === 'activo') { badgeBg = '#FEF3C7'; badgeColor = '#B45309'; }

                        return (
                            <div 
                                key={project.id}
                                className="project-card"
                                onClick={() => navigate(`/project/${project.id}`)}
                                style={{
                                    background: COLORS.white, border: `1px solid ${COLORS.border}`,
                                    borderRadius: '12px', padding: '16px 20px', marginBottom: '12px',
                                    cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative',
                                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                                }}
                            >
                                
                                {/* Contenedor de Título y Estado */}
                                <div style={{ 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    flex: 1, 
                                    paddingRight: '12px'
                                }}>
                                    {/* Nombre del proyecto (manejo de texto largo) */}
                                    <span style={{ 
                                        fontWeight: 600, fontSize: '15px', color: COLORS.primary,
                                        minWidth: 0, 
                                        whiteSpace: 'nowrap', 
                                        overflow: 'hidden', 
                                        textOverflow: 'ellipsis',
                                        marginBottom: '6px'
                                    }}>
                                        {project.nombre}
                                    </span>
                                    
                                    {/* Badge de Estado */}
                                    <span style={{ 
                                        fontSize: '10px', fontWeight: 700, padding: '2px 8px', 
                                        borderRadius: '20px', background: badgeBg, color: badgeColor,
                                        textTransform: 'uppercase', alignSelf: 'flex-start' 
                                    }}>
                                        {status}
                                    </span>
                                </div>
                                
                                {/* CONTENEDOR DE ACCIONES (Vertical) */}
                                <div style={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    gap: '6px', 
                                    flexShrink: 0 
                                }}>
                                    
                                    {/* Botón de Exportar (Ícono con color COLORS.accent) */}
                                    <button
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            fetchProjectDetailsAndExport(project.id, project.nombre); 
                                        }}
                                        className="action-btn"
                                        style={{ background: 'transparent' , border: 'none', cursor: 'pointer', padding: 4 }}
                                        title={`Exportar ${project.nombre} completo (JSON)`}
                                    >
                                        <Folder size={20} color={COLORS.accent} /> 
                                    </button>
                                    
                                    {/* Botón eliminar (Ícono con color COLORS.highlight) */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                                        className="action-btn"
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4}}
                                        title="Eliminar Proyecto"
                                    >
                                        <Trash2 
                                            size={20} 
                                            color={COLORS.highlight} 
                                        />
                                    </button>
                                </div>
                                
                            </div>
                        )
                    })}
                </div>

                {/* Sidebar Footer */}
                <div style={{ 
                    padding: '16px 20px', borderTop: `1px solid ${COLORS.border}`, 
                    fontSize: '12px', color: COLORS.textLight, background: '#F8FAFC',
                    textAlign: 'center'
                }}>
                    <p style={{ margin: 0 }}>Gestor de Proyectos v1.0</p>
                </div>
            </aside>


            {/* --- MAIN CONTENT --- */}
            <main style={{
                flex: 1,
                background: `radial-gradient(circle at 10% 20%, #F1F5F9 0%, ${COLORS.white} 100%)`,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', position: 'relative', overflow: 'hidden'
            }}>
                {/* Decoración de fondo sutil */}
                <div style={{ position: 'absolute', top: -50, right: -50, width: 300, height: 300, background: 'rgba(0,85,164,0.03)', borderRadius: '50%' }}></div>
                <div style={{ position: 'absolute', bottom: -50, left: -50, width: 400, height: 400, background: 'rgba(239,65,53,0.03)', borderRadius: '50%' }}></div>

                <div style={{ textAlign: 'center', zIndex: 1, maxWidth: '600px', padding: '0 20px' }}>
                    
                    <div style={{ 
                        marginBottom: '32px', position: 'relative', display: 'inline-block'
                    }}>
                            <button
                            onClick={handleCreate}
                            className="btn-create"
                            style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                background: COLORS.highlight, border: 'none', color: 'white',
                                boxShadow: '0 10px 25px rgba(239, 65, 53, 0.4)', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                            }}
                        >
                            <Plus size={40} />
                        </button>
                    </div>

                    <h1 style={{ fontSize: '32px', fontWeight: 800, color: COLORS.primary, marginBottom: '12px', letterSpacing: '-0.5px' }}>
                        ¡Comienza Ahora!
                    </h1>
                    <p style={{ fontSize: '16px', color: COLORS.textLight, lineHeight: '1.6', marginBottom: '32px' }}>
                        Organiza tus tareas con eficiencia, o **importa proyectos** desde un archivo JSON para empezar rápidamente.
                    </p>

                    {/* Input de archivo oculto para la importación JSON */}
                    <input
                        type="file"
                        ref={fileInputRef} 
                        onChange={handleFileChange}
                        accept=".json" 
                        style={{ display: 'none' }} 
                    />

                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        
                        {/* BOTÓN 1: Crear Nuevo */}
                        <button
                            onClick={handleCreate}
                            style={{
                                padding: '12px 20px', background: COLORS.primary, color: 'white',
                                border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px',
                                cursor: 'pointer', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
                                display: 'flex', alignItems: 'center', gap: 8,
                            }}
                        >
                            <Plus size={16} /> Crear Proyecto
                        </button>
                        
                        {/* BOTÓN 2: Importar desde JSON Local (ÚNICO BOTÓN DE IMPORTACIÓN) */}
                        <button
                            onClick={handleImportClick} 
                            style={{
                                padding: '12px 20px', background: COLORS.white, color: COLORS.primary,
                                border: `1px solid ${COLORS.border}`, borderRadius: '8px', fontWeight: 600,
                                fontSize: '14px', cursor: 'pointer', transition: 'background 0.2s, border-color 0.2s',
                                display: 'flex', alignItems: 'center', gap: 8,
                            }}
                            onMouseOver={e => { e.currentTarget.style.borderColor = COLORS.accent; e.currentTarget.style.background = COLORS.bg; }}
                            onMouseOut={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.background = COLORS.white; }}
                            title="Importar proyectos desde un archivo JSON local"
                        >
                            <Upload size={16} /> Importar JSON
                        </button>
                        
                    </div>

                </div>
            </main>
        </div>
    )
}