import React, { useState, useMemo, useCallback } from 'react';
import { User, MasterClient, RouteAssignment, DayOfWeek } from '../types';
import { MapView } from './MapView';
import { mergeAssignments } from '../utils/storage';
import { Printer, X, MapPin } from 'lucide-react';

interface PrintModalProps {
  users: User[];
  masterClients: MasterClient[];
  assignments: RouteAssignment[];
  onClose: () => void;
}

const SELLER_DAYS: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export const PrintModal: React.FC<PrintModalProps> = ({
  users, masterClients, assignments, onClose
}) => {
  const normalUsers = useMemo(() => users.filter(u => u.role === 'normal'), [users]);
  const [selectedUserId, setSelectedUserId] = useState<string>(
    normalUsers.length > 0 ? normalUsers[0].id : ''
  );
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Lunes');

  const selectedUser = users.find(u => u.id === selectedUserId);

  const routePoints = useMemo(() => {
    if (!selectedUserId || !selectedDay) return [];
    const userAssignments = assignments.filter(
      a => a.user_id === selectedUserId && a.day === selectedDay
    );
    const merged = mergeAssignments(userAssignments, masterClients);
    return merged.map(c => ({
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
  }, [assignments, masterClients, selectedUserId, selectedDay]);

  const handlePrint = useCallback(() => window.print(), []);

  return (
    <div className="min-h-full bg-white print:bg-white">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 print:hidden flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <h2 className="text-gray-900 font-bold text-sm">Imprimir ruta</h2>
        <div className="flex items-center gap-3">
          <button onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors">
            <Printer size={14} /> Imprimir
          </button>
          <button onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="print-hidden flex items-center gap-3 px-4 py-2 border-b border-gray-200 bg-white/80">
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Vendedor</label>
          <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}
            className="bg-white text-sm text-gray-700 rounded-lg px-3 py-1.5 border border-gray-300 outline-none focus:border-blue-500">
            {normalUsers.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Día</label>
          <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value as DayOfWeek)}
            className="bg-white text-sm text-gray-700 rounded-lg px-3 py-1.5 border border-gray-300 outline-none focus:border-blue-500">
            {SELLER_DAYS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">RutaApp</h1>
          <p className="text-sm text-gray-600 mt-1">
            {selectedUser?.name} — {selectedDay}
          </p>
        </div>

        {/* Map — page 1 */}
        <div className="mb-8 print:break-after-page">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            <MapPin size={12} className="inline mr-1" />Mapa de ruta
          </h3>
          <div className="h-[350px] md:h-[450px] print:h-[90vh] border border-gray-300 print:border-0 overflow-hidden">
            <MapView
              points={routePoints}
              onMapClick={() => {}}
              onMarkerClick={() => {}}
              tempNewPoint={null}
              onStatusChange={() => {}}
            />
          </div>
        </div>

        {/* Client table — page 2 */}
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Listado de clientes
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-2 px-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider">#</th>
                <th className="text-left py-2 px-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="text-left py-2 px-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Dirección</th>
                <th className="text-left py-2 px-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {routePoints.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-400">
                    Sin clientes asignados
                  </td>
                </tr>
              ) : (
                routePoints.map((p, i) => (
                  <tr key={p.id} className="border-b border-gray-200">
                    <td className="py-2.5 px-2 text-gray-500">{i + 1}</td>
                    <td className="py-2.5 px-2 font-medium text-gray-900">{p.name}</td>
                    <td className="py-2.5 px-2 text-gray-600">{p.address || '—'}</td>
                    <td className="py-2.5 px-2 text-gray-600">{p.phone || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-center text-[10px] text-gray-400">
          Generado el {new Date().toLocaleDateString('es-AR')}
        </div>
      </div>
    </div>
  );
};
export default PrintModal;
