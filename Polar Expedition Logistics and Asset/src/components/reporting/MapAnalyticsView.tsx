import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Layers, 
  MapPin, 
  Ship, 
  ShieldAlert, 
  CloudLightning, 
  Compass, 
  Maximize2, 
  CheckSquare, 
  Square,
  Navigation
} from 'lucide-react';
import { StationReportItem } from '../../types.ts';

interface MapAnalyticsViewProps {
  stations?: StationReportItem[];
}

export const MapAnalyticsView: React.FC<MapAnalyticsViewProps> = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);

  const [showStations, setShowStations] = useState(true);
  const [showVessels, setShowVessels] = useState(true);
  const [showEmergencies, setShowEmergencies] = useState(true);
  const [showWeatherZones, setShowWeatherZones] = useState(true);

  const stationsData = [
    { id: 'bharati', name: 'Bharati Station', lat: -69.407, lng: 76.187, role: 'Active Winter Base', personnel: 24, temp: '-18°C' },
    { id: 'maitri', name: 'Maitri Station', lat: -70.767, lng: 11.733, role: 'Active Inland Oasis', personnel: 18, temp: '-22°C' },
    { id: 'cape_town', name: 'Cape Town Staging Port', lat: -33.918, lng: 18.423, role: 'Gateway Logistics Hub', personnel: 8, temp: '+16°C' },
    { id: 'goa', name: 'NCPOR Headquarters (Goa)', lat: 15.402, lng: 73.805, role: 'Central Polar Command', personnel: 45, temp: '+29°C' }
  ];

  const vesselsData = [
    { id: 'vessel_golovnin', name: 'MV Vasiliy Golovnin', lat: -68.8, lng: 75.9, status: 'Fast-Ice Discharge', speed: '0.0 kn' },
    { id: 'vessel_agulhas', name: 'SA Agulhas II', lat: -54.2, lng: 35.8, status: 'Southern Ocean Transit', speed: '12.4 kn' },
  ];

  const emergencyZones = [
    { id: 'em-1', title: 'Crevasse Hazard Zone', lat: -70.78, lng: 11.75, radius: 15000, severity: 'HIGH' }
  ];

  const weatherAlertZones = [
    { id: 'w-1', title: 'Blizzard Gale Warning Zone (Prydz Bay)', lat: -69.2, lng: 76.5, radius: 45000, wind: '58 kt' }
  ];

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [-60.0, 45.0],
        zoom: 3,
        minZoom: 2,
        maxZoom: 10,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      layersGroupRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
    }

    renderLayers();

    return () => {
      // Keep map instance alive during subtab clicks if mounted
    };
  }, []);

  useEffect(() => {
    renderLayers();
  }, [showStations, showVessels, showEmergencies, showWeatherZones]);

  const renderLayers = () => {
    if (!mapRef.current || !layersGroupRef.current) return;
    layersGroupRef.current.clearLayers();

    // 1. Weather Advisory Zones
    if (showWeatherZones) {
      weatherAlertZones.forEach((w) => {
        L.circle([w.lat, w.lng], {
          radius: w.radius,
          color: '#0284c7',
          fillColor: '#38bdf8',
          fillOpacity: 0.2,
          weight: 1.5,
          dashArray: '5, 5',
        })
          .bindPopup(`<div style="font-size:12px"><strong>${w.title}</strong><br/>Wind Speed: ${w.wind}</div>`)
          .addTo(layersGroupRef.current!);
      });
    }

    // 2. Emergency Hazard Geofence
    if (showEmergencies) {
      emergencyZones.forEach((em) => {
        L.circle([em.lat, em.lng], {
          radius: em.radius,
          color: '#e11d48',
          fillColor: '#f43f5e',
          fillOpacity: 0.35,
          weight: 2,
        })
          .bindPopup(`<div style="font-size:12px"><strong>${em.title}</strong><br/>Severity: ${em.severity}</div>`)
          .addTo(layersGroupRef.current!);
      });
    }

    // 3. Shipping Route Polyline (Cape Town -> Bharati)
    if (showVessels) {
      const voyageRoute: [number, number][] = [
        [-33.918, 18.423],
        [-45.0, 35.0],
        [-54.2, 55.0],
        [-65.0, 70.0],
        [-69.407, 76.187],
      ];

      L.polyline(voyageRoute, {
        color: '#2563eb',
        weight: 2.5,
        dashArray: '6, 6',
        opacity: 0.8,
      }).addTo(layersGroupRef.current!);

      // Vessel Markers
      vesselsData.forEach((v) => {
        const iconHtml = `<div style="background:#2563eb;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid white">🚢</div>`;
        const customIcon = L.divIcon({
          html: iconHtml,
          className: '',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        L.marker([v.lat, v.lng], { icon: customIcon })
          .bindPopup(`
            <div style="font-size:12px; font-family:sans-serif">
              <strong style="color:#1e3a8a">${v.name}</strong><br/>
              Status: ${v.status}<br/>
              Speed: ${v.speed}<br/>
              Pos: ${v.lat.toFixed(2)}°, ${v.lng.toFixed(2)}°
            </div>
          `)
          .addTo(layersGroupRef.current!);
      });
    }

    // 4. Station Markers
    if (showStations) {
      stationsData.forEach((s) => {
        const isAntarctic = s.lat < -60;
        const bg = isAntarctic ? '#0284c7' : '#059669';
        const iconHtml = `<div style="background:${bg};color:white;width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.25);border:2px solid white;font-weight:bold;font-size:11px">📍</div>`;
        const customIcon = L.divIcon({
          html: iconHtml,
          className: '',
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        L.marker([s.lat, s.lng], { icon: customIcon })
          .bindPopup(`
            <div style="font-size:12px; font-family:sans-serif">
              <strong style="color:#0f172a">${s.name}</strong><br/>
              Role: ${s.role}<br/>
              Personnel: ${s.personnel} deployed<br/>
              Temp: ${s.temp}<br/>
              Coordinates: ${s.lat.toFixed(3)}°S, ${s.lng.toFixed(3)}°E
            </div>
          `)
          .addTo(layersGroupRef.current!);
      });
    }
  };

  const handleResetCenter = () => {
    if (mapRef.current) {
      mapRef.current.setView([-60.0, 45.0], 3);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Map Layer Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Polar GIS Operational Theater</h3>
            <p className="text-xs text-slate-500">Live geospatial tracking of Antarctic bases, voyage corridors, and hazards</p>
          </div>
        </div>

        {/* Layer Toggles */}
        <div className="flex items-center gap-3 flex-wrap text-xs">
          <button
            onClick={() => setShowStations(!showStations)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold border transition-all ${
              showStations
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Stations</span>
          </button>

          <button
            onClick={() => setShowVessels(!showVessels)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold border transition-all ${
              showVessels
                ? 'bg-blue-50 border-blue-300 text-blue-800'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <Ship className="w-3.5 h-3.5" />
            <span>Vessels & Routes</span>
          </button>

          <button
            onClick={() => setShowEmergencies(!showEmergencies)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold border transition-all ${
              showEmergencies
                ? 'bg-rose-50 border-rose-300 text-rose-800'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Hazards</span>
          </button>

          <button
            onClick={() => setShowWeatherZones(!showWeatherZones)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold border transition-all ${
              showWeatherZones
                ? 'bg-sky-50 border-sky-300 text-sky-800'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <CloudLightning className="w-3.5 h-3.5" />
            <span>Weather Geofence</span>
          </button>

          <button
            onClick={handleResetCenter}
            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600"
            title="Recenter Map"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs relative">
        <div ref={mapContainerRef} className="h-[520px] w-full z-10" />

        {/* On-map Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-md text-xs space-y-1.5 pointer-events-auto">
          <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">Geospatial Legend</span>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded bg-sky-600 inline-block" />
            <span className="text-slate-700">Antarctic Research Station</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded bg-blue-600 inline-block" />
            <span className="text-slate-700">Polar Logistics Vessel & Transit Path</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded bg-rose-600 inline-block" />
            <span className="text-slate-700">Active Crevasse / Safety Alert Zone</span>
          </div>
        </div>
      </div>
    </div>
  );
};
