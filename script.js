
// Default BSU Balayan Campus location
const DEFAULT_POSITION = [13.94827, 120.71993];
let map;
let isPlacingBin = false;
let userPosition = null;
let binMarkers = [];

// Custom icon for markers
const createIcon = () => {
  return L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [41, 41]
  });
};

// Initialize map when page loads
document.addEventListener('DOMContentLoaded', () => {
  initializeMap();
  setupEventListeners();
});

// Initialize the map
function initializeMap() {
  // Create map instance
  map = L.map('map-container').setView(DEFAULT_POSITION, 15);

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
  const campusMarker = L.marker(DEFAULT_POSITION, { icon: createIcon() })
    .addTo(map)
    .bindPopup("<b>Batangas State University Balayan Campus</b>");

  // Save in binMarkers
  binMarkers.push({
    id: 'bsu-campus',
    position: DEFAULT_POSITION,
    marker: campusMarker
  });

  // Add map click event for bin placement
  map.on('click', handleMapClick);
}

// Set up event listeners
function setupEventListeners() {
  // Add bin button
  const addBinBtn = document.getElementById('add-bin-btn');
  addBinBtn.addEventListener('click', () => {
    isPlacingBin = !isPlacingBin;
    
    if (isPlacingBin) {
      addBinBtn.textContent = "Click Map to Mark";
      addBinBtn.classList.add('active');
    } else {
      addBinBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg> + Add Garbage Mark';
      addBinBtn.classList.remove('active');
    }
  });

  // Get location button
  const locationBtn = document.getElementById('location-btn');
  locationBtn.addEventListener('click', handleGetLocation);

  // Search button
  const searchButton = document.getElementById('search-button');
  const searchInput = document.getElementById('search-input');
  
  searchButton.addEventListener('click', () => {
    handleSearch(searchInput.value);
  });
  
  searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      handleSearch(searchInput.value);
    }
  });
}

// Handle map clicks for bin placement
function handleMapClick(e) {
  if (isPlacingBin) {
    const position = [e.latlng.lat, e.latlng.lng];
    handleBinPlacement(position);
    
    // Reset placing bin mode
    isPlacingBin = false;
    const addBinBtn = document.getElementById('add-bin-btn');
    addBinBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg> + Add Garbage Mark';
    addBinBtn.classList.remove('active');
  }
}

// Place a bin marker on the map
function handleBinPlacement(position) {
  // Create a new bin marker
  const newBin = {
    id: `bin-${Date.now()}`,
    position: position
  };
  
  // Add marker to the map
  const marker = L.marker(position, { icon: createIcon() })
    .addTo(map)
    .bindPopup('<b>Trash Bin</b>');
  
  // Save the marker reference
  newBin.marker = marker;
  binMarkers.push(newBin);
  
  // Show success message
  Swal.fire({
    title: 'Success!',
    text: 'Trash bin added to the map',
    icon: 'success',
    confirmButtonColor: '#2c3e50'
  });
}

// Get user location
function handleGetLocation() {
  Swal.fire({
    title: "Click OK to Enable Location",
    confirmButtonColor: "#2c3e50"
  }).then(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          userPosition = [latitude, longitude];
          
          // Pan the map to the user's location
          map.setView(userPosition, 18);
          
          // Add or update the user location marker
          const userMarker = L.marker(userPosition, { icon: createIcon() })
            .addTo(map)
            .bindPopup('You are here!');
        },
        (error) => {
          console.error("Error getting location:", error);
          Swal.fire({
            title: 'Error',
            text: 'Could not get your location.',
            icon: 'error',
            confirmButtonColor: '#2c3e50'
          });
        }
      );
    } else {
      Swal.fire({
        title: 'Error',
        text: 'Geolocation is not supported by your browser.',
        icon: 'error',
        confirmButtonColor: '#2c3e50'
      });
    }
  });
}

// Handle search
function handleSearch(query) {
  if (!query.trim()) {
    Swal.fire({
      title: "Search Error",
      text: "Please enter a search query",
      icon: "error",
      confirmButtonColor: "#2c3e50"
    });
    return;
  }
  
  performSearch(query);
}

// Perform search using Nominatim
async function performSearch(searchQuery) {
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
        map.fitBounds(bounds);
      } else {
        map.setView([parseFloat(place.lat), parseFloat(place.lon)], 15);
      }
    } else {
      Swal.fire({
        title: 'Not Found',
        text: 'Place not found.',
        icon: 'error',
        confirmButtonColor: '#2c3e50'
      });
    }
  } catch (error) {
    console.error('Error searching:', error);
    Swal.fire({
      title: 'Error',
      text: 'Something went wrong with the search.',
      icon: 'error',
      confirmButtonColor: '#2c3e50'
    });
  }
}
