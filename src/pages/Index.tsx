
import React, { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import { MapComponent } from '@/components/map';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState<string | null>(null);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="min-h-screen p-5 max-w-screen-xl mx-auto">
      <div className="mb-4 text-center">
        <h1 className="text-3xl font-bold mb-2 text-white">BSU Balayan Campus Map</h1>
        <p className="text-gray-300">User-Added Trash Bins</p>
      </div>
      
      <SearchBar onSearch={handleSearch} />
      
      <MapComponent searchQuery={searchQuery} />
      
      <footer className="mt-8 text-center text-xs text-gray-400">
        <p>© 2025 BSU Balayan Campus Map | Data from OpenStreetMap</p>
      </footer>
    </div>
  );
};

export default Index;
