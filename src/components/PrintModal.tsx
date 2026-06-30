import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { User, MasterClient, RouteAssignment, ViewerOrderEntry, DayOfWeek, AssignedClient } from '../types';
import { MapView } from './MapView';
import { mergeAssignments, applyViewerOrder, viewerDayToSellerDay } from '../utils/storage';
import { Printer, X, MapPin } from 'lucide-react';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // Draw canvas route map
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || routePoints.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 800;
    const h = 600;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, w, h);

    if (routePoints.length === 0) {
      ctx.fillStyle = '#999';
      ctx.font = '16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Sin puntos en la ruta', w / 2, h / 2);
      return;
    }

    const lats = routePoints.map(p => p.lat);
    const lngs = routePoints.map(p => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const pad = 60;
    const mapW = w - pad * 2;
    const mapH = h - pad * 2;
    const latRange = maxLat - minLat || 0.01;
    const lngRange = maxLng - minLng || 0.01;
    const s = Math.min(mapW / lngRange, mapH / latRange) * 0.85;

    const toX = (lng: number) => pad + (lng - minLng) * s + (mapW - lngRange * s) / 2;
    const toY = (lat: number) => pad + (maxLat - lat) * s + (mapH - latRange * s) / 2;

    const coords = routePoints.map(p => ({ x: toX(p.lng), y: toY(p.lat) }));

    // Draw route line
    ctx.beginPath();
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.moveTo(coords[0].x, coords[0].y);
    for (let i = 1; i < coords.length; i++) ctx.lineTo(coords[i].x, coords[i].y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw markers
    const statusBg: Record<string, string> = {
      completed: '#22c55e', pending: '#3b82f6', canceled: '#ef4444'
    };

    for (let i = 0; i < routePoints.length; i++) {
      const { x, y } = coords[i];
      const text = `${i + 1}. ${routePoints[i].name}`;
      ctx.font = 'bold 11px system-ui, sans-serif';
      const tw = ctx.measureText(text).width;
      const pw = tw + 26;
      const ph = 26;
      const bg = statusBg[routePoints[i].status] || '#3b82f6';

      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.roundRect(x - pw / 2, y - ph / 2, pw, ph, 13);
      ctx.fill();

      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x - pw / 2, y - ph / 2, pw, ph, 13);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.arc(x - pw / 2 + 14, y, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${i + 1}`, x - pw / 2 + 14, y);

      ctx.textAlign = 'left';
      ctx.fillText(text, x - pw / 2 + 26, y);
    }
  }, [routePoints]);

  const handlePrint = useCallback(() => window.print(), []);

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

      {/* Content */}
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">RutaApp</h1>
          <p className="text-gray-600 mt-1">{selectedUser?.name} — {selectedDay}</p>
        </div>

        {/* Canvas route map — hidden on screen, full page in print */}
        <canvas ref={canvasRef}
          className="hidden print:block print:w-full print:break-after-page"
          width={800} height={600}
        />

        {/* Leaflet map — screen only */}
        <div className="mb-4 print:hidden">
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">
            <MapPin size={12} className="inline mr-1" />Mapa de ruta
          </h3>
          <div className="h-[250px] border border-gray-300 overflow-hidden">
            {routePoints.length > 0 ? (
              <MapView
                points={routePoints}
                onMapClick={() => {}}
                onMarkerClick={() => {}}
                tempNewPoint={null}
                onStatusChange={() => {}}
              />
            ) : (
              <p className="text-gray-500 text-sm italic p-4">Sin puntos en la ruta</p>
            )}
          </div>
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
