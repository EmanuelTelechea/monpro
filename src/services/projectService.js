import { supabase } from '../supabase/client'; // ajustá si lo tenés en otro path

function hayInternet() {
  return window.navigator.onLine;
}

// LocalStorage helpers
function guardarProyectosLocal(proyectos) {
  localStorage.setItem('proyectos', JSON.stringify(proyectos));
}

function obtenerProyectosLocal() {
  return JSON.parse(localStorage.getItem('proyectos')) || [];
}

function guardarPendientesLocal(pendientes) {
  localStorage.setItem('pendientes', JSON.stringify(pendientes));
}

function obtenerPendientesLocal() {
  return JSON.parse(localStorage.getItem('pendientes')) || [];
}

// Cargar proyectos
export async function cargarProyectos(user_id) {
  if (hayInternet()) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      guardarProyectosLocal(data);
      return data;
    }
  }

  return obtenerProyectosLocal();
}

// Crear proyecto
export async function crearProyecto(proyecto) {
  if (hayInternet()) {
    const { data, error } = await supabase.from('projects').insert([proyecto]);

    if (!error && data) {
      const proyectos = obtenerProyectosLocal();
      proyectos.unshift(data[0]);
      guardarProyectosLocal(proyectos);
      return data[0];
    }
  }

  // Si offline, guardar como pendiente
  const pendientes = obtenerPendientesLocal();
  pendientes.push({ tipo: 'crear', proyecto });
  guardarPendientesLocal(pendientes);

  const proyectos = obtenerProyectosLocal();
  proyectos.unshift(proyecto);
  guardarProyectosLocal(proyectos);
  return proyecto;
}

// Editar proyecto
export async function editarProyecto(proyectoActualizado) {
  if (hayInternet()) {
    const { error } = await supabase
      .from('projects')
      .update(proyectoActualizado)
      .eq('id', proyectoActualizado.id);

    if (!error) {
      const proyectos = obtenerProyectosLocal().map(p =>
        p.id === proyectoActualizado.id ? proyectoActualizado : p
      );
      guardarProyectosLocal(proyectos);
      return true;
    }
  }


  const pendientes = obtenerPendientesLocal();
  pendientes.push({ tipo: 'editar', proyecto: proyectoActualizado });
  guardarPendientesLocal(pendientes);

  const proyectos = obtenerProyectosLocal().map(p =>
    p.id === proyectoActualizado.id ? proyectoActualizado : p
  );
  guardarProyectosLocal(proyectos);
  return true;
}

// Sincronizar cuando vuelve la conexión
export async function sincronizarPendientes() {
  const pendientes = obtenerPendientesLocal();
  if (!hayInternet() || pendientes.length === 0) return;

  for (const item of pendientes) {
    try {
      if (item.tipo === 'crear') {
        await supabase.from('projects').insert([item.proyecto]);
      } else if (item.tipo === 'editar') {
        await supabase
          .from('projects')
          .update(item.proyecto)
          .eq('id', item.proyecto.id);
      } else if (item.tipo === 'eliminar') {
        await supabase.from('projects').delete().eq('id', item.id);
      }
    } catch (error) {
      console.error('Error al sincronizar:', error);
    }
  }

  guardarPendientesLocal([]);
}

export async function eliminarProyecto(id) {
  if (hayInternet()) {
    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (!error) {
      // Actualizar localStorage removiendo el proyecto eliminado
      const proyectos = obtenerProyectosLocal().filter(p => p.id !== id);
      guardarProyectosLocal(proyectos);
      return true;
    } else {
      console.error('Error al eliminar:', error);
      return false;
    }
  }

  // Si está offline, guardar eliminación pendiente
  const pendientes = obtenerPendientesLocal();
  pendientes.push({ tipo: 'eliminar', id });
  guardarPendientesLocal(pendientes);

  // Actualizar localStorage local
  const proyectos = obtenerProyectosLocal().filter(p => p.id !== id);
  guardarProyectosLocal(proyectos);

  return true;
}

// Guardar edición offline (sin intentar conexión)
export async function guardarProyectoOffline(proyecto) {
  // Agregar el proyecto a pendientes tipo 'crear'
  const pendientes = obtenerPendientesLocal();
  pendientes.push({ tipo: 'crear', proyecto });
  guardarPendientesLocal(pendientes);

  // Guardar también en proyectos locales para mostrar inmediatamente
  const proyectos = obtenerProyectosLocal();
  proyectos.unshift(proyecto);
  guardarProyectosLocal(proyectos);

  return proyecto;
}
