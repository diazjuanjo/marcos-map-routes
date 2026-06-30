import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { User, MasterClient, RouteAssignment, ViewerOrderEntry, DayOfWeek, AssignedClient } from '../types';
import { MapView } from './MapView';
import { mergeAssignments, applyViewerOrder, viewerDayToSellerDay } from '../utils/storage';
import { Printer, X } from 'lucide-react';

interface PrintModalProps {
  users: User[];
  masterClients: MasterClient[];
  assignments: RouteAssignment[];
  viewerOrders: ViewerOrderEntry[];
  selectedViewerUserIds: string[];
  onClose: () => void;
}

const SELLER_DAYS: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const VIEWER_DAYS: DayOfWeek[] = ['Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const PrintModal: React.FC<PrintModalProps> = ({
  users, masterClients, assignments, viewerOrders, selectedViewerUserIds, onClose
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Lunes');

  const selectedUser = users.find(u => u.id === selectedUserId);
  const isViewer = selectedUser?.role === 'viewer';

  // Set initial user
  useEffect(() => {
    if (selectedUserId) return;
    const first = users.find(u => u.role === 'normal') || users[0];
    if (first) {
      setSelectedUserId(first.id);
      setSelectedDay(first.role === 'viewer' ? 'Martes' : 'Lunes');
    }
  }, [users, selectedUserId]);

  const availableDays = isViewer ? VIEWER_DAYS : SELLER_DAYS;

  const routePoints = useMemo(() => {
    if (!selectedUserId || !selectedDay) return [];

    if (isViewer) {
      const sellerDay = viewerDayToSellerDay[selectedDay] as DayOfWeek;
      if (!sellerDay) return [];
      let all: AssignedClient[] = [];
      selectedViewerUserIds.forEach(vuid => {
        const userAssignments = assignments.filter(a => a.user_id === vuid && a.day === sellerDay);
        all = all.concat(mergeAssignments(userAssignments, masterClients));
      });
      const ordered = applyViewerOrder(all, viewerOrders);
      return ordered.map(c => ({
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

    const userAssignments = assignments.filter(
      a => a.user_id === selectedUserId && a.day === selectedDay
    );
    return mergeAssignments(userAssignments, masterClients).map(c => ({
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
  }, [assignments, masterClients, selectedUserId, selectedDay, isViewer, selectedViewerUserIds, viewerOrders]);

  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    if (containerRef.current && mapRef.current) {
      containerRef.current.style.height = '210mm';
      mapRef.current.invalidateSize();
      setTimeout(() => window.print(), 100);
    } else {
      window.print();
    }
  }, []);

  return (
    <>
      {/* Toolbar */}
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

      {/* Selectors */}
      <div className="print-hidden flex items-center gap-3 px-4 py-2 border-b border-gray-200 bg-white/80">
        <select value={selectedUserId} onChange={(e) => {
          const u = users.find(uu => uu.id === e.target.value);
          setSelectedUserId(e.target.value);
          setSelectedDay(u?.role === 'viewer' ? 'Martes' : 'Lunes');
        }}
          className="bg-white text-sm text-gray-700 rounded px-3 py-1.5 border border-gray-300">
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name} ({u.role === 'viewer' ? 'Fletero' : 'Vendedor'})</option>
          ))}
        </select>
        <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value as DayOfWeek)}
          className="bg-white text-sm text-gray-700 rounded px-3 py-1.5 border border-gray-300">
          {availableDays.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        {isViewer && selectedViewerUserIds.length > 0 && (
          <span className="text-xs text-gray-500">
            {selectedViewerUserIds.length} vendedor{selectedViewerUserIds.length > 1 ? 'es' : ''}
          </span>
        )}
      </div>

      {/* Map — screen: padded, print: full-bleed */}
      <div className="mb-6 px-6 max-w-4xl mx-auto print:px-0 print:max-w-none print-map-fill">
        <h3 className="text-xs font-bold text-gray-500 uppercase mb-2 print:hidden">Mapa de ruta</h3>
        <div className="relative h-[250px] border border-gray-300 overflow-hidden map-print-container" ref={containerRef}>
          {routePoints.length > 0 ? (
            <>
            <MapView
              points={routePoints}
              onMapClick={() => {}}
              onMarkerClick={() => {}}
              tempNewPoint={null}
              onStatusChange={() => {}}
              hideOverlays
              onMapReady={(m: any) => { mapRef.current = m; }}
            />
            <div className="hidden print:block print:absolute print:top-2 print:left-2 print:z-[10000] print:bg-white/80 print:px-2 print:py-1 print:rounded print:text-[10px] print:font-bold print:text-gray-700 print:shadow-sm">
              {selectedUser?.name} — {selectedDay}
            </div>
            </>
          ) : (
            <p className="text-gray-500 text-sm italic p-4">Sin puntos en la ruta</p>
          )}
        </div>
      </div>

      {/* Table — screen: same visual, print: page 2 */}
      <div className="p-6 max-w-4xl mx-auto print:px-6 print:max-w-4xl print-table-page">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">RutaApp</h1>
          <p className="text-gray-600 mt-1">{selectedUser?.name} — {selectedDay}</p>
        </div>
        <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Listado de clientes</h3>
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
              <tr><td colSpan={4} className="py-8 text-center text-gray-400">Sin clientes asignados</td></tr>
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
