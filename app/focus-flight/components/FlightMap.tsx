'use client';

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Coordinate } from '@/lib/focus-flight';

// Default to a public token if none is provided in env
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoicmFzaGlhbiIsImEiOiJjbHd6OXE0ZG0wMXZpMmlwZnp6cm5wNHJ6In0.r-0-U_2h-uG_z5X-U_2h';

interface FlightMapProps {
  origin: Coordinate;
  destination: Coordinate;
  progress: number;
  isActive: boolean;
}

export default function FlightMap({ origin, destination, progress, isActive }: FlightMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!mapContainer.current || initialized.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [origin.lng, origin.lat],
      zoom: 1.5,
      interactive: false,
      attributionControl: false,
    });

    map.current.on('load', () => {
      if (!map.current) return;

      // Add route line
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [origin.lng, origin.lat],
              [destination.lng, destination.lat],
            ],
          },
        },
      });

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#10b981',
          'line-width': 2,
          'line-opacity': 0.3,
          'line-dasharray': [3, 3],
        },
      });

      // Airplane marker
      const el = document.createElement('div');
      el.className = 'airplane-marker';
      el.style.transition = 'transform 0.2s linear';
      el.innerHTML = `
        <div style="filter: drop-shadow(0 0 12px rgba(16, 185, 129, 0.6))">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="#10b981">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
          </svg>
        </div>
      `;

      marker.current = new mapboxgl.Marker(el)
        .setLngLat([origin.lng, origin.lat])
        .addTo(map.current);

      if (isActive) {
        map.current.flyTo({
          center: [origin.lng, origin.lat],
          zoom: 5,
          duration: 4000,
          essential: true
        });
      }
      
      initialized.current = true;
    });

    return () => {
      map.current?.remove();
      map.current = null;
      initialized.current = false;
    };
  }, [origin.lat, origin.lng, destination.lat, destination.lng]);

  // Update route line when coordinates change
  useEffect(() => {
    if (!map.current || !initialized.current) return;
    const source = map.current.getSource('route') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [origin.lng, origin.lat],
            [destination.lng, destination.lat],
          ],
        },
      });
    }
  }, [origin.lat, origin.lng, destination.lat, destination.lng]);

  // Smooth position updates
  useEffect(() => {
    if (!map.current || !marker.current || !initialized.current) return;

    if (!isActive) {
      marker.current.getElement().style.display = 'none';
      return;
    } else {
      marker.current.getElement().style.display = 'block';
    }

    const currentLng = origin.lng + (destination.lng - origin.lng) * progress;
    const currentLat = origin.lat + (destination.lat - origin.lat) * progress;

    marker.current.setLngLat([currentLng, currentLat]);
    
    // Calculate rotation
    const angle = Math.atan2(destination.lat - origin.lat, destination.lng - origin.lng) * 180 / Math.PI;
    const svg = marker.current.getElement().querySelector('svg');
    if (svg) svg.style.transform = `rotate(${90 - angle}deg)`;

    // Camera follow
    map.current.easeTo({
      center: [currentLng, currentLat],
      duration: 1000,
      easing: (t) => t,
    });

    // Landing zoom
    if (progress >= 0.99) {
      map.current.flyTo({
        center: [destination.lng, destination.lat],
        zoom: 12,
        duration: 5000,
        essential: true
      });
    }
  }, [progress, origin, destination, isActive]);

  return (
    <div className="absolute inset-0 w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      {/* Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(10,10,11,0.4)_70%,rgba(10,10,11,0.8)_100%)]" />
    </div>
  );
}
