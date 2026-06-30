import React, { useState, useMemo, useCallback, useRef } from 'react';
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
  const printRef = useRef<HTMLDivElement>(null);

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

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="fixed inset-0 z-[5000] flex flex-col bg-gray-900/95 print:bg-white">
      {/* Toolbar — hidden when printing */}
      <div className="print-hidden flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900 shrink-0">
        <h2 className="text-white font-bold text-sm">Imprimir ruta</h2>
        <div className="flex items-center gap-3">
          <button onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors">
            <Printer size={14} /> Imprimir
          </button>
          <button onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Controls — hidden when printing */}
      <div className="print-hidden flex items-center gap-3 px-4 py-2 border-b border-gray-800 bg-gray-900/80 shrink-0">
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Vendedor</label>
          <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}
            className="bg-gray-800 text-sm text-gray-200 rounded-lg px-3 py-1.5 border border-gray-700 outline-none focus:border-blue-500">
            {normalUsers.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Día</label>
          <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value as DayOfWeek)}
            className="bg-gray-800 text-sm text-gray-200 rounded-lg px-3 py-1.5 border border-gray-700 outline-none focus:border-blue-500">
            {SELLER_DAYS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Print content */}
      <div ref={printRef} className="flex-1 overflow-y-auto print:overflow-visible">
        <div className="max-w-4xl mx-auto p-4 md:p-6 print:p-0 print:max-w-none">
          {/* Title */}
          <div className="mb-4 print:mb-6">
            <h1 className="text-xl font-bold text-white print:text-black">RutaApp</h1>
            <p className="text-sm text-gray-400 print:text-gray-600 mt-1">
              {selectedUser?.name} — {selectedDay}
            </p>
          </div>

          {/* Map */}
          <div className="mb-6 print:mb-0 print:break-after-page">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 print:text-gray-500">
              <MapPin size={12} className="inline mr-1" />Mapa de ruta
            </h3>
            <div className="h-[350px] md:h-[450px] rounded-xl overflow-hidden border border-gray-700 print:border-gray-300 print:rounded-none print:h-[90vh]">
              <MapView
                points={routePoints}
                onMapClick={() => {}}
                onMarkerClick={() => {}}
                tempNewPoint={null}
                onStatusChange={() => {}}
              />
            </div>
          </div>

          {/* Client table */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 print:text-gray-500">
              Listado de clientes
            </h3>
            <table className="w-full text-sm print:text-xs">
              <thead>
                <tr className="border-b border-gray-700 print:border-gray-300">
                  <th className="text-left py-2 px-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider print:text-gray-600">#</th>
                  <th className="text-left py-2 px-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider print:text-gray-600">Nombre</th>
                  <th className="text-left py-2 px-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider print:text-gray-600">Dirección</th>
                  <th className="text-left py-2 px-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider print:text-gray-600">Teléfono</th>
                </tr>
              </thead>
              <tbody>
                {routePoints.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500 print:text-gray-400">
                      Sin clientes asignados
                    </td>
                  </tr>
                ) : (
                  routePoints.map((p, i) => (
                    <tr key={p.id} className="border-b border-gray-800 print:border-gray-200">
                      <td className="py-2.5 px-2 text-gray-400 print:text-gray-500">{i + 1}</td>
                      <td className="py-2.5 px-2 font-medium text-white print:text-gray-900">{p.name}</td>
                      <td className="py-2.5 px-2 text-gray-400 print:text-gray-600">{p.address || '—'}</td>
                      <td className="py-2.5 px-2 text-gray-400 print:text-gray-600">{p.phone || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-gray-800 print:border-gray-300 text-center text-[10px] text-gray-600 print:text-gray-400">
            Generado el {new Date().toLocaleDateString('es-AR')}
          </div>
        </div>
      </div>
    </div>
  );
};
export default PrintModal;
