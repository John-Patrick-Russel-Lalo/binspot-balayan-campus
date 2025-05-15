
import React from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Trash2 } from 'lucide-react';

interface MapControlsProps {
  isPlacingBin: boolean;
  setIsPlacingBin: (value: boolean) => void;
  handleGetLocation: () => void;
}

const MapControls: React.FC<MapControlsProps> = ({ 
  isPlacingBin, 
  setIsPlacingBin,
  handleGetLocation
}) => {
  return (
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
  );
};

export default MapControls;
