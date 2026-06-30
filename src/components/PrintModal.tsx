import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { User, MasterClient, RouteAssignment, DayOfWeek } from '../types';
import { MapView } from './MapView';
import { mergeAssignments } from '../utils/storage';
import { Printer, X, MapPin } from 'lucide-react';
import html2canvas from 'html2canvas';

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
  const mapRef = useRef<HTMLDivElement>(null);
  const mapImageRef = useRef<string | null>(null);
  const [, forceRender] = useState(0);

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

  // Pre-capture map when route points change
  useEffect(() => {
    mapImageRef.current = null;
    forceRender(n => n + 1);
    if (routePoints.length === 0) return;
    const timer = setTimeout(() => {
      if (!mapRef.current) return;
      html2canvas(mapRef.current, { useCORS: true }).then(canvas => {
        mapImageRef.current = canvas.toDataURL('image/png');
        forceRender(n => n + 1);
      }).catch(() => {});
    }, 1000);
    return () => clearTimeout(timer);
  }, [routePoints]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <>
      {/* Toolbar */}
      <div className="print-hidden sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <h2 className="text-gray-900 font-bold text-sm">Imprimir ruta</h2>
        <div className="flex items-center gap-3">
          {!mapImageRef.current && routePoints.length > 0 && (
            <span className="text-xs text-amber-600 flex items-center gap-1">
              Capturando mapa...
            </span>
          )}
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

      {/* Selector */}
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

      {/* Content */}
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">RutaApp</h1>
          <p className="text-gray-600 mt-1">{selectedUser?.name} — {selectedDay}</p>
        </div>

        {/* Map */}
        <div className="mb-8 print:break-after-page">
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">
            <MapPin size={12} className="inline mr-1" />Mapa de ruta
          </h3>
          {/* Live map (screen only) */}
          <div ref={mapRef} className="print:hidden h-[350px] md:h-[450px] border border-gray-300 overflow-hidden">
            <MapView
              points={routePoints}
              onMapClick={() => {}}
              onMarkerClick={() => {}}
              tempNewPoint={null}
              onStatusChange={() => {}}
              preferCanvas={true}
            />
          </div>
          {/* Captured image (print only) */}
          {mapImageRef.current && (
            <img src={mapImageRef.current} alt="Mapa de ruta"
              className="hidden print:block w-full"
            />
          )}
          {!mapImageRef.current && routePoints.length > 0 && (
            <p className="hidden print:block text-gray-500 text-sm italic">
              Capturando mapa para impresión...
            </p>
          )}
        </div>

        {/* Client table */}
        <div>
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
        </div>

        <p className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-400">
          Generado el {new Date().toLocaleDateString('es-AR')}
        </p>
      </div>
    </>
  );
};
export default PrintModal;
