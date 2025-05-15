
import { useEffect } from 'react';
import L from 'leaflet';
import Swal from 'sweetalert2';

interface UseMapSearchProps {
  mapRef: React.MutableRefObject<L.Map | null>;
  searchQuery: string | null;
}

export const useMapSearch = ({ mapRef, searchQuery }: UseMapSearchProps) => {
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
  }, [searchQuery, mapRef]);
};
