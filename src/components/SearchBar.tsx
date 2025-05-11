
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const { toast } = useToast();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      toast({
        title: "Search Error",
        description: "Please enter a search query",
        variant: "destructive"
      });
      return;
    }
    onSearch(query);
  };

  return (
    <form onSubmit={handleSearch} className="w-full glass-effect p-3 mb-3 flex gap-2">
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search a place..."
        className="w-full bg-black/50 border-none text-white placeholder:text-white/40"
      />
      <Button type="submit" variant="outline" className="bg-white text-[#2c3e50] hover:bg-[#2c3e50] hover:text-white font-bold">
        <Search className="h-4 w-4 mr-2" />
        Search
      </Button>
    </form>
  );
};

export default SearchBar;
