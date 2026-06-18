import React, { useState, useEffect } from 'react';
import { MasterClient } from '../types';
import { Save, Trash2, X, MapPin, Clock, FileText } from 'lucide-react';

interface PointFormProps {
  point: Partial<MasterClient>;
  onSave: (point: MasterClient) => void;
  onCancel: () => void;
  onDelete?: (pointId: string) => void;
  isNew: boolean;
}

export const PointForm: React.FC<PointFormProps> = ({ point, onSave, onCancel, onDelete, isNew }) => {
  const [name, setName] = useState(point.name || '');
  const [address, setAddress] = useState(point.address || '');
  const [time, setTime] = useState(point.time || '');
  const [notes, setNotes] = useState(point.notes || '');

  useEffect(() => {
    setName(point.name || '');
    setAddress(point.address || '');
    setTime(point.time || '');
    setNotes(point.notes || '');
  }, [point]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: point.id || `client-${Date.now()}`,
      name: name.trim(),
      address: address.trim() || undefined,
      lat: point.lat || 0,
      lng: point.lng || 0,
      notes: notes.trim() || undefined,
      time: time || undefined,
      sort_order: point.sort_order || 0
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="bg-blue-600/20 p-1.5 rounded-lg border border-blue-500/30">
          <MapPin size={14} className="text-blue-400" />
        </div>
        <h3 className="text-sm font-bold text-white">{isNew ? 'Nuevo Cliente' : 'Editar Cliente'}</h3>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Nombre del cliente *</label>
        <input
          type="text" value={name} onChange={(e) => setName(e.target.value)}
          className="w-full text-xs px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          placeholder="Ej: Supermercado López" autoFocus required
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Dirección</label>
        <input
          type="text" value={address} onChange={(e) => setAddress(e.target.value)}
          className="w-full text-xs px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Ej: Av. Mitre 450"
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
          <Clock size={10} className="inline mr-1" />Horario pactado
        </label>
        <input
          type="time" value={time} onChange={(e) => setTime(e.target.value)}
          className="w-full text-xs px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
          <FileText size={10} className="inline mr-1" />Notas
        </label>
        <textarea
          value={notes} onChange={(e) => setNotes(e.target.value)}
          className="w-full text-xs px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          placeholder="Instrucciones, referencias, etc."
          rows={3}
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit" disabled={!name.trim()}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-3 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-blue-900/20"
        >
          <Save size={14} /> {isNew ? 'Agregar al catálogo' : 'Guardar cambios'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-3 py-2.5 rounded-lg text-xs font-bold text-gray-400 hover:text-white border border-gray-700 hover:bg-gray-800 transition-colors"
        >
          <X size={14} />
        </button>
        {!isNew && onDelete && (
          <button type="button" onClick={() => { if (confirm('¿Eliminar este cliente del catálogo?')) onDelete(point.id!); }}
            className="px-3 py-2.5 rounded-lg text-xs font-bold text-red-400 hover:text-white border border-red-900/50 hover:bg-red-950 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <p className="text-[9px] text-gray-500 text-center">
        Las coordenadas se registraron al hacer clic en el mapa.
      </p>
    </form>
  );
};
export default PointForm;
