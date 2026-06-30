import React, { useState, useMemo, useCallback } from 'react';
import { User, DayOfWeek, MasterClient, RouteAssignment, AssignedClient } from '../types';
import { DAYS_OF_WEEK, viewerDayToSellerDay } from '../utils/storage';
import { ClientForm } from './ClientForm';
import { CatalogTab } from './CatalogTab';
import { RouteTab } from './RouteTab';
import { ViewerTab } from './ViewerTab';
import { Plus, Users, MapPin, ChevronDown, Edit2, Trash2, Check, X, Printer } from 'lucide-react';

interface SidebarProps {
  users: User[];
  selectedUserId: string;
  onSelectUser: (id: string) => void;
  onAddUser: (name: string, role: 'normal' | 'viewer') => void;
  onEditUser: (id: string, name: string, role: 'normal' | 'viewer') => void;
  onDeleteUser: (id: string) => void;
  selectedViewerUserIds: string[];
  onToggleViewerUser: (id: string) => void;
  selectedDay: DayOfWeek;
  onSelectDay: (day: DayOfWeek) => void;
  activeClients: AssignedClient[];
  activeEditingClient: Partial<MasterClient> | null;
  isEditingNew: boolean;
  onStatusChange: (assignmentId: string, status: string) => void;
  onSaveClientForm: (client: MasterClient) => void;
  onCancelClientForm: () => void;
  sidebarTab: 'catalog' | 'route';
  onSidebarTabChange: (tab: 'catalog' | 'route') => void;
  masterClients: MasterClient[];
  assignments: RouteAssignment[];
  onNewClient: () => void;
  onEditClient: (client: MasterClient) => void;
  onDeleteClient: (clientId: string) => void;
  onReorderClients: (reordered: MasterClient[]) => void;
  onToggleClientAssignment: (clientId: string) => void;
  onReorderRoute: (orderedClientIds: string[]) => void;
  onReorderViewer: (orderedAssignmentIds: string[]) => void;
  onOpenPrint: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  users, selectedUserId, onSelectUser, onAddUser, onEditUser, onDeleteUser,
  selectedViewerUserIds, onToggleViewerUser,
  selectedDay, onSelectDay, activeClients, activeEditingClient,
  isEditingNew, onStatusChange, onSaveClientForm, onCancelClientForm,
  sidebarTab, onSidebarTabChange, masterClients, assignments,
  onNewClient, onEditClient, onDeleteClient, onReorderClients,
  onToggleClientAssignment, onReorderRoute, onReorderViewer, onOpenPrint
}) => {
  const activeUser = users.find(u => u.id === selectedUserId);
  const isViewer = activeUser?.role === 'viewer';
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDayMenu, setShowDayMenu] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [userRole, setUserRole] = useState<'normal' | 'viewer'>('normal');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'normal' | 'viewer'>('normal');

  // Build assigned client IDs for the current user/day
  const assignedClientIds = useMemo(() => {
    if (!selectedUserId || isViewer) return new Set<string>();
    return new Set(
      assignments.filter(a => a.user_id === selectedUserId && a.day === selectedDay)
        .map(a => a.client_id)
    );
  }, [assignments, selectedUserId, selectedDay, isViewer]);

  // Catalog unassigned clients
  const unassignedClients = useMemo(() => {
    return masterClients.filter(c => !assignedClientIds.has(c.id));
  }, [masterClients, assignedClientIds]);

  const handleAddUser = useCallback(() => {
    const name = userInput.trim();
    if (!name) return;
    onAddUser(name, userRole);
    setUserInput('');
  }, [userInput, userRole, onAddUser]);

  const availableDays = isViewer
    ? DAYS_OF_WEEK.filter(d => viewerDayToSellerDay[d])
    : DAYS_OF_WEEK;

  if (collapsed) {
    return (
      <div className="w-10 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-3 gap-3">
        <button onClick={() => setCollapsed(false)}
          className="text-gray-400 hover:text-white p-1 rounded transition-colors"
          title="Expandir sidebar">
          <ChevronDown size={18} className="rotate-90" />
        </button>
        <div className="flex flex-col items-center gap-1 mt-4">
          <Users size={16} className="text-blue-400" />
          <MapPin size={16} className="text-emerald-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 lg:w-96 bg-gray-900 border-r border-gray-800 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 bg-gray-900/95 shrink-0">
        <h1 className="text-base font-extrabold tracking-tight text-white">RutaApp</h1>
      </div>

      {/* User Selector */}
      <div className="px-4 py-3 border-b border-gray-800 shrink-0 relative">
        <label className="text-[11px] uppercase tracking-widest text-gray-500 font-bold mb-1.5 block">Usuario</label>
        <button onClick={() => setShowUserMenu(v => !v)}
          className="w-full bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg px-3 py-2 text-left text-sm text-white font-medium flex items-center justify-between transition-colors">
          <span>{activeUser?.name || 'Seleccionar...'}</span>
          <ChevronDown size={14} className={`text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
        </button>
        {showUserMenu && (
          <div className="absolute left-4 right-4 top-[78px] z-20 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
            {users.length === 0 && (
              <div className="px-3 py-4 text-center text-gray-500 text-xs">Sin usuarios</div>
            )}
            {users.map(user => (
              editingUserId === user.id ? (
                <div key={user.id} className="px-3 py-2 flex items-center gap-2 bg-gray-750">
                  <input value={editName} onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 bg-gray-700 text-xs text-gray-200 rounded px-2 py-1.5 border border-gray-600 outline-none focus:border-blue-500" autoFocus
                  />
                  <select value={editRole} onChange={(e) => setEditRole(e.target.value as 'normal' | 'viewer')}
                    className="bg-gray-700 text-xs text-gray-300 rounded px-2 py-1.5 border border-gray-600">
                    <option value="normal">Vendedor</option>
                    <option value="viewer">Fletero</option>
                  </select>
                  <button onClick={() => { onEditUser(user.id, editName, editRole); setEditingUserId(null); }}
                    className="bg-green-700 hover:bg-green-600 text-white p-1 rounded transition-colors" title="Guardar">
                    <Check size={12} />
                  </button>
                  <button onClick={() => setEditingUserId(null)}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-300 p-1 rounded transition-colors" title="Cancelar">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div key={user.id}
                  className={`flex items-center gap-1 px-3 py-2 transition-colors hover:bg-gray-700 ${
                    selectedUserId === user.id ? 'bg-blue-600/20' : ''
                  }`}>
                  <button onClick={() => { onSelectUser(user.id); setShowUserMenu(false); }}
                    className="flex-1 text-left text-sm text-gray-300 min-w-0">
                    <span className="truncate block">{user.name}</span>
                  </button>
                  <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-bold shrink-0 ${
                    user.role === 'viewer' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>{user.role === 'viewer' ? 'Fletero' : 'Vendedor'}</span>
                  <button onClick={() => { setEditingUserId(user.id); setEditName(user.name); setEditRole(user.role); }}
                    className="p-1 rounded text-gray-500 hover:text-blue-300 hover:bg-gray-700 transition-all" title="Editar">
                    <Edit2 size={11} />
                  </button>
                  <button onClick={() => { if (confirm('¿Eliminar este usuario?')) onDeleteUser(user.id); }}
                    className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-gray-700 transition-all" title="Eliminar">
                    <Trash2 size={11} />
                  </button>
                </div>
              )
            ))}
            <div className="border-t border-gray-700 px-3 py-2 flex items-center gap-2">
              <select value={userRole} onChange={(e) => setUserRole(e.target.value as 'normal' | 'viewer')}
                className="bg-gray-700 text-xs text-gray-300 rounded px-2 py-1.5 border border-gray-600">
                <option value="normal">Vendedor</option>
                <option value="viewer">Fletero</option>
              </select>
              <input value={userInput} onChange={(e) => setUserInput(e.target.value)}
                placeholder="Nuevo usuario..." onKeyDown={(e) => e.key === 'Enter' && handleAddUser()}
                className="flex-1 bg-gray-700 text-xs text-gray-200 rounded px-2 py-1.5 border border-gray-600 placeholder-gray-500 outline-none focus:border-blue-500" />
              <button onClick={handleAddUser}
                className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded transition-colors shrink-0">
                <Plus size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Viewer user filters */}
      {isViewer && users.filter(u => u.role === 'normal').length > 1 && (
        <div className="px-4 py-2 border-b border-gray-800 shrink-0">
          <label className="text-[11px] uppercase tracking-widest text-gray-500 font-bold mb-1.5 block">
            Vendedores visibles
          </label>
          <div className="flex flex-wrap gap-1">
            {users.filter(u => u.role === 'normal').map(u => (
              <button key={u.id} onClick={() => onToggleViewerUser(u.id)}
                className={`text-xs px-2 py-1 rounded font-bold transition-colors ${
                  selectedViewerUserIds.includes(u.id)
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                    : 'bg-gray-800 text-gray-500 border border-gray-700 hover:text-gray-300'
                }`}>{u.name.split('(')[0].trim()}</button>
            ))}
          </div>
        </div>
      )}

      {/* Day Selector */}
      <div className="px-4 py-3 border-b border-gray-800 shrink-0 relative">
        <label className="text-[11px] uppercase tracking-widest text-gray-500 font-bold mb-1.5 block">Día</label>
        <button onClick={() => setShowDayMenu(prev => !prev)}
          className="w-full bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg px-3 py-2 text-left text-sm text-white font-medium flex items-center justify-between transition-colors">
          <span>{selectedDay}</span>
          <ChevronDown size={14} className={`text-gray-500 transition-transform ${showDayMenu ? 'rotate-180' : ''}`} />
        </button>
        {showDayMenu && (
          <div className="absolute left-4 right-4 top-[72px] z-20 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
            {availableDays.map(day => (
              <button key={day} onClick={() => { onSelectDay(day); setShowDayMenu(false); }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-gray-700 ${
                  selectedDay === day ? 'bg-blue-600/20 text-blue-300 font-bold' : 'text-gray-300'
                }`}>{day}</button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {activeEditingClient ? (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-sm">
                {isEditingNew ? 'Nuevo Cliente' : 'Editar Cliente'}
              </h3>
            </div>
            <ClientForm client={activeEditingClient} isNew={isEditingNew} onSave={onSaveClientForm} onCancel={onCancelClientForm} />
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b border-gray-800 shrink-0">
              <button onClick={() => onSidebarTabChange('route')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                  sidebarTab === 'route'
                    ? 'text-blue-400 border-blue-500 bg-gray-800/40'
                    : 'text-gray-600 border-transparent hover:text-gray-400'
                }`}>Ruta</button>
              <button onClick={() => onSidebarTabChange('catalog')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                  sidebarTab === 'catalog'
                    ? 'text-emerald-400 border-emerald-500 bg-gray-800/40'
                    : 'text-gray-600 border-transparent hover:text-gray-400'
                }`}>Catálogo</button>
            </div>

            {sidebarTab === 'route' && (
              isViewer ? (
                <ViewerTab
                  clients={activeClients}
                  onStatusChange={onStatusChange}
                  onReorderViewer={onReorderViewer}
                />
              ) : (
                <RouteTab
                  clients={activeClients}
                  assignedClientIds={assignedClientIds}
                  unassignedClients={unassignedClients}
                  onStatusChange={onStatusChange}
                  onToggleClientAssignment={onToggleClientAssignment}
                  onReorderRoute={onReorderRoute}
                />
              )
            )}

            {sidebarTab === 'catalog' && (
              <CatalogTab
                clients={masterClients}
                onNewClient={onNewClient}
                onEditClient={onEditClient}
                onDeleteClient={onDeleteClient}
                onReorderClients={onReorderClients}
                assignedClientIds={assignedClientIds}
                onToggleClientAssignment={onToggleClientAssignment}
              />
            )}
          </>
        )}
      </div>

      {/* Footer */}
      {activeUser && !activeEditingClient && (
        <div className="p-3 border-t border-gray-800 shrink-0 bg-gray-900/95">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {sidebarTab === 'route'
                ? `${activeClients.length} cliente${activeClients.length !== 1 ? 's' : ''}`
                : `${masterClients.length} en catálogo`}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={onOpenPrint}
                className="text-gray-500 hover:text-white p-1.5 rounded transition-colors"
                title="Imprimir">
                <Printer size={14} />
              </button>
              <button onClick={() => setCollapsed(true)}
                className="text-gray-500 hover:text-gray-300 p-1.5 rounded transition-colors"
                title="Contraer sidebar">
                <ChevronDown size={16} className="rotate-90" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
