import React, { useState, useMemo, useCallback } from 'react';
import { User, MasterClient, RouteAssignment, DayOfWeek } from '../types';
import { mergeAssignments } from '../utils/storage';
import { Printer, X } from 'lucide-react';

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
      status: c.status
    }));
  }, [assignments, masterClients, selectedUserId, selectedDay]);

  const handlePrint = useCallback(() => window.print(), []);

  return (
    <>
      {/* Toolbar — print-hidden */}
      <div className="print-hidden sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <h2 className="text-gray-900 font-bold text-sm">Imprimir ruta</h2>
        <div className="flex items-center gap-3">
          <button onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5">
            <Printer size={14} /> Imprimir
          </button>
          <button onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Selector — print-hidden */}
      <div className="print-hidden flex items-center gap-3 px-4 py-2 border-b border-gray-200 bg-white/80">
        <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}
          className="bg-white text-sm text-gray-700 rounded px-3 py-1.5 border border-gray-300">
          {normalUsers.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
        <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value as DayOfWeek)}
          className="bg-white text-sm text-gray-700 rounded px-3 py-1.5 border border-gray-300">
          {SELLER_DAYS.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Printable content */}
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">RutaApp</h1>
        <p className="text-gray-600 mb-6">{selectedUser?.name} — {selectedDay}</p>

        <p className="text-gray-700 mb-4">
          {routePoints.length} cliente{routePoints.length !== 1 ? 's' : ''} en la ruta
        </p>

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-400">
              <th className="text-left py-2 pr-4 text-xs font-bold text-gray-600 uppercase">#</th>
              <th className="text-left py-2 pr-4 text-xs font-bold text-gray-600 uppercase">Nombre</th>
              <th className="text-left py-2 pr-4 text-xs font-bold text-gray-600 uppercase">Dirección</th>
              <th className="text-left py-2 text-xs font-bold text-gray-600 uppercase">Teléfono</th>
            </tr>
          </thead>
          <tbody>
            {routePoints.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-400">Sin clientes asignados</td>
              </tr>
            ) : (
              routePoints.map((p, i) => (
                <tr key={p.id} className="border-b border-gray-200">
                  <td className="py-2 pr-4 text-gray-500">{i + 1}</td>
                  <td className="py-2 pr-4 font-medium text-gray-900">{p.name}</td>
                  <td className="py-2 pr-4 text-gray-600">{p.address || '—'}</td>
                  <td className="py-2 text-gray-600">{p.phone || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <p className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-400">
          Generado el {new Date().toLocaleDateString('es-AR')}
        </p>
      </div>
    </>
  );
};
export default PrintModal;
