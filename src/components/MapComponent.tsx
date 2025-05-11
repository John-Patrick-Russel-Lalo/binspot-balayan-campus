
import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import Swal from 'sweetalert2';
import { useWebSocket } from '@/lib/useWebSocket';
import { Button } from '@/components/ui/button';
import { MapPin, Trash2 } from 'lucide-react';

// Fix Leaflet icon issues
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Default BSU Balayan Campus location
const DEFAULT_POSITION: [number, number] = [13.94827, 120.71993];

// Define bin marker types
interface BinMarker {
  id: string;
  position: [number, number];
}

// Define marker icons
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapComponentProps {
  searchQuery: string | null;
}

const MapComponent: React.FC<MapComponentProps> = ({ searchQuery }) => {
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [binMarkers, setBinMarkers] = useState<BinMarker[]>([]);
  const [isPlacingBin, setIsPlacingBin] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Use WebSocket (simulated in development if needed)
  const wsUrl = import.meta.env.PROD ? 'ws://localhost:3000' : 'simulated';
  const { isConnected, message, sendMessage } = useWebSocket(wsUrl);
  
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
    
    // Initialize with a marker at BSU Balayan Campus
    setBinMarkers([
      {
        id: 'bsu-campus',
        position: DEFAULT_POSITION
      }
    ]);
    
    // Add map click event for bin placement
    map.on('click', (e) => {
      if (isPlacingBin) {
        const position: [number, number] = [e.latlng.lat, e.latlng.lng];
        handleBinPlacement(position);
        setIsPlacingBin(false);
      }
    });
    
    return () => {
      map.remove();
    };
  }, [isPlacingBin]); // Added isPlacingBin to dependency array
  
  // Watch for location changes
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
            const userIcon = L.icon({
              iconUrl: icon,
              shadowUrl: iconShadow,
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            });
            
            L.marker([latitude, longitude], { icon: userIcon })
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
  }, [isConnected, sendMessage, userPosition]);
  
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
  }, [message]);
  
  useEffect(() => {
    // Handle search query changes
    if (!searchQuery || !mapRef.current) return;
    
    const performSearch = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
        );
        const data = await response.json();
        
        if (data && data.length > 0 && mapRef.current) {
          const place = data[0];
          if (place.boundingbox) {
            const bounds = [
              [parseFloat(place.boundingbox[0]), parseFloat(place.boundingbox[2])],
              [parseFloat(place.boundingbox[1]), parseFloat(place.boundingbox[3])]
            ];
            mapRef.current.fitBounds(bounds as L.LatLngBoundsLiteral);
          } else {
            mapRef.current.setView([parseFloat(place.lat), parseFloat(place.lon)], 15);
          }
        } else {
          Swal.fire('Not Found', 'Place not found.', 'error');
        }
      } catch (error) {
        console.error('Error searching:', error);
        Swal.fire('Error', 'Something went wrong with the search.', 'error');
      }
    };
    
    performSearch();
  }, [searchQuery]);
  
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
  
  return (
    <div className="flex flex-col h-full">
      <div className="w-full rounded-lg overflow-hidden shadow-lg mb-3" style={{ height: "60vh" }}>
        <div ref={mapContainerRef} style={{ height: "100%" }} />
      </div>
      
      <div className="glass-effect p-5 flex flex-col sm:flex-row gap-3 items-center justify-center">
        <Button
          className={`w-full sm:w-auto font-bold ${
            isPlacingBin 
              ? "bg-[#272727] text-white" 
              : "bg-[#2c3e50] text-white hover:bg-[#1a2530]"
          }`}
          onClick={() => setIsPlacingBin(!isPlacingBin)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {isPlacingBin ? "Click Map to Mark" : "+ Add Garbage Mark"}
        </Button>
        
        <Button
          className="w-full sm:w-auto font-bold bg-[#f2f2f2] text-[#2c3e50] hover:bg-[#e0e0e0]"
          onClick={handleGetLocation}
        >
          <MapPin className="mr-2 h-4 w-4" />
          Go to My Location
        </Button>
      </div>
    </div>
  );
};

export default MapComponent;
