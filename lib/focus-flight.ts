export interface FlightSession {
  id: string;
  task: string;
  duration: number; // in minutes
  startTime: number; // timestamp
  status: 'active' | 'completed' | 'interrupted';
  subject?: string;
  difficulty?: string;
  focusRating?: number;
  reflection?: string;
  interruptionCount: number;
  lastActive: number;
  elapsedSeconds: number;
  gate: string;
  seatClass: string;
  destination: Destination;
}

export interface Destination {
  city: string;
  country: string;
  code: string;
  region: 'Domestic' | 'International' | 'Intercontinental';
  minDuration: number;
}

export interface FlightHistory {
  sessions: FlightSession[];
  totalDistance: number; // total focus minutes
  streak: number;
  lastFlightDate?: string;
  unlockedDestinations: string[]; // city codes
}

export const DESTINATIONS: Destination[] = [
  { city: 'London', country: 'UK', code: 'LHR', region: 'Domestic', minDuration: 15 },
  { city: 'Paris', country: 'France', code: 'CDG', region: 'Domestic', minDuration: 25 },
  { city: 'Berlin', country: 'Germany', code: 'BER', region: 'Domestic', minDuration: 25 },
  { city: 'New York', country: 'USA', code: 'JFK', region: 'International', minDuration: 45 },
  { city: 'Tokyo', country: 'Japan', code: 'HND', region: 'Intercontinental', minDuration: 60 },
  { city: 'Sydney', country: 'Australia', code: 'SYD', region: 'Intercontinental', minDuration: 90 },
  { city: 'Dubai', country: 'UAE', code: 'DXB', region: 'International', minDuration: 45 },
  { city: 'Singapore', country: 'Singapore', code: 'SIN', region: 'International', minDuration: 45 },
  { city: 'Reykjavik', country: 'Iceland', code: 'KEF', region: 'International', minDuration: 25 },
  { city: 'Rio de Janeiro', country: 'Brazil', code: 'GIG', region: 'Intercontinental', minDuration: 60 },
];

const STORAGE_KEY = 'focus_flight_data_v2';
const ACTIVE_FLIGHT_KEY = 'focus_flight_active';

export const getFlightHistory = (): FlightHistory => {
  if (typeof window === 'undefined') return { sessions: [], totalDistance: 0, streak: 0, unlockedDestinations: [] };
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : { sessions: [], totalDistance: 0, streak: 0, unlockedDestinations: [] };
};

export const saveFlightSession = (session: FlightSession) => {
  const history = getFlightHistory();
  const newSessions = [...history.sessions, session];
  
  // Calculate streak
  let streak = history.streak;
  const today = new Date().toISOString().split('T')[0];
  if (history.lastFlightDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (history.lastFlightDate === yesterday) {
      streak += 1;
    } else if (!history.lastFlightDate) {
      streak = 1;
    } else {
      streak = 1;
    }
  }

  // Update unlocked destinations
  const unlocked = new Set(history.unlockedDestinations);
  if (session.status === 'completed') {
    unlocked.add(session.destination.code);
  }

  const newHistory: FlightHistory = {
    sessions: newSessions,
    totalDistance: history.totalDistance + (session.status === 'completed' ? session.duration : 0),
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
