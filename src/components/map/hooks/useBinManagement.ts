
import { useState, useEffect } from 'react';
import L from 'leaflet';
import { DefaultIcon } from '../utils/MapIcons';

// Define bin marker types
export interface BinMarker {
  id: string;
  position: [number, number];
}

interface UseBinManagementProps {
  mapRef: React.MutableRefObject<L.Map | null>;
  message: any;
  sendMessage: (message: any) => void;
  defaultPosition: [number, number];
}

export const useBinManagement = ({ 
  mapRef, 
  message, 
  sendMessage,
  defaultPosition
}: UseBinManagementProps) => {
  const [binMarkers, setBinMarkers] = useState<BinMarker[]>([]);
  const [isPlacingBin, setIsPlacingBin] = useState(false);

  // Initialize with a marker at BSU Balayan Campus
  useEffect(() => {
    setBinMarkers([
      {
        id: 'bsu-campus',
        position: defaultPosition
      }
    ]);
  }, [defaultPosition]);

  // Process WebSocket messages
  useEffect(() => {
    if (!message || !mapRef.current) return;
    
    const map = mapRef.current;
    
    switch (message.type) {
      case 'trashbin':
        const newBin = {
          id: `bin-${Date.now()}`,
          position: [message.latitude, message.longitude] as [number, number]
        };
        setBinMarkers(prev => [...prev, newBin]);
        
        L.marker([message.latitude, message.longitude], { icon: DefaultIcon })
          .addTo(map)
          .bindPopup('<b>Trash Bin</b>');
        break;
        
      case 'deletebin':
        setBinMarkers(prev => prev.filter(bin => bin.id !== message.id));
        break;
        
      case 'editbin':
        setBinMarkers(prev => prev.map(bin => {
          if (bin.position[0] === message.oldLatitude && bin.position[1] === message.oldLongitude) {
            return {
              ...bin,
              position: [message.newLatitude, message.newLongitude]
            };
          }
          return bin;
        }));
        break;
    }
  }, [message, mapRef]);

  const handleBinPlacement = (position: [number, number]) => {
    if (!mapRef.current) return;
    
    const newBin: BinMarker = {
      id: `bin-${Date.now()}`,
      position
    };
    
    setBinMarkers(prev => [...prev, newBin]);
    
    // Add marker to the map
    L.marker(position, { icon: DefaultIcon })
      .addTo(mapRef.current)
      .bindPopup('<b>Trash Bin</b>');
    
    sendMessage({
      type: 'trashbin',
      latitude: position[0],
      longitude: position[1]
    });
  };

  return {
    binMarkers,
    isPlacingBin,
    setIsPlacingBin,
    handleBinPlacement
  };
};
