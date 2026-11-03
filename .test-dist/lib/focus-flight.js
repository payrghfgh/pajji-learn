"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setActiveFlight = exports.getActiveFlight = exports.saveFlightSession = exports.getFlightHistory = exports.ROUTES = exports.LOCATIONS = void 0;
exports.LOCATIONS = {
    BOM: { name: 'Mumbai', code: 'BOM', coords: { lat: 19.076, lng: 72.877 } },
    DEL: { name: 'Delhi', code: 'DEL', coords: { lat: 28.6139, lng: 77.2090 } },
    DXB: { name: 'Dubai', code: 'DXB', coords: { lat: 25.2048, lng: 55.2708 } },
    LHR: { name: 'London', code: 'LHR', coords: { lat: 51.5074, lng: -0.1278 } },
    SIN: { name: 'Singapore', code: 'SIN', coords: { lat: 1.3521, lng: 103.8198 } },
    HND: { name: 'Tokyo', code: 'HND', coords: { lat: 35.6762, lng: 139.6503 } },
    JFK: { name: 'New York', code: 'JFK', coords: { lat: 40.7128, lng: -74.0060 } },
};
exports.ROUTES = [
    { id: 'bom-del', from: exports.LOCATIONS.BOM, to: exports.LOCATIONS.DEL, duration: 25, difficulty: 'Relaxed' },
    { id: 'bom-sin', from: exports.LOCATIONS.BOM, to: exports.LOCATIONS.SIN, duration: 45, difficulty: 'Standard' },
    { id: 'bom-dxb', from: exports.LOCATIONS.BOM, to: exports.LOCATIONS.DXB, duration: 60, difficulty: 'Standard' },
    { id: 'bom-lhr', from: exports.LOCATIONS.BOM, to: exports.LOCATIONS.LHR, duration: 90, difficulty: 'Demanding' },
    { id: 'bom-hnd', from: exports.LOCATIONS.BOM, to: exports.LOCATIONS.HND, duration: 90, difficulty: 'Demanding' },
    { id: 'bom-jfk', from: exports.LOCATIONS.BOM, to: exports.LOCATIONS.JFK, duration: 120, difficulty: 'Demanding' },
];
const STORAGE_KEY = 'focus_flight_data_v4';
const ACTIVE_FLIGHT_KEY = 'focus_flight_active';
const getFlightHistory = () => {
    if (typeof window === 'undefined')
        return { sessions: [], totalDistance: 0, streak: 0, unlockedDestinations: [] };
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { sessions: [], totalDistance: 0, streak: 0, unlockedDestinations: [] };
};
exports.getFlightHistory = getFlightHistory;
const saveFlightSession = (session) => {
    const history = (0, exports.getFlightHistory)();
    const newSessions = [...history.sessions, session];
    let streak = history.streak;
    const today = new Date().toISOString().split('T')[0];
    if (history.lastFlightDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (history.lastFlightDate === yesterday) {
            streak += 1;
        }
        else {
            streak = 1;
        }
    }
    const unlocked = new Set(history.unlockedDestinations);
    if (session.status === 'completed') {
        unlocked.add(session.route.to.code);
    }
    const newHistory = {
        sessions: newSessions,
        totalDistance: history.totalDistance + (session.status === 'completed' ? session.route.duration : 0),
        streak,
        lastFlightDate: today,
        unlockedDestinations: Array.from(unlocked),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
};
exports.saveFlightSession = saveFlightSession;
const getActiveFlight = () => {
    if (typeof window === 'undefined')
        return null;
    const data = localStorage.getItem(ACTIVE_FLIGHT_KEY);
    return data ? JSON.parse(data) : null;
};
exports.getActiveFlight = getActiveFlight;
const setActiveFlight = (session) => {
    if (session) {
        localStorage.setItem(ACTIVE_FLIGHT_KEY, JSON.stringify(session));
    }
    else {
        localStorage.removeItem(ACTIVE_FLIGHT_KEY);
    }
};
exports.setActiveFlight = setActiveFlight;
