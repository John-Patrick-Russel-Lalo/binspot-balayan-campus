
import React, { useRef } from 'react';
import L from 'leaflet';
import { useWebSocket } from '@/lib/useWebSocket';
import MapControls from './MapControls';

// Fix Leaflet icon issues
import 'leaflet/dist/leaflet.css';

// Import our custom hooks
import { useMapInitialization } from './hooks/useMapInitialization';
import { useLocationTracking, DEFAULT_POSITION } from './hooks/useLocationTracking';
import { useBinManagement } from './hooks/useBinManagement';
import { useMapSearch } from './hooks/useMapSearch';

interface MapComponentProps {
  searchQuery: string | null;
}

const MapComponent: React.FC<MapComponentProps> = ({ searchQuery }) => {
  // Initialize refs
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Use WebSocket (simulated in development if needed)
  const wsUrl = import.meta.env.PROD ? 'ws://localhost:3000' : 'simulated';
  const { isConnected, message, sendMessage } = useWebSocket(wsUrl);
  
  // Use our custom hooks
  const { 
    binMarkers, 
    isPlacingBin, 
    setIsPlacingBin, 
    handleBinPlacement 
  } = useBinManagement({ 
    mapRef, 
    message, 
    sendMessage, 
    defaultPosition: DEFAULT_POSITION 
  });
  
  const { userPosition, handleGetLocation } = useLocationTracking({
    mapRef,
    isConnected,
    sendMessage
  });
  
  // Initialize the map
  useMapInitialization({
    mapContainerRef,
    mapRef,
    isPlacingBin,
    handleBinPlacement
  });
  
  // Search functionality
  useMapSearch({
    mapRef,
    searchQuery
  });
  
  return (
    <div className="flex flex-col h-full">
      <div className="w-full rounded-lg overflow-hidden shadow-lg mb-3" style={{ height: "60vh" }}>
        <div ref={mapContainerRef} style={{ height: "100%" }} />
      </div>
      
      <MapControls 
        isPlacingBin={isPlacingBin}
        setIsPlacingBin={setIsPlacingBin}
        handleGetLocation={handleGetLocation}
      />
    </div>
  );
};

export default MapComponent;
