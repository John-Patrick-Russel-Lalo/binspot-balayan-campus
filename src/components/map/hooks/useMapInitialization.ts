
import { useEffect } from 'react';
import L from 'leaflet';
import { DEFAULT_POSITION } from './useLocationTracking';
import { DefaultIcon } from '../utils/MapIcons';

interface UseMapInitializationProps {
  mapContainerRef: React.RefObject<HTMLDivElement>;
  mapRef: React.MutableRefObject<L.Map | null>;
  isPlacingBin: boolean;
  handleBinPlacement: (position: [number, number]) => void;
}

export const useMapInitialization = ({
  mapContainerRef,
  mapRef,
  isPlacingBin,
  handleBinPlacement
}: UseMapInitializationProps) => {
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Initialize the map
    const map = L.map(mapContainerRef.current).setView(DEFAULT_POSITION, 15);
    mapRef.current = map;
    
    // Add tile layers
    const streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 20
    }).addTo(map);
    
    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri &mdash; Source: Esri, Earthstar Geographics',
      maxZoom: 20
    });
    
    const dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CartoDB',
      maxZoom: 20
    });
    
    const light = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CartoDB',
      maxZoom: 20
    });
    
    // Add layer control
    const baseLayers = {
      "Streets": streets,
      "Satellite": satellite,
      "Dark": dark,
      "Light": light
    };
    
    L.control.layers(baseLayers).addTo(map);
    
    // Add campus marker
    L.marker(DEFAULT_POSITION, { icon: DefaultIcon })
      .addTo(map)
      .bindPopup("<b>Batangas State University Balayan Campus</b>");
    
    // Add map click event for bin placement
    map.on('click', (e) => {
      if (isPlacingBin) {
        const position: [number, number] = [e.latlng.lat, e.latlng.lng];
        handleBinPlacement(position);
      }
    });
    
    return () => {
      map.remove();
    };
  }, [mapContainerRef, mapRef, isPlacingBin, handleBinPlacement]);
};
