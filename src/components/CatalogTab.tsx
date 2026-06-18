import React from 'react';
import { MasterClient } from '../types';
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
import { Clock, MapPin, Plus, Trash2, Edit2, GripVertical, Check } from 'lucide-react';

interface CatalogTabProps {
  clients: MasterClient[];
  onNewClient: () => void;
  onEditClient: (client: MasterClient) => void;
  onDeleteClient: (clientId: string) => void;
  onReorderClients: (clients: MasterClient[]) => void;
  assignedClientIds: Set<string>;
  onToggleClientAssignment: (clientId: string) => void;
}

const SortableClientItem: React.FC<{
  client: MasterClient;
  index: number;
  onEdit: (c: MasterClient) => void;
  onDelete: (id: string) => void;
  isAssigned: boolean;
  onToggleAssign: (id: string) => void;
}> = ({ client, index, onEdit, onDelete, isAssigned, onToggleAssign }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: client.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative' as const
  };

  return (
    <div ref={setNodeRef} style={style} className={`group flex items-start gap-2 p-2.5 rounded-lg border transition-all ${
      isDragging ? 'shadow-xl border-blue-500/50 bg-gray-800' : 'bg-gray-800/30 border-gray-800 hover:border-gray-700'
    }`}>
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
        <button onClick={() => onToggleAssign(client.id)}
          className={`p-1 rounded text-[9px] font-bold transition-all flex items-center gap-1 ${
            isAssigned
              ? 'bg-green-800/40 text-green-400 hover:bg-green-800/60'
              : 'bg-gray-800 text-gray-400 hover:bg-blue-900/40 hover:text-blue-300'
          }`}
          title={isAssigned ? 'Quitar de la ruta' : 'Agregar a la ruta'}>
          {isAssigned ? <Check size={10} /> : <Plus size={10} />}
        </button>
        <button onClick={() => onEdit(client)}
          className="p-1 rounded bg-gray-800 hover:bg-blue-900/60 hover:text-blue-300 text-gray-400 transition-all"
          title="Editar cliente">
          <Edit2 size={10} />
        </button>
        <button onClick={() => { if (confirm('¿Eliminar este cliente del catálogo?')) onDelete(client.id); }}
          className="p-1 rounded bg-gray-800 hover:bg-red-900/60 hover:text-red-400 text-gray-400 transition-all"
          title="Eliminar cliente">
          <Trash2 size={10} />
        </button>
      </div>
    </div>
  );
};

export const CatalogTab: React.FC<CatalogTabProps> = ({
  clients, onNewClient, onEditClient, onDeleteClient, onReorderClients,
  assignedClientIds, onToggleClientAssignment
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = clients.findIndex(c => c.id === active.id);
    const newIndex = clients.findIndex(c => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorderClients(arrayMove(clients, oldIndex, newIndex));
  };

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
          <MapPin size={14} className="text-indigo-400" />
          Catálogo de Clientes
        </span>
        <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full text-[10px]">
          {clients.length}
        </span>
      </div>

      <button onClick={onNewClient}
        className="w-full flex items-center justify-center gap-1.5 text-[11px] font-bold py-2 rounded-lg border-2 border-dashed border-gray-700 text-gray-400 hover:border-blue-500/50 hover:text-blue-400 transition-all">
        <Plus size={12} /> Agregar Cliente
      </button>

      {clients.length === 0 ? (
        <div className="text-center py-8 bg-gray-800/25 rounded-xl">
          <MapPin size={28} className="text-gray-600 mx-auto mb-2" />
          <p className="text-xs text-gray-400 font-medium">No hay clientes en el catálogo</p>
          <p className="text-[10px] text-gray-500 mt-1">Haz clic en el mapa o en "Agregar Cliente" para crear el primero.</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={clients.map(c => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {clients.map((client, index) => (
                  <SortableClientItem
                    key={client.id}
                    client={client}
                    index={index}
                    onEdit={onEditClient}
                    onDelete={onDeleteClient}
                    isAssigned={assignedClientIds.has(client.id)}
                    onToggleAssign={onToggleClientAssignment}
                  />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};
export default CatalogTab;
