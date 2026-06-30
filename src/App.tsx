import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, DayOfWeek, MasterClient, RouteAssignment, AssignedClient, ViewerOrderEntry } from './types';
import { Sidebar } from './components/Sidebar';
import { MapView } from './components/MapView';
import { PrintModal } from './components/PrintModal';
import {
  loadUsers, saveUsers,
  loadMasterClients, saveMasterClients,
  loadAssignments, setDayAssignments, saveAssignmentStatus,
  loadViewerOrders, saveViewerOrder,
  seedDemoData,
  mergeAssignments, applyViewerOrder,
  viewerDayToSellerDay
} from './utils/storage';
import { Map, List, RefreshCw, Columns, Layers, Loader2, AlertTriangle } from 'lucide-react';

function getSellerDay(viewerDay: DayOfWeek): DayOfWeek {
  return viewerDayToSellerDay[viewerDay] || viewerDay;
}

function toRoutePoints(clients: AssignedClient[]) {
  return clients.map(c => ({
    id: c.assignment_id,
    name: c.name,
    address: c.address,
    phone: c.phone,
    lat: c.lat,
    lng: c.lng,
    notes: c.notes,
    time: c.time,
    status: c.status
  }));
}

export const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [masterClients, setMasterClients] = useState<MasterClient[]>([]);
  const [assignments, setAssignments] = useState<RouteAssignment[]>([]);
  const [viewerOrders, setViewerOrders] = useState<ViewerOrderEntry[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Lunes');
  const [selectedViewerUserIds, setSelectedViewerUserIds] = useState<string[]>([]);

  const [activeEditingClient, setActiveEditingClient] = useState<Partial<MasterClient> | null>(null);
  const [isEditingNew, setIsEditingNew] = useState<boolean>(false);
  const [sidebarTab, setSidebarTab] = useState<'catalog' | 'route'>('route');

  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');
  const [splitView, setSplitView] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const initialized = useRef(false);

  const currentUser = users.find(u => u.id === selectedUserId);
  const isViewer = currentUser?.role === 'viewer';
  const splitUserIds = isViewer && selectedViewerUserIds.length >= 2
    ? selectedViewerUserIds
    : (selectedUserId ? [selectedUserId] : []);

  // ===== INIT =====
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function init() {
      setLoading(true);
      setError(null);
      try {
        let loadedUsers = await loadUsers();
        let loadedClients = await loadMasterClients();
        let loadedAssignments = await loadAssignments();

        if (loadedUsers.length === 0) {
          const demo = await seedDemoData();
          loadedUsers = demo.users;
          loadedClients = demo.clients;
          loadedAssignments = demo.assignments;
        }

        setUsers(loadedUsers);
        setMasterClients(loadedClients);
        setAssignments(loadedAssignments);

        if (loadedUsers.length > 0) {
          setSelectedUserId(loadedUsers[0].id);
          const first = loadedUsers.find(u => u.id === loadedUsers[0].id);
          if (first?.role === 'viewer') {
            setSelectedViewerUserIds(loadedUsers.filter(u => u.role === 'normal').map(u => u.id));
            setSelectedDay('Martes');
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al cargar datos';
        setError(msg);
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Load viewer orders when viewer is active
  useEffect(() => {
    if (!isViewer || !selectedDay) return;
    loadViewerOrders(selectedUserId, selectedDay)
      .then(setViewerOrders)
      .catch(console.error);
  }, [isViewer, selectedUserId, selectedDay]);

  // ===== SAVE EFFECTS (debounced) =====
  const prevUsersRef = useRef<string>('');
  useEffect(() => {
    const key = JSON.stringify(users);
    if (loading || key === prevUsersRef.current || users.length === 0) return;
    prevUsersRef.current = key;
    const t = setTimeout(() => saveUsers(users).catch(console.error), 300);
    return () => clearTimeout(t);
  }, [users, loading]);

  const prevClientsRef = useRef<string>('');
  useEffect(() => {
    const key = JSON.stringify(masterClients);
    if (loading || key === prevClientsRef.current || masterClients.length === 0) return;
    prevClientsRef.current = key;
    const t = setTimeout(() => saveMasterClients(masterClients).catch(console.error), 300);
    return () => clearTimeout(t);
  }, [masterClients, loading]);

  // ===== HELPERS =====
  const getAssignedForUserDay = useCallback((userId: string, day: DayOfWeek): AssignedClient[] => {
    const userAssignments = assignments.filter(a => a.user_id === userId && a.day === day);
    return mergeAssignments(userAssignments, masterClients);
  }, [assignments, masterClients]);

  const getActiveDayClients = useCallback((): AssignedClient[] => {
    if (!selectedUserId || !selectedDay) return [];
    const cu = users.find(u => u.id === selectedUserId);
    if (!cu) return [];

    if (cu.role === 'viewer') {
      const sellerDay = getSellerDay(selectedDay);
      let all: AssignedClient[] = [];
      selectedViewerUserIds.forEach(vuid => {
        all = all.concat(getAssignedForUserDay(vuid, sellerDay));
      });
      return applyViewerOrder(all, viewerOrders);
    }

    return getAssignedForUserDay(selectedUserId, selectedDay);
  }, [selectedUserId, selectedDay, users, getAssignedForUserDay, selectedViewerUserIds, viewerOrders]);

  // ===== CATALOG HANDLERS =====
  const handleAddClient = useCallback((client: MasterClient) => {
    setMasterClients(prev => [...prev, client]);
    setActiveEditingClient(null);
  }, []);

  const handleUpdateClient = useCallback((client: MasterClient) => {
    setMasterClients(prev => prev.map(c => c.id === client.id ? client : c));
    setActiveEditingClient(null);
  }, []);

  const handleDeleteClient = useCallback((clientId: string) => {
    setMasterClients(prev => prev.filter(c => c.id !== clientId));
    setAssignments(prev => prev.filter(a => a.client_id !== clientId));
    setActiveEditingClient(null);
  }, []);

  const handleReorderClients = useCallback((reordered: MasterClient[]) => {
    const updated = reordered.map((c, i) => ({ ...c, sort_order: i }));
    setMasterClients(updated);
  }, []);

  const handleNewClient = useCallback(() => {
    const maxOrder = masterClients.length > 0
      ? Math.max(...masterClients.map(c => c.sort_order)) + 1 : 0;
    setActiveEditingClient({
      id: `client-${Date.now()}`, name: '', lat: -26.82414, lng: -65.2226, sort_order: maxOrder
    });
    setIsEditingNew(true);
  }, [masterClients]);

  const handleEditClient = useCallback((client: MasterClient) => {
    setActiveEditingClient(client);
    setIsEditingNew(false);
  }, []);

  // ===== ASSIGNMENT HANDLERS =====
  const handleToggleClientAssignment = useCallback(async (clientId: string) => {
    if (!selectedUserId || isViewer) return;
    const current = assignments.filter(a => a.user_id === selectedUserId && a.day === selectedDay);
    const currentIds = current.map(a => a.client_id);
    const isAssigned = currentIds.includes(clientId);
    const newIds = isAssigned ? currentIds.filter(id => id !== clientId) : [...currentIds, clientId];

    await setDayAssignments(selectedUserId, selectedDay, newIds);
    const fresh = await loadAssignments();
    setAssignments(fresh);
  }, [assignments, selectedUserId, selectedDay, isViewer]);

  const handleAssignmentStatusChange = useCallback(async (assignmentId: string, status: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment || assignment.status === status) return;
    setAssignments(prev => prev.map(a => a.id === assignmentId
      ? { ...a, status: status as 'pending' | 'completed' | 'canceled' } : a));
    await saveAssignmentStatus(assignmentId, status).catch(console.error);
  }, [assignments]);

  // ===== REORDER HANDLERS =====
  const handleReorderRoute = useCallback(async (orderedClientIds: string[]) => {
    // Called when seller reorders their route
    if (!selectedUserId || !selectedDay || isViewer) return;

    // Optimistic update
    setAssignments(prev => prev.map(a => {
      if (a.user_id === selectedUserId && a.day === selectedDay) {
        const idx = orderedClientIds.indexOf(a.client_id);
        return { ...a, sort_order: idx >= 0 ? idx : a.sort_order };
      }
      return a;
    }));

    // Persist
    await setDayAssignments(selectedUserId, selectedDay, orderedClientIds);
  }, [selectedUserId, selectedDay, isViewer]);

  const handleReorderViewer = useCallback(async (orderedAssignmentIds: string[]) => {
    // Called when viewer reorders their aggregated view
    if (!isViewer || !selectedUserId) return;

    // Optimistic update
    const newOrders: ViewerOrderEntry[] = orderedAssignmentIds.map((aid, i) => ({
      viewer_id: selectedUserId,
      day: selectedDay,
      assignment_id: aid,
      sort_order: i
    }));
    setViewerOrders(newOrders);

    // Persist
    await saveViewerOrder(selectedUserId, selectedDay, orderedAssignmentIds);
  }, [isViewer, selectedUserId, selectedDay]);

  // ===== MAP / FORM HANDLERS =====
  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (!selectedUserId || isViewer) return;
    const maxOrder = masterClients.length > 0
      ? Math.max(...masterClients.map(c => c.sort_order)) + 1 : 0;
    setActiveEditingClient({ id: `client-${Date.now()}`, lat, lng, sort_order: maxOrder });
    setIsEditingNew(true);
    setSidebarTab('catalog');
    setMobileView('list');
  }, [selectedUserId, isViewer, masterClients]);

  const handleMarkerClick = useCallback((assignmentId: string) => {
    if (isViewer) return;
    const a = assignments.find(a => a.id === assignmentId);
    if (!a) return;
    const client = masterClients.find(c => c.id === a.client_id);
    if (!client) return;
    setActiveEditingClient(client);
    setIsEditingNew(false);
    setSidebarTab('catalog');
    setMobileView('list');
  }, [isViewer, assignments, masterClients]);

  const handleSaveClientForm = useCallback((client: MasterClient) => {
    if (isEditingNew) handleAddClient(client);
    else handleUpdateClient(client);
  }, [isEditingNew, handleAddClient, handleUpdateClient]);

  // ===== USER HANDLERS =====
  const handleAddUser = useCallback((name: string, role: 'normal' | 'viewer' = 'normal') => {
    const newUser: User = { id: `user-${Date.now()}`, name, role };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    const activeUser = users.find(u => u.id === selectedUserId);
    if (activeUser?.role !== 'viewer') setSelectedUserId(newUser.id);
    if (role === 'viewer' || activeUser?.role === 'viewer') {
      setSelectedViewerUserIds(updatedUsers.filter(u => u.role === 'normal').map(u => u.id));
    }
    setActiveEditingClient(null);
  }, [users, selectedUserId]);

  const handleEditUser = useCallback((userId: string, name: string, role: 'normal' | 'viewer') => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, name, role } : u));
  }, []);

  const handleDeleteUser = useCallback((userIdToDelete: string) => {
    const updatedUsers = users.filter(u => u.id !== userIdToDelete);
    setUsers(updatedUsers);
    setAssignments(prev => prev.filter(a => a.user_id !== userIdToDelete));
    if (updatedUsers.length > 0) setSelectedUserId(updatedUsers[0].id);
    else setSelectedUserId('');
    setActiveEditingClient(null);
  }, [users]);

  const handleDaySelect = useCallback((day: DayOfWeek) => {
    setSelectedDay(day);
    setActiveEditingClient(null);
  }, []);

  const handleUserSelect = useCallback((id: string) => {
    setSelectedUserId(id);
    setActiveEditingClient(null);
    const user = users.find(u => u.id === id);
    if (user?.role === 'viewer') {
      setSelectedViewerUserIds(users.filter(u => u.role === 'normal').map(u => u.id));
      setSelectedDay('Martes');
    } else {
      setSelectedViewerUserIds([]);
      setSelectedDay('Lunes');
    }
  }, [users]);

  // ===== RESET =====
  const handleResetApp = useCallback(async () => {
    if (!confirm('¿Deseas restablecer la aplicación con los datos de demostración originales?')) return;
    setSeeding(true);
    setError(null);
    try {
      const demo = await seedDemoData();
      setUsers(demo.users);
      setMasterClients(demo.clients);
      setAssignments(demo.assignments);
      setViewerOrders([]);
      setSelectedUserId(demo.users[0].id);
      setSelectedDay('Lunes');
      setSelectedViewerUserIds([]);
      setActiveEditingClient(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al restablecer datos';
      setError(msg);
    } finally { setSeeding(false); }
  }, []);

  // ===== PRINT =====
  const handleOpenPrint = useCallback(() => setShowPrintModal(true), []);
  const handleClosePrint = useCallback(() => setShowPrintModal(false), []);

  // ===== RENDER =====
  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400 text-sm font-medium">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-900 p-8">
        <div className="text-center max-w-md">
          <AlertTriangle size={40} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-white font-bold text-lg mb-2">Error de conexión</h2>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">Reintentar</button>
          <p className="text-gray-600 text-xs mt-4">Verificá las variables de entorno.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col md:flex-row bg-gray-900 overflow-hidden font-sans">
      <button onClick={handleResetApp} disabled={seeding}
        className="absolute bottom-4 left-4 md:left-auto md:right-[200px] z-[2000] bg-gray-800/90 text-gray-400 hover:text-white hover:bg-gray-700 p-2.5 rounded-full shadow-lg border border-gray-700 transition-all flex items-center justify-center disabled:opacity-50"
        title="Restaurar datos demo">
        <RefreshCw size={15} className={seeding ? 'animate-spin' : ''} />
      </button>

      <div className={`print-hidden h-full ${mobileView === 'list' ? 'flex' : 'hidden md:flex'} w-full md:w-auto shrink-0`}>
        <Sidebar
          users={users}
          selectedUserId={selectedUserId}
          onSelectUser={handleUserSelect}
          onAddUser={handleAddUser}
          onEditUser={handleEditUser}
          onDeleteUser={handleDeleteUser}
          selectedViewerUserIds={selectedViewerUserIds}
          onToggleViewerUser={(uid) => setSelectedViewerUserIds(prev =>
            prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
          )}
          selectedDay={selectedDay}
          onSelectDay={handleDaySelect}
          activeClients={getActiveDayClients()}
          activeEditingClient={activeEditingClient}
          isEditingNew={isEditingNew}
          onStatusChange={handleAssignmentStatusChange}
          onSaveClientForm={handleSaveClientForm}
          onCancelClientForm={() => setActiveEditingClient(null)}
          sidebarTab={sidebarTab}
          onSidebarTabChange={setSidebarTab}
          masterClients={masterClients}
          assignments={assignments}
          onNewClient={handleNewClient}
          onEditClient={handleEditClient}
          onDeleteClient={handleDeleteClient}
          onReorderClients={handleReorderClients}
          onToggleClientAssignment={handleToggleClientAssignment}
          onReorderRoute={handleReorderRoute}
          onReorderViewer={handleReorderViewer}
          onOpenPrint={handleOpenPrint}
        />
      </div>

      <div className={`flex-1 h-full relative ${mobileView === 'map' ? 'block' : 'hidden md:block'}`}>
        {splitView && splitUserIds.length >= 2 ? (
          <div className="flex flex-col md:flex-row h-full w-full">
            {splitUserIds.map((uid, idx) => {
              const day = isViewer ? getSellerDay(selectedDay) : selectedDay;
              const userPoints = toRoutePoints(getAssignedForUserDay(uid, day));
              const user = users.find(u => u.id === uid);
              return (
                <div key={uid} className="flex-1 relative min-w-0 border-b md:border-b-0 md:border-r border-gray-700 last:border-0">
                  <div className="absolute top-2 left-2 z-[1000] bg-gray-900/85 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-md border border-gray-700 shadow-lg flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {user?.name || 'Sin nombre'}
                  </div>
                  <MapView points={userPoints} onMapClick={(lat, lng) => { setSelectedUserId(uid); handleMapClick(lat, lng); }}
                    onMarkerClick={(p) => handleMarkerClick(p.id)} tempNewPoint={null}
                    onStatusChange={(pid, s) => handleAssignmentStatusChange(pid, s)} />
                </div>
              );
            })}
          </div>
        ) : (
          <MapView points={toRoutePoints(getActiveDayClients())} onMapClick={handleMapClick}
            onMarkerClick={(p) => handleMarkerClick(p.id)} tempNewPoint={null}
            onStatusChange={handleAssignmentStatusChange} />
        )}

        {isViewer && selectedViewerUserIds.length >= 2 && (
          <button onClick={() => setSplitView(v => !v)}
            className="absolute top-4 right-4 md:right-16 z-[1000] bg-white hover:bg-gray-100 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg shadow-md border border-gray-200 transition-all flex items-center gap-1.5 text-xs font-bold"
            title={splitView ? 'Vista combinada' : 'Vista dividida'}>
            {splitView ? <Layers size={14} /> : <Columns size={14} />}
            <span className="hidden sm:inline">{splitView ? 'Combinar' : 'Dividir'}</span>
          </button>
        )}
      </div>

      <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-[3000] flex bg-gray-900/95 backdrop-blur border border-gray-800 p-1 rounded-full shadow-2xl">
        <button onClick={() => setMobileView('map')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${mobileView === 'map' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}>
          <Map size={14} /> Ver Mapa</button>
        <button onClick={() => setMobileView('list')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${mobileView === 'list' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}>
          <List size={14} /> Agenda</button>
      </div>

      {showPrintModal && (
        <PrintModal
          users={users}
          masterClients={masterClients}
          assignments={assignments}
          onClose={handleClosePrint}
        />
      )}
    </div>
  );
};
export default App;
