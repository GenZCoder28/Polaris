import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Station, 
  Vessel, 
  Container, 
  EmergencyIncident 
} from '../types';
import { 
  Compass, 
  Ship, 
  MapPin, 
  Globe, 
  Snowflake, 
  Anchor, 
  Layers, 
  Navigation,
  CheckCircle2
} from 'lucide-react';

interface PolarMapProps {
  stations: Station[];
  vessels: Vessel[];
  containers?: Container[];
  emergencies?: EmergencyIncident[];
  onSelectStation?: (stationId: string) => void;
  onSelectContainer?: (containerCode: string) => void;
  showVesselCards?: boolean;
  mapHeightClassName?: string;
}

export const PolarMap: React.FC<PolarMapProps> = ({
  stations,
  vessels,
  onSelectStation,
  showVesselCards = true,
  mapHeightClassName,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const routesLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'station' | 'vessel';
    data: any;
  } | null>(null);

  const [activeTileType, setActiveTileType] = useState<'voyager' | 'satellite' | 'ocean'>('voyager');
  const [mapReadyCount, setMapReadyCount] = useState<number>(0);

  const TILE_CONFIGS = {
    voyager: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      options: {
        maxZoom: 18,
        minZoom: 1,
        attribution: '&copy; Esri, DeLorme, NAVTEQ, USGS, Intermap, METI, NRCAN',
      },
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      options: {
        maxZoom: 18,
        minZoom: 1,
        attribution: '&copy; Esri, Maxar, Earthstar Geographics',
      },
    },
    ocean: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}',
      options: {
        maxZoom: 13,
        minZoom: 1,
        attribution: '&copy; Esri, GEBCO, NOAA',
      },
    },
  };

  const changeTileLayer = (type: 'voyager' | 'satellite' | 'ocean') => {
    setActiveTileType(type);
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      try {
        mapInstanceRef.current.removeLayer(tileLayerRef.current);
      } catch (e) {
        console.warn('Error removing old tile layer:', e);
      }
    }
    const config = TILE_CONFIGS[type];
    const newLayer = L.tileLayer(config.url, config.options).addTo(mapInstanceRef.current);
    newLayer.bringToBack();
    tileLayerRef.current = newLayer;
  };

  // Initialize Leaflet Map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    // Safely cleanup previous instance if any
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (err) {
        console.warn('Error removing previous map:', err);
      }
      mapInstanceRef.current = null;
    }

    // Prevent "Map container is already initialized" error in React StrictMode
    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
    }
    container.innerHTML = '';

    // Initialize Map instance
    const map = L.map(container, {
      center: [-55.0, 48.0],
      zoom: 2.5,
      minZoom: 1,
      maxZoom: 18,
      worldCopyJump: true,
      zoomControl: false,
      scrollWheelZoom: true,
      touchZoom: true,
      doubleClickZoom: true,
      zoomSnap: 0.5,
      zoomDelta: 0.5,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const initialConfig = TILE_CONFIGS[activeTileType];
    const baseTile = L.tileLayer(initialConfig.url, initialConfig.options).addTo(map);

    tileLayerRef.current = baseTile;
    routesLayerGroupRef.current = L.layerGroup().addTo(map);
    markersLayerGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    setMapReadyCount((c) => c + 1);

    // Invalidation passes to ensure tiles render immediately
    map.whenReady(() => {
      map.invalidateSize();
    });

    const timer1 = setTimeout(() => map.invalidateSize(), 80);
    const timer2 = setTimeout(() => map.invalidateSize(), 250);
    const timer3 = setTimeout(() => map.invalidateSize(), 600);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(container);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      try {
        map.remove();
      } catch (e) {
        console.warn('Map cleanup error:', e);
      }
      mapInstanceRef.current = null;
    };
  }, []);

  // Render Routes and Moorings
  useEffect(() => {
    if (!mapInstanceRef.current || !routesLayerGroupRef.current) return;
    const routesGroup = routesLayerGroupRef.current;
    routesGroup.clearLayers();

    // Antarctic Treaty Perimeter (60°S)
    const treatyLineCoords: L.LatLngTuple[] = [];
    for (let lng = -180; lng <= 180; lng += 15) {
      treatyLineCoords.push([-60.0, lng]);
    }
    const treatyLine = L.polyline(treatyLineCoords, {
      color: '#0284c7',
      weight: 2,
      dashArray: '8, 6',
      opacity: 0.8,
    });
    treatyLine.bindTooltip('Antarctic Treaty Perimeter (60°S)', {
      sticky: true,
      className: 'bg-blue-900 text-white font-mono text-xs px-2 py-1 rounded shadow-md border border-blue-400',
    });
    routesGroup.addLayer(treatyLine);

    // Primary Logistics Resupply Line: Cape Town -> Fast-Ice -> Bharati
    const primaryResupplyRoute: L.LatLngTuple[] = [
      [15.3991, 73.8114],  // Goa HQ
      [-33.9188, 18.4233], // Cape Town Depot
      [-52.41, 48.25],     // MV Vasiliy Golovnin in Southern Ocean
      [-65.0, 68.0],       // Fast-Ice Mooring Edge
      [-69.4072, 76.1872]  // Bharati Station
    ];

    const routePolyline = L.polyline(primaryResupplyRoute, {
      color: '#2563eb',
      weight: 3,
      opacity: 0.85,
    });
    routePolyline.bindTooltip('Primary Voyage Route: Cape Town ➔ Fast-Ice ➔ Bharati Station', {
      sticky: true,
      className: 'bg-blue-950 text-white font-sans text-xs px-2 py-1 rounded shadow',
    });
    routesGroup.addLayer(routePolyline);

    // Feeder line to Maitri Station
    const maitriRoute: L.LatLngTuple[] = [
      [-33.9188, 18.4233], // Cape Town
      [-68.0, 12.0],       // Princess Astrid Coast Fast-Ice
      [-70.7667, 11.7333]  // Maitri Station
    ];
    const maitriPolyline = L.polyline(maitriRoute, {
      color: '#0891b2',
      weight: 2,
      dashArray: '5, 5',
      opacity: 0.75,
    });
    maitriPolyline.bindTooltip('Feeder Route: Cape Town ➔ Maitri Station', {
      sticky: true,
      className: 'bg-slate-900 text-white font-sans text-xs px-2 py-1 rounded',
    });
    routesGroup.addLayer(maitriPolyline);
  }, [mapReadyCount]);

  // Render Station and Vessel Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerGroupRef.current) return;
    const markersGroup = markersLayerGroupRef.current;
    markersGroup.clearLayers();

    // 1. Stations
    stations.forEach((st) => {
      if (!st.coordinates || typeof st.coordinates.lat !== 'number' || typeof st.coordinates.lng !== 'number') return;
      const isHQ = st.id === 'goa_hq';
      const isCapeTown = st.id === 'cape_town';
      const pinColor = isHQ ? '#059669' : isCapeTown ? '#d97706' : '#2563eb';

      const iconHtml = `
        <div class="cursor-pointer" style="transform: translate(-50%, -100%);">
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-md text-white font-sans text-xs font-semibold whitespace-nowrap"
               style="background-color: ${pinColor}; border: 1.5px solid #ffffff;">
            <span>${isHQ ? '🏢' : isCapeTown ? '⚓' : '❄️'}</span>
            <span>${st.name}</span>
          </div>
          <div class="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] mx-auto"
               style="border-t-color: ${pinColor}; margin-top: -1px;"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'station-marker-div',
        html: iconHtml,
        iconSize: [140, 32],
        iconAnchor: [70, 32],
      });

      const marker = L.marker([st.coordinates.lat, st.coordinates.lng], { icon: customIcon });
      marker.on('click', () => {
        setSelectedEntity({ type: 'station', data: st });
        if (onSelectStation) onSelectStation(st.id);
      });
      markersGroup.addLayer(marker);
    });

    // 2. Vessels
    vessels.forEach((v) => {
      const coords = v.coordinates || (v as any).currentCoordinates;
      if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') return;
      const isGolovnin = v.id === 'vessel_golovnin';
      const vesselColor = isGolovnin ? '#0284c7' : '#475569';

      const iconHtml = `
        <div class="cursor-pointer" style="transform: translate(-50%, -100%);">
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-lg text-white font-sans text-xs font-bold whitespace-nowrap"
               style="background-color: ${vesselColor}; border: 2px solid #ffffff;">
            <span>🚢</span>
            <span>${v.name}</span>
            <span class="bg-black/25 text-[10px] px-1 py-0.2 rounded font-mono font-normal">
              ${isGolovnin ? 'En Route' : 'Staged'}
            </span>
          </div>
          <div class="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] mx-auto"
               style="border-t-color: ${vesselColor}; margin-top: -1px;"></div>
        </div>
      `;

      const vesselIcon = L.divIcon({
        className: 'vessel-marker-div',
        html: iconHtml,
        iconSize: [160, 34],
        iconAnchor: [80, 34],
      });

      const marker = L.marker([coords.lat, coords.lng], { icon: vesselIcon });
      marker.on('click', () => {
        setSelectedEntity({ type: 'vessel', data: v });
      });
      markersGroup.addLayer(marker);
    });
  }, [mapReadyCount, stations, vessels, onSelectStation]);

  const handleFlyTo = (lat: number, lng: number, zoom: number = 5) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([lat, lng], zoom, { duration: 1.2 });
  };

  const handleZoomIn = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.zoomOut();
  };

  return (
    <div className={showVesselCards ? "space-y-4" : "h-full flex flex-col"}>
      {/* Feature 1: Polar Vessel Fleet Overview (Shown when showVesselCards is true) */}
      {showVesselCards && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Vessel 1: MV Vasiliy Golovnin */}
          <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                  <Ship className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">MV Vasiliy Golovnin</h4>
                  <div className="text-xs text-blue-700 font-semibold font-mono">
                    Ice-Class 1A Super • Callsign: UBST-928
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Active Voyage
              </span>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Voyage Leg</span>
                <span className="font-medium text-slate-800">Cape Town ➔ Fast-Ice Mooring</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Destination Station</span>
                <span className="font-bold text-blue-800">Bharati Station (Prydz Bay)</span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">
                Fast-Ice Mooring: Staged for Offload
              </span>
              <button
                onClick={() => handleFlyTo(-52.41, 48.25, 5)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Locate on Map</span>
                <Navigation className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Vessel 2: SA Agulhas II */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                  <Anchor className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">SA Agulhas II</h4>
                  <div className="text-xs text-slate-600 font-semibold font-mono">
                    Polar Supply & Research Vessel • Callsign: ZR6718
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Staging at Port
              </span>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Current Location</span>
                <span className="font-medium text-slate-800">Cape Town Logistics Depot</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Destination Station</span>
                <span className="font-bold text-slate-800">Maitri Station (Queen Maud Land)</span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">
                Depot Staging: Supplies Ready
              </span>
              <button
                onClick={() => handleFlyTo(-33.9188, 18.4233, 6)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Locate on Map</span>
                <Navigation className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature 4: Interactive Polar AIS Map & Fast-Ice Moorings */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs h-full flex flex-col">
        {/* Simple Map Header Toolbar */}
        <div className="border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2.5">
            <Compass className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Polar Navigation & Fast-Ice Moorings
            </h3>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
              (60°S Treaty Geofence & Resupply Corridors)
            </span>
          </div>

          {/* Controls: Layer Switcher + Jump Navigation */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Layer Switcher */}
            <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg text-[11px] border border-slate-200">
              <button
                type="button"
                onClick={() => changeTileLayer('voyager')}
                className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                  activeTileType === 'voyager'
                    ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Navigation
              </button>
              <button
                type="button"
                onClick={() => changeTileLayer('satellite')}
                className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                  activeTileType === 'satellite'
                    ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Satellite
              </button>
              <button
                type="button"
                onClick={() => changeTileLayer('ocean')}
                className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                  activeTileType === 'ocean'
                    ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ocean
              </button>
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* Jump Navigation Buttons */}
            <div className="flex items-center gap-1 font-medium">
              <button
                type="button"
                onClick={() => handleFlyTo(-50.0, 45.0, 1.5)}
                className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              >
                Global View
              </button>
              <button
                type="button"
                onClick={() => handleFlyTo(-52.41, 48.25, 5)}
                className="px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 transition font-semibold cursor-pointer"
              >
                MV Golovnin
              </button>
              <button
                type="button"
                onClick={() => handleFlyTo(-69.4072, 76.1872, 6)}
                className="px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 transition font-semibold cursor-pointer"
              >
                Bharati Fast-Ice
              </button>
              <button
                type="button"
                onClick={() => handleFlyTo(-70.7667, 11.7333, 6)}
                className="px-2.5 py-1 rounded-md bg-cyan-50 hover:bg-cyan-100 text-cyan-700 transition font-semibold cursor-pointer"
              >
                Maitri Station
              </button>
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* Direct Zoom In / Zoom Out Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleZoomIn}
                title="Zoom in (+)"
                className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm cursor-pointer shadow-2xs active:scale-95 transition"
              >
                +
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                title="Zoom out (−)"
                className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base leading-none cursor-pointer shadow-2xs active:scale-95 transition"
              >
                −
              </button>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className={mapHeightClassName || "relative w-full min-h-[520px] bg-[#dbeafe] select-none flex-1"}>
          <div
            ref={mapContainerRef}
            className="w-full h-full min-h-[520px] z-0"
            style={{ width: '100%', height: '100%', minHeight: '520px' }}
          />

          {/* Simple Selected Entity Card */}
          {selectedEntity && (
            <div className="absolute bottom-4 left-4 z-[1000] max-w-xs w-full bg-white border border-slate-200 rounded-xl p-3.5 shadow-xl text-xs">
              <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h5 className="font-bold text-slate-900 text-sm">{selectedEntity.data.name}</h5>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {selectedEntity.type === 'station' ? selectedEntity.data.region : selectedEntity.data.callsign}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedEntity(null)}
                  className="text-slate-400 hover:text-slate-700 font-bold px-1.5 py-0.5 rounded bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <div className="mt-2 space-y-1 text-slate-600 text-xs">
                {selectedEntity.type === 'vessel' ? (
                  <>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <strong className="text-blue-700">En Route to Fast-Ice</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Destination:</span>
                      <strong className="text-slate-800">{selectedEntity.data.destination}</strong>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span>Commander:</span>
                      <strong className="text-slate-800">{selectedEntity.data.commander}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <strong className="text-emerald-700">{selectedEntity.data.status}</strong>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
