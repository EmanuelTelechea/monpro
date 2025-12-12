import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase/client'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, ChevronDown, Folder, Layout, Upload } from 'lucide-react'
import { format, isBefore, subMonths, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export default function ProjectsPage({ session }) {
    const [projects, setProjects] = useState([])
    const [tasksByProject, setTasksByProject] = useState({})
    const [filter, setFilter] = useState('todos')
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [allTasks, setAllTasks] = useState([]); // Nuevo estado para todas las tareas
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
        // 💡 AGREGADO: fecha_fin
        const { data, error } = await supabase
            .from('projects')
            .select('*, fecha_fin') 
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
        if (!projectIds.length) {
            setTasksByProject({});
            setAllTasks([]);
            return;
        }
        
        console.log("DEBUG: Buscando tareas para proyectos:", projectIds);
        
        // 💡 AGREGADO: fecha_limite en la consulta
        const { data, error } = await supabase
            .from('tasks')
            .select('id, project_id, estado, titulo, fecha_limite') // <-- AÑADIR fecha_limite
            .in('project_id', projectIds);

        if (error) {
            console.error('Error fetching tasks:', error);
            alert(`Error al cargar tareas: ${error.message}`);
            return;
        }

        console.log("DEBUG: Tareas encontradas:", data);

        const grouped = {};
        projectIds.forEach(pid => grouped[pid] = []);
        
        data.forEach(task => {
            if (grouped[task.project_id]) {
                grouped[task.project_id].push(task);
            }
        });
        
        console.log("DEBUG: Tareas agrupadas:", grouped);
        setTasksByProject(grouped);
        
        // 💡 FILTRAR solo tareas no completadas con fecha_limite
        setAllTasks(data.filter(t => t.estado !== 'completada' && t.fecha_limite));
    };

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
            fecha_fin: p.fecha_fin || null, // 💡 AGREGADO: fecha_fin en importación
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
            fecha_fin: projectData.fecha_fin,
            created_at: projectData.created_at, 
            
            tareas: tasksData ? tasksData.map(task => ({
                titulo: task.titulo,
                descripcion: task.descripcion,
                estado: task.estado,
                fecha_limite: task.fecha_limite, // <-- QUITAR espacio extra
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
    
    // --- LÓGICA DE CÁLCULOS Y ESTADOS ---

    useEffect(() => { 
        loadProjectsFromLocalStorage(); 
        fetchProjects() 
    }, []);

    useEffect(() => { 
        if (projects.length > 0) {
            console.log("DEBUG: Proyectos cargados, buscando tareas...");
            fetchTasksByProject(projects.map(p => p.id));
        }
    }, [projects]); 

    const getProjectStatus = (project) => {
        const tasks = tasksByProject[project.id] || [];
        if (tasks.length === 0) return 'pendiente';
        const completadas = tasks.filter(t => t.estado === 'completada').length;
        if (completadas === tasks.length) return 'completado';
        return 'activo';
    };
    
    const getProjectProgress = (project) => {
        const tasks = tasksByProject[project.id] || [];
        
        // DEBUG TEMPORAL
        console.log(`Proyecto ${project.id} - ${project.nombre}:`, {
            tareas: tasks,
            longitud: tasks.length,
            completadas: tasks.filter(t => t.estado === 'completada').length
        });
        
        if (tasks.length === 0) return 0;
        
        const completadas = tasks.filter(t => t.estado === 'completada').length;
        return Math.round((completadas / tasks.length) * 100);
    };

    // 💡 NUEVA FUNCIÓN: Calcula y ordena las alertas de proximidad
    const getProximityAlerts = () => {
        const now = new Date();
        const oneMonthFromNow = subMonths(now, -1); // Un mes en el futuro
        const alerts = [];

        // 1. Tareas con fecha de vencimiento próxima (menos de 1 mes)
        for (const task of allTasks) {
            if (task.fecha_limite) { // <-- QUITAR el espacio extra
                const dueDate = parseISO(task.fecha_limite);
                if (isBefore(dueDate, oneMonthFromNow) && isBefore(now, dueDate)) {
                    const project = projects.find(p => p.id === task.project_id);
                    alerts.push({
                        type: 'tarea',
                        date: dueDate,
                        title: task.titulo,
                        project: project ? project.nombre : 'Proyecto desconocido',
                        dateString: format(dueDate, 'PP', { locale: es }),
                    });
                }
            }
        }

        // 2. Proyectos con fecha de fin próxima (menos de 1 mes)
        for (const project of projects) {
            if (project.fecha_fin && getProjectStatus(project) !== 'completado') {
                const endDate = parseISO(project.fecha_fin);
                if (isBefore(endDate, oneMonthFromNow) && isBefore(now, endDate)) {
                    alerts.push({
                        type: 'proyecto',
                        date: endDate,
                        title: project.nombre,
                        dateString: format(endDate, 'PP', { locale: es }),
                    });
                }
            }
        }

        // 3. Ordenar por proximidad (fecha más cercana primero)
        alerts.sort((a, b) => a.date - b.date);

        return alerts;
    };


    let filteredProjects = projects;
    if (filter === 'activos') filteredProjects = projects.filter(p => getProjectStatus(p) === 'activo');
    if (filter === 'completados') filteredProjects = projects.filter(p => getProjectStatus(p) === 'completado');
    if (filter === 'pendiente') filteredProjects = projects.filter(p => getProjectStatus(p) === 'pendiente');

    const total = projects.length;
    const activos = projects.filter(p => getProjectStatus(p) === 'activo').length;
    const completados = projects.filter(p => getProjectStatus(p) === 'completado').length;
    const pendientes = projects.filter(p => getProjectStatus(p) === 'pendiente').length;

    const proximityAlerts = getProximityAlerts(); // 💡 CALCULAR ALERTAS

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

            {/* --- SIDEBAR --- (Sin cambios relevantes en estructura) */}
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
                        const progress = getProjectProgress(project); 

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
                                
                                {/* Contenedor de Título, Progreso y Estado */}
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
                                    
                                    {/* BARRA DE PROGRESO */}
                                    <div style={{ marginTop: '8px', width: '100%', marginBottom: '8px' }}>
                                        {/* Barra de Progreso */}
                                        <div style={{ 
                                            height: '6px', borderRadius: '3px', background: COLORS.bg, 
                                            border: `1px solid ${COLORS.border}`, marginBottom: '4px' 
                                        }}>
                                            <div style={{
                                                height: '100%', width: `${progress}%`, 
                                                background: progress === 100 ? '#16A34A' : COLORS.accent, 
                                                borderRadius: 'inherit', transition: 'width 0.5s ease-out'
                                            }}></div>
                                        </div>
                                        {/* Porcentaje */}
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: COLORS.textLight }}>
                                            Progreso: <strong style={{color: COLORS.primary}}>{progress}%</strong>
                                        </span>
                                    </div>
                                    {/* FIN BARRA DE PROGRESO */}


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
                                    
                                    {/* Botón de Exportar */}
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
                                    
                                    {/* Botón eliminar */}
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


            {/* --- MAIN CONTENT (MODIFICADO para mostrar alertas) --- */}
            <main style={{
                flex: 1,
                padding: '40px',
                overflowY: 'auto',
                background: COLORS.bg,
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
            }}>
                
                {/* 💡 SECCIÓN DE ALERTAS DE PROXIMIDAD - CON SCROLL PROPIO */}
                <section style={{
                    flex: '0 0 auto',
                    marginBottom: '40px'
                }}>
                    <h2 style={{ 
                        fontSize: '24px', 
                        fontWeight: 700, 
                        color: COLORS.highlight, 
                        marginBottom: '20px', 
                        borderBottom: `2px solid ${COLORS.highlight}`, 
                        paddingBottom: '8px' 
                    }}>
                        🔔 Alertas de Proximidad ({proximityAlerts.length})
                    </h2>
                    
                    {proximityAlerts.length === 0 ? (
                        <div style={{ 
                            padding: '30px', 
                            background: COLORS.white, 
                            borderRadius: '12px', 
                            textAlign: 'center', 
                            border: `1px solid ${COLORS.border}` 
                        }}>
                            <p style={{ margin: 0, color: COLORS.textLight }}>
                                No hay tareas ni proyectos con fechas de vencimiento en el próximo mes.
                            </p>
                        </div>
                    ) : (
                        <div style={{ 
                            maxHeight: '300px', // Altura máxima para las alertas
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            paddingRight: '8px' // Espacio para el scrollbar
                        }}>
                            {proximityAlerts.map((alert, index) => (
                                <div 
                                    key={index}
                                    style={{
                                        padding: '16px 20px', 
                                        background: alert.type === 'tarea' ? '#FFFBEB' : '#F0F9FF',
                                        border: `1px solid ${alert.type === 'tarea' ? '#FBBF24' : '#3B82F6'}`,
                                        borderRadius: '8px', 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        flexShrink: 0 // Para que no se compriman
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: COLORS.primary }}>
                                            {alert.type === 'tarea' ? `Tarea: ${alert.title}` : `Proyecto: ${alert.title}`}
                                        </p>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: COLORS.textLight }}>
                                            {alert.type === 'tarea' ? 
                                                `Proyecto asociado: ${alert.project}` : 
                                                <strong style={{color: COLORS.accent}}>¡Fecha de fin de proyecto!</strong>
                                            }
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '16px' }}>
                                        <span style={{ 
                                            fontSize: '12px', 
                                            fontWeight: 700, 
                                            padding: '4px 8px', 
                                            borderRadius: '4px',
                                            background: COLORS.highlight, 
                                            color: COLORS.white 
                                        }}>
                                            {alert.dateString}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* SECCIÓN DE CREAR E IMPORTAR - VISIBLE SIEMPRE */}
                <div style={{ 
                    borderTop: `1px dashed ${COLORS.border}`, 
                    paddingTop: '40px',
                    flex: '0 0 auto', // No crece, tamaño fijo
                    marginTop: 'auto', // Empuja hacia abajo si hay espacio
                    marginBottom: '100px'
                }}>
                    <h2 style={{ 
                        fontSize: '24px', 
                        fontWeight: 700, 
                        color: COLORS.primary, 
                        marginBottom: '20px', 
                        textAlign: 'center' 
                    }}>
                        Crear e Importar
                    </h2>
                    <div style={{ 
                        textAlign: 'center', 
                        zIndex: 1, 
                        maxWidth: '600px', 
                        padding: '0 20px', 
                        margin: '0 auto' 
                    }}>
                        
                        {/* BOTÓN CIRCULAR CENTRAL */}
                        <div style={{ 
                            marginBottom: '32px', 
                            position: 'relative', 
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <button
                                onClick={handleCreate}
                                className="btn-create"
                                style={{
                                    width: '80px', 
                                    height: '80px', 
                                    borderRadius: '50%',
                                    background: COLORS.highlight, 
                                    border: 'none', 
                                    color: 'white',
                                    boxShadow: '0 10px 25px rgba(239, 65, 53, 0.4)', 
                                    cursor: 'pointer',
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                }}
                            >
                                <Plus size={40} />
                            </button>
                        </div>

                        <p style={{ 
                            fontSize: '16px', 
                            color: COLORS.textLight, 
                            lineHeight: '1.6', 
                            marginBottom: '32px',
                            textAlign: 'center'
                        }}>
                            Organiza tus tareas con eficiencia, o <strong>importa proyectos</strong> desde un archivo JSON para empezar rápidamente.
                        </p>

                        {/* Input de archivo oculto para la importación JSON */}
                        <input
                            type="file"
                            ref={fileInputRef} 
                            onChange={handleFileChange}
                            accept=".json" 
                            style={{ display: 'none' }} 
                        />

                        {/* CONTENEDOR DE BOTONES */}
                        <div style={{ 
                            display: 'flex', 
                            gap: '16px', 
                            justifyContent: 'center', 
                            flexWrap: 'wrap',
                            width: '1   00%'
                            
                        }}>
                            
                            {/* BOTÓN 1: Crear Nuevo */}
                            <button
                                onClick={handleCreate}
                                style={{
                                    padding: '12px 24px', // Aumentado el padding
                                    background: COLORS.primary, 
                                    color: 'white',
                                    border: 'none', 
                                    borderRadius: '8px', 
                                    fontWeight: 600, 
                                    fontSize: '14px',
                                    cursor: 'pointer', 
                                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 8,
                                    minWidth: '160px', // Ancho mínimo
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseOver={e => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 15px rgba(15, 23, 42, 0.3)';
                                }}
                                onMouseOut={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.2)';
                                }}
                            >
                                <Plus size={16} /> Crear Proyecto
                            </button>
                            
                            {/* BOTÓN 2: Importar desde JSON */}
                            <button
                                onClick={handleImportClick} 
                                style={{
                                    padding: '12px 24px', // Aumentado el padding
                                    background: COLORS.white, 
                                    color: COLORS.primary,
                                    border: `2px solid ${COLORS.border}`, // Borde más grueso
                                    borderRadius: '8px', 
                                    fontWeight: 600,
                                    fontSize: '14px', 
                                    cursor: 'pointer', 
                                    transition: 'all 0.2s ease',
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 8,
                                    minWidth: '160px', // Ancho mínimo
                                    justifyContent: 'center'
                                }}
                                onMouseOver={e => { 
                                    e.currentTarget.style.borderColor = COLORS.accent; 
                                    e.currentTarget.style.background = COLORS.bg; 
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 15px rgba(0, 85, 164, 0.15)';
                                }}
                                onMouseOut={e => { 
                                    e.currentTarget.style.borderColor = COLORS.border; 
                                    e.currentTarget.style.background = COLORS.white; 
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                                title="Importar proyectos desde un archivo JSON local"
                            >
                                <Upload size={16} /> Importar JSON
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}