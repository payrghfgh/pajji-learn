export interface Coordinate {
  lat: number;
  lng: number;
}

export interface Location {
  name: string;
  code: string;
  coords: Coordinate;
}

export interface Route {
  id: string;
  from: Location;
  to: Location;
  duration: number; // in minutes
  difficulty: 'Relaxed' | 'Standard' | 'Demanding';
}

export interface FlightSession {
  id: string;
  task: string;
  startTime: number; // timestamp
  route: Route;
  status: 'active' | 'completed' | 'interrupted';
  focusRating?: number;
  reflection?: string;
  interruptionCount: number;
  lastActive: number;
  gate: string;
  seatClass: string;
}

export interface FlightHistory {
  sessions: FlightSession[];
  totalDistance: number; // total focus minutes
  streak: number;
  lastFlightDate?: string;
  unlockedDestinations: string[]; // city codes
}

export const LOCATIONS: Record<string, Location> = {
  BOM: { name: 'Mumbai', code: 'BOM', coords: { lat: 19.076, lng: 72.877 } },
  DEL: { name: 'Delhi', code: 'DEL', coords: { lat: 28.6139, lng: 77.2090 } },
  DXB: { name: 'Dubai', code: 'DXB', coords: { lat: 25.2048, lng: 55.2708 } },
  LHR: { name: 'London', code: 'LHR', coords: { lat: 51.5074, lng: -0.1278 } },
  SIN: { name: 'Singapore', code: 'SIN', coords: { lat: 1.3521, lng: 103.8198 } },
  HND: { name: 'Tokyo', code: 'HND', coords: { lat: 35.6762, lng: 139.6503 } },
  JFK: { name: 'New York', code: 'JFK', coords: { lat: 40.7128, lng: -74.0060 } },
};

export const ROUTES: Route[] = [
  { id: 'bom-del', from: LOCATIONS.BOM, to: LOCATIONS.DEL, duration: 25, difficulty: 'Relaxed' },
  { id: 'bom-sin', from: LOCATIONS.BOM, to: LOCATIONS.SIN, duration: 45, difficulty: 'Standard' },
  { id: 'bom-dxb', from: LOCATIONS.BOM, to: LOCATIONS.DXB, duration: 60, difficulty: 'Standard' },
  { id: 'bom-lhr', from: LOCATIONS.BOM, to: LOCATIONS.LHR, duration: 90, difficulty: 'Demanding' },
  { id: 'bom-hnd', from: LOCATIONS.BOM, to: LOCATIONS.HND, duration: 90, difficulty: 'Demanding' },
  { id: 'bom-jfk', from: LOCATIONS.BOM, to: LOCATIONS.JFK, duration: 120, difficulty: 'Demanding' },
];

const STORAGE_KEY = 'focus_flight_data_v4';
const ACTIVE_FLIGHT_KEY = 'focus_flight_active';

export const getFlightHistory = (): FlightHistory => {
  if (typeof window === 'undefined') return { sessions: [], totalDistance: 0, streak: 0, unlockedDestinations: [] };
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : { sessions: [], totalDistance: 0, streak: 0, unlockedDestinations: [] };
};

export const saveFlightSession = (session: FlightSession) => {
  const history = getFlightHistory();
  const newSessions = [...history.sessions, session];
  
  let streak = history.streak;
  const today = new Date().toISOString().split('T')[0];
  if (history.lastFlightDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (history.lastFlightDate === yesterday) {
      streak += 1;
    } else {
      streak = 1;
    }
  }

  const unlocked = new Set(history.unlockedDestinations);
  if (session.status === 'completed') {
    unlocked.add(session.route.to.code);
  }

  const newHistory: FlightHistory = {
    sessions: newSessions,
    totalDistance: history.totalDistance + (session.status === 'completed' ? session.route.duration : 0),
    streak,
    lastFlightDate: today,
    unlockedDestinations: Array.from(unlocked),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
};

export const getActiveFlight = (): FlightSession | null => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(ACTIVE_FLIGHT_KEY);
  return data ? JSON.parse(data) : null;
};

export const setActiveFlight = (session: FlightSession | null) => {
  if (session) {
    localStorage.setItem(ACTIVE_FLIGHT_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(ACTIVE_FLIGHT_KEY);
  }
};
