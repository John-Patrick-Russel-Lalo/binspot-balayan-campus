
import { useState, useEffect } from 'react';
import L from 'leaflet';
import Swal from 'sweetalert2';
import { DefaultIcon } from '../utils/MapIcons';

// Default BSU Balayan Campus location
export const DEFAULT_POSITION: [number, number] = [13.94827, 120.71993];

interface UseLocationTrackingProps {
  mapRef: React.MutableRefObject<L.Map | null>;
  isConnected: boolean;
  sendMessage: (message: any) => void;
}

export const useLocationTracking = ({ 
  mapRef, 
  isConnected, 
  sendMessage 
}: UseLocationTrackingProps) => {
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    let watchId: number | null = null;
    
    const startTracking = () => {
      if (!navigator.geolocation) {
        Swal.fire('Error', 'Geolocation is not supported by your browser.', 'error');
        return;
      }
      
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserPosition([latitude, longitude]);
          
          if (mapRef.current && userPosition) {
            L.marker([latitude, longitude], { icon: DefaultIcon })
              .addTo(mapRef.current)
              .bindPopup('You are here!');
          }
          
          // Send location to WebSocket if connected
          if (isConnected) {
            sendMessage({
              type: 'location',
              latitude,
              longitude
            });
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
        },
        {
          enableHighAccuracy: true
        }
      );
    };
    
    // Clean up function
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isConnected, mapRef, sendMessage, userPosition]);

  const handleGetLocation = () => {
    if (userPosition && mapRef.current) {
      mapRef.current.setView(userPosition, 18);
      return;
    }
    
    Swal.fire({
      title: "Click OK to Enable Location",
      confirmButtonColor: "#2c3e50"
    }).then(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserPosition([latitude, longitude]);
            
            if (mapRef.current) {
              mapRef.current.setView([latitude, longitude], 18);
            }
          },
          (error) => {
            console.error("Error getting location:", error);
            Swal.fire('Error', 'Could not get your location.', 'error');
          }
        );
      } else {
        Swal.fire('Error', 'Geolocation is not supported by your browser.', 'error');
      }
    });
  };

  return {
    userPosition,
    handleGetLocation
  };
};
