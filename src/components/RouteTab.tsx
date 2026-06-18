import React from 'react';
import { MasterClient, AssignedClient } from '../types';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, MapPin, Plus, Check, GripVertical, XCircle } from 'lucide-react';

interface RouteTabProps {
  clients: AssignedClient[];
  assignedClientIds: Set<string>;
  unassignedClients: MasterClient[];
  onStatusChange: (assignmentId: string, status: string) => void;
  onToggleClientAssignment: (clientId: string) => void;
  onReorderRoute: (orderedClientIds: string[]) => void;
}

const SortableRouteItem: React.FC<{
  client: AssignedClient;
  index: number;
  onStatusChange: (assignmentId: string, status: string) => void;
}> = ({ client, index, onStatusChange }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: client.assignment_id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative' as const
  };

  const statusColors: Record<string, string> = {
    pending: 'border-l-amber-500/60',
    completed: 'border-l-emerald-500',
    canceled: 'border-l-red-500/60'
  };

  return (
    <div ref={setNodeRef} style={style} className={`group flex items-start gap-2 p-2.5 rounded-lg border-l-4 border bg-gray-800/20 border-gray-800 transition-all ${
      isDragging ? 'shadow-xl border-blue-500/50 bg-gray-800' : 'hover:border-gray-700'
    } ${statusColors[client.status] || 'border-l-gray-600'}`}>
      <div className="flex flex-col items-center gap-0.5 mt-0.5">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-0.5 rounded text-gray-500 hover:text-gray-300 hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100" title="Arrastrar">
          <GripVertical size={10} />
        </button>
        <span className="w-5 h-5 rounded-full bg-gray-700 text-gray-300 text-[10px] font-bold flex items-center justify-center shrink-0">{index + 1}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <h4 className="text-[12px] font-bold text-white leading-tight truncate">{client.name}</h4>
          {client.time && (
            <span className="flex items-center gap-1 text-[8px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-semibold shrink-0">
              <Clock size={7} />{client.time}
            </span>
          )}
        </div>
        {client.address && (
          <p className="text-[9px] text-gray-400 truncate mt-0.5">{client.address}</p>
        )}
        {client.notes && (
          <p className="text-[8px] text-amber-300/70 bg-amber-500/5 px-1 py-0.5 rounded italic mt-0.5 line-clamp-1">{client.notes}</p>
        )}
      </div>
      <div className="flex flex-col gap-1 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
        {client.status === 'pending' && (
          <button onClick={() => onStatusChange(client.assignment_id, 'completed')}
            className="p-1 rounded bg-gray-800 hover:bg-emerald-800/60 hover:text-emerald-400 text-gray-400 transition-all"
            title="Marcar completado">
            <Check size={10} />
          </button>
        )}
        {client.status === 'completed' && (
          <button onClick={() => onStatusChange(client.assignment_id, 'pending')}
            className="p-1 rounded bg-gray-800 hover:bg-amber-800/60 hover:text-amber-400 text-gray-400 transition-all"
            title="Volver a pendiente">
            <XCircle size={10} />
          </button>
        )}
      </div>
    </div>
  );
};

export const RouteTab: React.FC<RouteTabProps> = ({
  clients, unassignedClients, onStatusChange, onToggleClientAssignment, onReorderRoute
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = clients.findIndex(c => c.assignment_id === active.id);
    const newIndex = clients.findIndex(c => c.assignment_id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(clients, oldIndex, newIndex);
    onReorderRoute(reordered.map(c => c.id));
  };

  return (
    <div className="p-3 space-y-3">
      {/* Assigned route */}
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
          <MapPin size={14} className="text-blue-400" />
          Ruta del día
        </span>
        <span className="bg-blue-600/20 text-blue-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
          {clients.length}
        </span>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-6 bg-gray-800/25 rounded-xl">
          <MapPin size={24} className="text-gray-600 mx-auto mb-2" />
          <p className="text-xs text-gray-400 font-medium">Sin clientes asignados</p>
          <p className="text-[10px] text-gray-500 mt-1">Agregá clientes desde el catálogo.</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={clients.map(c => c.assignment_id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {clients.map((client, index) => (
                <SortableRouteItem
                  key={client.assignment_id}
                  client={client}
                  index={index}
                  onStatusChange={onStatusChange}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Unassigned clients */}
      {unassignedClients.length > 0 && (
        <>
          <div className="border-t border-gray-800 pt-3 mt-3">
            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Plus size={11} />
              Disponibles ({unassignedClients.length})
            </span>
          </div>
          <div className="space-y-1">
            {unassignedClients.map(client => (
              <button key={client.id} onClick={() => onToggleClientAssignment(client.id)}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-800/20 border border-gray-800 hover:border-blue-500/40 hover:bg-gray-800/40 transition-all text-left group">
                <div className="w-5 h-5 rounded-full bg-gray-700/50 text-gray-500 text-[10px] font-bold flex items-center justify-center shrink-0">+</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-gray-300 font-medium truncate group-hover:text-white transition-colors">{client.name}</p>
                  {client.address && <p className="text-[8px] text-gray-500 truncate">{client.address}</p>}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
export default RouteTab;
