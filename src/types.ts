export interface RoutePoint {
  id: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  notes?: string;
  time?: string;
  status: 'pending' | 'completed' | 'canceled';
}

export type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';

export interface User {
  id: string;
  name: string;
  role: 'normal' | 'viewer';
}

export interface MasterClient {
  id: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  notes?: string;
  time?: string;
  sort_order: number;
}

export interface RouteAssignment {
  id: string;
  user_id: string;
  day: DayOfWeek;
  client_id: string;
  status: 'pending' | 'completed' | 'canceled';
  sort_order: number;
}

export interface ViewerOrderEntry {
  viewer_id: string;
  day: string;
  assignment_id: string;
  sort_order: number;
}

export interface AssignedClient extends MasterClient {
  assignment_id: string;
  user_id: string;
  day: DayOfWeek;
  status: 'pending' | 'completed' | 'canceled';
  assignment_order: number;
}

export interface UserRoutes {
  [userId: string]: {
    [day in DayOfWeek]?: RoutePoint[];
  };
}
