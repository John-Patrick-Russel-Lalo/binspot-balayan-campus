
import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMap, useMapEvents } from 'react-leaflet';
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

L.Marker.prototype.options.icon = DefaultIcon;

// User location marker
const UserLocationMarker: React.FC<{ position: [number, number] | null }> = ({ position }) => {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);
  
  return position ? (
    <Marker position={position}>
      <Popup>You are here!</Popup>
    </Marker>
  ) : null;
};

// Map search handler
const SearchHandler: React.FC<{ searchQuery: string | null }> = ({ searchQuery }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!searchQuery) return;
    
    const performSearch = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
          const place = data[0];
          if (place.boundingbox) {
            const bounds = [
              [parseFloat(place.boundingbox[0]), parseFloat(place.boundingbox[2])],
              [parseFloat(place.boundingbox[1]), parseFloat(place.boundingbox[3])]
            ];
            map.fitBounds(bounds as L.LatLngBoundsLiteral);
          } else {
            map.setView([parseFloat(place.lat), parseFloat(place.lon)], 15);
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
  }, [searchQuery, map]);
  
  return null;
};

// Bin placement handler
const BinPlacementHandler: React.FC<{
  isPlacingBin: boolean;
  onBinPlace: (position: [number, number]) => void;
  setIsPlacingBin: (value: boolean) => void;
}> = ({ isPlacingBin, onBinPlace, setIsPlacingBin }) => {
  const map = useMapEvents({
    click: (e) => {
      if (isPlacingBin) {
        const position: [number, number] = [e.latlng.lat, e.latlng.lng];
        onBinPlace(position);
        setIsPlacingBin(false);
      }
    }
  });
  
  return null;
};

interface MapComponentProps {
  onSearch: (query: string) => void;
  searchQuery: string | null;
}

const MapComponent: React.FC<MapComponentProps> = ({ searchQuery }) => {
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [binMarkers, setBinMarkers] = useState<BinMarker[]>([]);
  const [isPlacingBin, setIsPlacingBin] = useState(false);
  
  // Use WebSocket (simulated in development if needed)
  const wsUrl = import.meta.env.PROD ? 'ws://localhost:3000' : 'simulated';
  const { isConnected, message, sendMessage } = useWebSocket(wsUrl);
  
  // Initialize with a marker at BSU Balayan Campus
  useEffect(() => {
    setBinMarkers([
      {
        id: 'bsu-campus',
        position: DEFAULT_POSITION
      }
    ]);
  }, []);
  
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
  }, [isConnected, sendMessage]);
  
  // Process WebSocket messages
  useEffect(() => {
    if (!message) return;
    
    switch (message.type) {
      case 'trashbin':
        setBinMarkers(prev => [...prev, {
          id: `bin-${Date.now()}`,
          position: [message.latitude, message.longitude]
        }]);
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
  
  const handleBinPlacement = (position: [number, number]) => {
    const newBin: BinMarker = {
      id: `bin-${Date.now()}`,
      position
    };
    
    setBinMarkers(prev => [...prev, newBin]);
    
    sendMessage({
      type: 'trashbin',
      latitude: position[0],
      longitude: position[1]
    });
  };
  
  const handleBinClick = (bin: BinMarker) => {
    if (bin.id === 'bsu-campus') {
      // Don't allow editing/deleting the campus marker
      return;
    }
    
    Swal.fire({
      title: 'Trash Bin Options',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Info',
      denyButtonText: 'Edit',
      cancelButtonText: 'Delete',
      confirmButtonColor: '#2c3e50',
      denyButtonColor: '#3498db',
      cancelButtonColor: '#e74c3c'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire('Bin Info', 'This is a trash bin.', 'info');
      } else if (result.isDenied) {
        Swal.fire({
          title: 'Move Bin',
          text: 'Click a new location on the map',
          confirmButtonText: 'OK',
          confirmButtonColor: '#2c3e50'
        });
        
        // Enable bin edit mode - to be implemented with a more robust state machine
        // For now we just delete and add a new one when editing
        setBinMarkers(prev => prev.filter(marker => marker.id !== bin.id));
        setIsPlacingBin(true);
        
        sendMessage({
          type: 'deletebin',
          id: bin.id
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        setBinMarkers(prev => prev.filter(marker => marker.id !== bin.id));
        
        sendMessage({
          type: 'deletebin',
          id: bin.id
        });
      }
    });
  };
  
  const handleGetLocation = () => {
    if (userPosition) {
      // We already have the user's position
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
        <MapContainer center={DEFAULT_POSITION} zoom={15} style={{ height: "100%" }}>
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Streets">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                maxZoom={20}
              />
            </LayersControl.BaseLayer>
            
            <LayersControl.BaseLayer name="Satellite">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="&copy; Esri &mdash; Source: Esri, Earthstar Geographics"
                maxZoom={20}
              />
            </LayersControl.BaseLayer>
            
            <LayersControl.BaseLayer name="Dark">
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution="&copy; CartoDB"
                maxZoom={20}
              />
            </LayersControl.BaseLayer>
            
            <LayersControl.BaseLayer name="Light">
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution="&copy; CartoDB"
                maxZoom={20}
              />
            </LayersControl.BaseLayer>
          </LayersControl>
          
          {/* Display all bin markers */}
          {binMarkers.map(bin => (
            <Marker
              key={bin.id}
              position={bin.position}
              eventHandlers={{
                click: () => handleBinClick(bin)
              }}
            >
              <Popup>
                {bin.id === 'bsu-campus' ? (
                  <div>
                    <b>Batangas State University Balayan Campus</b>
                  </div>
                ) : (
                  <div>
                    <b>Trash Bin</b>
                  </div>
                )}
              </Popup>
            </Marker>
          ))}
          
          {/* Show user's location */}
          <UserLocationMarker position={userPosition} />
          
          {/* Handle map searches */}
          <SearchHandler searchQuery={searchQuery} />
          
          {/* Handle bin placement */}
          <BinPlacementHandler
            isPlacingBin={isPlacingBin}
            onBinPlace={handleBinPlacement}
            setIsPlacingBin={setIsPlacingBin}
          />
        </MapContainer>
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
