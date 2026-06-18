import { User, DayOfWeek, MasterClient, RouteAssignment, AssignedClient, ViewerOrderEntry } from '../types';
import { supabase } from './supabase';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
];

export const VIEWER_DAYS: DayOfWeek[] = ['Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const viewerDayToSellerDay: Record<string, DayOfWeek> = {
  'Martes': 'Lunes',
  'Miércoles': 'Martes',
  'Jueves': 'Miércoles',
  'Viernes': 'Jueves',
  'Sábado': 'Viernes'
};

// =============================================================
// USERS
// =============================================================

export const loadUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('users').select('*').order('id');
  if (error) throw new Error(`Error al cargar usuarios: ${error.message}`);
  return data || [];
};

export const saveUsers = async (users: User[]): Promise<void> => {
  const { data: existing } = await supabase.from('users').select('id');
  const existingIds = new Set((existing || []).map(u => u.id));
  const currentIds = new Set(users.map(u => u.id));

  const toDelete = (existing || []).filter(u => !currentIds.has(u.id));
  const toInsert = users.filter(u => !existingIds.has(u.id));

  if (toDelete.length > 0) {
    await supabase.from('users').delete().in('id', toDelete.map(u => u.id));
  }
  for (const user of users.filter(u => existingIds.has(u.id))) {
    await supabase.from('users').update(user).eq('id', user.id);
  }
  if (toInsert.length > 0) {
    await supabase.from('users').insert(toInsert);
  }
};

// =============================================================
// MASTER CLIENTS
// =============================================================

export const loadMasterClients = async (): Promise<MasterClient[]> => {
  const { data, error } = await supabase.from('master_clients').select('*').order('sort_order');
  if (error) throw new Error(`Error al cargar catálogo: ${error.message}`);
  return data || [];
};

export const saveMasterClients = async (clients: MasterClient[]): Promise<void> => {
  const { data: existing } = await supabase.from('master_clients').select('id');
  const existingIds = new Set((existing || []).map(c => c.id));
  const currentIds = new Set(clients.map(c => c.id));

  const toDelete = (existing || []).filter(c => !currentIds.has(c.id));
  if (toDelete.length > 0) {
    await supabase.from('master_clients').delete().in('id', toDelete.map(c => c.id));
  }
  for (const c of clients.filter(c => existingIds.has(c.id))) {
    await supabase.from('master_clients').update(c).eq('id', c.id);
  }
  if (clients.filter(c => !existingIds.has(c.id)).length > 0) {
    await supabase.from('master_clients').insert(clients.filter(c => !existingIds.has(c.id)));
  }
};

// =============================================================
// ROUTE ASSIGNMENTS
// =============================================================

export const loadAssignments = async (): Promise<RouteAssignment[]> => {
  const { data, error } = await supabase.from('route_assignments').select('*');
  if (error) throw new Error(`Error al cargar asignaciones: ${error.message}`);
  return data || [];
};

export const saveAssignmentStatus = async (assignmentId: string, status: string): Promise<void> => {
  const { error } = await supabase.from('route_assignments').update({ status }).eq('id', assignmentId);
  if (error) throw new Error(`Error al actualizar estado: ${error.message}`);
};

export const setDayAssignments = async (userId: string, day: DayOfWeek, clientIds: string[]): Promise<void> => {
  const { data: existing } = await supabase
    .from('route_assignments')
    .select('*')
    .eq('user_id', userId)
    .eq('day', day);

  const existingClientIds = new Set((existing || []).map(a => a.client_id));
  const newClientIds = new Set(clientIds);

  const toDelete = (existing || []).filter(a => !newClientIds.has(a.client_id));
  const toInsert = clientIds.filter(id => !existingClientIds.has(id));

  if (toDelete.length > 0) {
    await supabase.from('route_assignments').delete().in('id', toDelete.map(a => a.id));
  }

  if (toInsert.length > 0) {
    const rows = toInsert.map(client_id => ({
      id: `assign-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      user_id: userId,
      day,
      client_id,
      status: 'pending',
      sort_order: clientIds.indexOf(client_id)
    }));
    await supabase.from('route_assignments').insert(rows);
  }

  // Update all sort_orders for this user/day
  for (let i = 0; i < clientIds.length; i++) {
    await supabase
      .from('route_assignments')
      .update({ sort_order: i })
      .eq('user_id', userId)
      .eq('day', day)
      .eq('client_id', clientIds[i]);
  }
};

// =============================================================
// VIEWER ORDERS
// =============================================================

export const loadViewerOrders = async (viewerId: string, day: string): Promise<ViewerOrderEntry[]> => {
  const { data, error } = await supabase
    .from('viewer_route_orders')
    .select('*')
    .eq('viewer_id', viewerId)
    .eq('day', day)
    .order('sort_order');
  if (error) throw new Error(`Error al cargar orden de fletero: ${error.message}`);
  return data || [];
};

export const saveViewerOrder = async (viewerId: string, day: string, orderedAssignmentIds: string[]): Promise<void> => {
  await supabase.from('viewer_route_orders').delete().eq('viewer_id', viewerId).eq('day', day);

  if (orderedAssignmentIds.length > 0) {
    const rows = orderedAssignmentIds.map((assignmentId, i) => ({
      viewer_id: viewerId,
      day,
      assignment_id: assignmentId,
      sort_order: i
    }));
    const { error } = await supabase.from('viewer_route_orders').insert(rows);
    if (error) throw new Error(`Error al guardar orden de fletero: ${error.message}`);
  }
};

export const deleteViewerOrdersForUser = async (userId: string): Promise<void> => {
  // delete where viewer_id matches the user being deleted
  await supabase.from('viewer_route_orders').delete().eq('viewer_id', userId);
};

// =============================================================
// MERGE HELPERS
// =============================================================

export function mergeAssignments(assignments: RouteAssignment[], clients: MasterClient[]): AssignedClient[] {
  const clientMap = new Map(clients.map(c => [c.id, c]));
  return assignments
    .map(a => {
      const client = clientMap.get(a.client_id);
      if (!client) return null;
      return {
        ...client,
        assignment_id: a.id,
        user_id: a.user_id,
        day: a.day as DayOfWeek,
        status: a.status,
        assignment_order: a.sort_order
      };
    })
    .filter((a): a is AssignedClient => a !== null)
    .sort((a, b) => a.assignment_order - b.assignment_order);
}

export function applyViewerOrder(clients: AssignedClient[], viewerOrders: ViewerOrderEntry[]): AssignedClient[] {
  if (viewerOrders.length === 0) return clients;

  const orderMap = new Map(viewerOrders.map(o => [o.assignment_id, o.sort_order]));
  const sorted = [...clients].sort((a, b) => {
    const aOrder = orderMap.get(a.assignment_id);
    const bOrder = orderMap.get(b.assignment_id);
    if (aOrder !== undefined && bOrder !== undefined) return aOrder - bOrder;
    if (aOrder !== undefined) return -1;
    if (bOrder !== undefined) return 1;
    return a.assignment_order - b.assignment_order;
  });
  return sorted;
}

// =============================================================
// SEED
// =============================================================

const SEED_CLIENTS: MasterClient[] = [
  { id: 'client-1', name: 'Plaza Independencia (Gobierno)', address: '25 de Mayo 90', lat: -26.82414, lng: -65.2226, notes: 'Retirar firmas y orden de pago en administración.', time: '08:30', sort_order: 0 },
  { id: 'client-2', name: 'Mercado del Norte', address: 'Maipú 200', lat: -26.8265, lng: -65.2230, notes: 'Entregar caja de repuestos y cobrar factura #3401.', time: '10:00', sort_order: 1 },
  { id: 'client-3', name: 'Casa Histórica', address: 'Congreso 141', lat: -26.8306, lng: -65.2220, notes: 'Visita técnica para evaluar nueva instalación de filtros.', time: '11:45', sort_order: 2 },
  { id: 'client-4', name: 'Terminal de Ómnibus', address: 'Av. Brígido Terán 250', lat: -26.8315, lng: -65.1945, notes: 'Despachar encomienda urgente para sucursal Concepción.', time: '13:00', sort_order: 3 },
  { id: 'client-5', name: 'Parque Centenario 9 de Julio', address: 'Av. Soldati 400', lat: -26.8250, lng: -65.1980, notes: 'Mantenimiento preventivo en bombas de agua del lago.', time: '09:00', sort_order: 4 },
  { id: 'client-6', name: 'Sanatorio 9 de Julio', address: '25 de Mayo 350', lat: -26.8220, lng: -65.2235, notes: 'Entrega de insumos descartables de alta prioridad.', time: '09:15', sort_order: 5 },
  { id: 'client-7', name: 'Plaza Urquiza', address: 'Muñecas 800', lat: -26.8175, lng: -65.2095, notes: 'Reunión comercial en cafetería de la esquina con cliente mayorista.', time: '11:00', sort_order: 6 }
];

const SEED_USERS: User[] = [
  { id: 'user-1', name: 'Carlos Gómez (Vendedor Sur)', role: 'normal' },
  { id: 'user-2', name: 'Lucía Paz (Distribución Centro)', role: 'normal' },
  { id: 'user-3', name: 'Supervisor General (Fletero)', role: 'viewer' }
];

export const seedDemoData = async (): Promise<{
  users: User[];
  clients: MasterClient[];
  assignments: RouteAssignment[];
}> => {
  await supabase.from('users').insert(SEED_USERS);
  await supabase.from('master_clients').insert(SEED_CLIENTS);

  const assignments: RouteAssignment[] = [
    { id: 'assign-1', user_id: 'user-1', day: 'Lunes', client_id: 'client-1', status: 'completed', sort_order: 0 },
    { id: 'assign-2', user_id: 'user-1', day: 'Lunes', client_id: 'client-2', status: 'pending', sort_order: 1 },
    { id: 'assign-3', user_id: 'user-1', day: 'Lunes', client_id: 'client-3', status: 'pending', sort_order: 2 },
    { id: 'assign-4', user_id: 'user-1', day: 'Lunes', client_id: 'client-4', status: 'pending', sort_order: 3 },
    { id: 'assign-5', user_id: 'user-1', day: 'Martes', client_id: 'client-5', status: 'pending', sort_order: 0 },
    { id: 'assign-6', user_id: 'user-2', day: 'Lunes', client_id: 'client-6', status: 'pending', sort_order: 0 },
    { id: 'assign-7', user_id: 'user-2', day: 'Lunes', client_id: 'client-7', status: 'completed', sort_order: 1 }
  ];

  await supabase.from('route_assignments').insert(assignments);
  return { users: SEED_USERS, clients: SEED_CLIENTS, assignments };
};
