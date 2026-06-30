import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { RoutePoint } from '../types';
import { Clock, FileText, CheckCircle, AlertCircle, Play, Printer } from 'lucide-react';

import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  points: RoutePoint[];
  onMapClick: (lat: number, lng: number) => void;
  onMarkerClick: (point: RoutePoint) => void;
  tempNewPoint: Partial<RoutePoint> | null;
  onStatusChange: (pointId: string, status: RoutePoint['status']) => void;
  preferCanvas?: boolean;
}

const createNumberedIcon = (index: number, name: string, status: RoutePoint['status']) => {
  const truncated = name.length > 12 ? name.substring(0, 12) + '...' : name;
  return L.divIcon({
    html: `<div class="custom-marker-pill marker-${status}">
      <span class="marker-number">${index}</span>
      <span class="marker-name">${truncated}</span>
    </div>`,
    className: 'custom-div-icon',
    iconSize: [120, 30],
    iconAnchor: [60, 15],
    popupAnchor: [0, -15]
  });
};

const createTempIcon = () => {
  return L.divIcon({
    html: `<div class="custom-marker-pill bg-orange-500 animate-pulse">
      <span class="marker-number">+</span>
      <span class="marker-name">Nuevo</span>
    </div>`,
    className: 'custom-div-icon',
    iconSize: [90, 30],
    iconAnchor: [45, 15],
    popupAnchor: [0, -15]
  });
};

const MapEventsHandler: React.FC<{ onMapClick: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
};

const AutoFitBounds: React.FC<{ points: RoutePoint[]; tempPoint: Partial<RoutePoint> | null }> = ({ points, tempPoint }) => {
  const map = useMap();

  useEffect(() => {
    const allLocations: [number, number][] = [];

    points.forEach(p => allLocations.push([p.lat, p.lng]));
    if (tempPoint && tempPoint.lat && tempPoint.lng) {
      allLocations.push([tempPoint.lat, tempPoint.lng]);
    }

    if (allLocations.length > 0) {
      const bounds = L.latLngBounds(allLocations);
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 16,
        animate: true,
        duration: 0.8
      });
    }
  }, [points, tempPoint, map]);

  return null;
};

export const MapView: React.FC<MapViewProps> = ({
  points,
  onMapClick,
  onMarkerClick,
  tempNewPoint,
  onStatusChange,
  preferCanvas
}) => {
  const defaultCenter: [number, number] = [-26.82414, -65.2226];
  const defaultZoom = 13;

  const routePositions = points.map(p => [p.lat, p.lng] as [number, number]);

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="h-full w-full"
        zoomControl={false}
        preferCanvas={preferCanvas}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapEventsHandler onMapClick={onMapClick} />

        <AutoFitBounds points={points} tempPoint={tempNewPoint} />

        {routePositions.length > 1 && (
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: '#3b82f6',
              weight: 4,
              opacity: 0.7,
              dashArray: '8, 8',
              lineJoin: 'round'
            }}
          />
        )}

        {points.map((point, index) => (
          <Marker
            key={point.id}
            position={[point.lat, point.lng]}
            icon={createNumberedIcon(index + 1, point.name, point.status)}
            eventHandlers={{
              click: () => onMarkerClick(point)
            }}
          >
            <Popup>
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center justify-between mb-1.5 border-b border-gray-100 pb-1">
                  <span className="font-bold text-gray-800 text-sm">
                    {index + 1}. {point.name}
                  </span>
                  {point.time && (
                    <span className="flex items-center gap-1 text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-medium">
                      <Clock size={10} />
                      {point.time}
                    </span>
                  )}
                </div>

                {point.address && (
                  <p className="text-xs text-gray-500 font-medium mb-1.5">
                    📍 {point.address}
                  </p>
                )}

                {point.notes && (
                  <div className="flex gap-1 bg-amber-50 border border-amber-100 p-1.5 rounded-lg mb-2">
                    <FileText size={12} className="text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-amber-800 leading-tight italic">
                      {point.notes}
                    </p>
                  </div>
                )}

                <div className="flex gap-1.5 pt-1.5 border-t border-gray-100">
                  <button
                    onClick={() => onStatusChange(point.id, 'completed')}
                    className={`flex-1 flex items-center justify-center gap-1 text-[10px] py-1 rounded font-semibold transition-colors ${
                      point.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
                    }`}
                  >
                    <CheckCircle size={10} /> Listor
                  </button>
                  <button
                    onClick={() => onStatusChange(point.id, 'pending')}
                    className={`flex-1 flex items-center justify-center gap-1 text-[10px] py-1 rounded font-semibold transition-colors ${
                      point.status === 'pending'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    <Play size={10} /> Pendiente
                  </button>
                  <button
                    onClick={() => onStatusChange(point.id, 'canceled')}
                    className={`flex-1 flex items-center justify-center gap-1 text-[10px] py-1 rounded font-semibold transition-colors ${
                      point.status === 'canceled'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                    }`}
                  >
                    <AlertCircle size={10} /> Cancelar
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {tempNewPoint && tempNewPoint.lat && tempNewPoint.lng && (
          <Marker
            position={[tempNewPoint.lat, tempNewPoint.lng]}
            icon={createTempIcon()}
          >
            <Popup>
              <div className="p-1">
                <span className="text-xs font-semibold text-orange-600">
                  ¡Haz clic aquí para crear la parada en el formulario!
                </span>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      <div className="print-btn absolute top-4 left-4 z-[1000] flex gap-1">
        <button
          onClick={() => window.print()}
          className="w-9 h-9 flex items-center justify-center bg-white hover:bg-gray-100 text-gray-600 hover:text-gray-800 rounded-lg shadow-md border border-gray-200 transition-colors"
          title="Imprimir mapa"
        >
          <Printer size={16} />
        </button>
      </div>

      <div className="zoom-controls absolute top-4 right-4 z-[1000] flex flex-col gap-1 shadow-md bg-white rounded-lg overflow-hidden border border-gray-200">
        <button
          onClick={() => {
            const mapContainer = document.querySelector('.leaflet-container');
            if (mapContainer) {
              // @ts-ignore
              const map = mapContainer._leaflet_map;
              if (map) map.zoomIn();
            }
          }}
          className="w-8 h-8 flex items-center justify-center font-bold text-lg text-gray-600 hover:bg-gray-100 border-b border-gray-100 transition-colors"
        >
          +
        </button>
        <button
          onClick={() => {
            const mapContainer = document.querySelector('.leaflet-container');
            if (mapContainer) {
              // @ts-ignore
              const map = mapContainer._leaflet_map;
              if (map) map.zoomOut();
            }
          }}
          className="w-8 h-8 flex items-center justify-center font-bold text-lg text-gray-600 hover:bg-gray-100 transition-colors"
        >
          −
        </button>
      </div>

      <div className="map-legend absolute bottom-4 right-4 z-[1000] bg-white bg-opacity-95 p-3 rounded-xl border border-gray-100 shadow-lg text-[11px] space-y-1.5 max-w-[150px]">
        <h4 className="font-bold text-gray-700 border-b border-gray-100 pb-1 mb-1">Estados</h4>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          <span className="text-gray-600 font-medium">Pendiente</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
          <span className="text-gray-600 font-medium">Completado</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span className="text-gray-600 font-medium">Cancelado</span>
        </div>
        <div className="text-[9px] text-gray-400 pt-1 border-t border-gray-100 italic">
          Haz clic en el mapa para añadir paradas
        </div>
      </div>
    </div>
  );
};
export default MapView;
