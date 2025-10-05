import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';

const DefineAreaPage = () => {
  const [selectedMethod, setSelectedMethod] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const autocompleteService = useRef(null);
  const searchInputRef = useRef(null);
  const [selectedCoords, setSelectedCoords] = useState({ lat: 37.7749, lng: -122.4194 });

  // Enhanced logging function
  const logDebug = (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data || '');
    
    setDebugInfo(prev => ({
      ...prev,
      lastAction: message,
      lastUpdate: timestamp,
      ...(data && { lastData: JSON.stringify(data, null, 2) })
    }));
  };

  useEffect(() => {
    console.log('🗺️ DefineAreaPage: Starting map initialization...');
    console.log('🔑 Environment variables check:', {
      hasGoogleMapsKey: !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      hasGoogleEarthKey: !!import.meta.env.VITE_GOOGLE_EARTH_API_KEY,
      googleMapsKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.substring(0, 10) + '...',
      googleEarthKey: import.meta.env.VITE_GOOGLE_EARTH_API_KEY?.substring(0, 10) + '...'
    });

    const initMap = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🚀 Starting map initialization process...');

        // Check if Google Maps is already loaded
        if (window.google && window.google.maps) {
          console.log('✅ Google Maps already loaded, using existing instance');
          await initializeGoogleMap();
          return;
        }

        console.log('📦 Loading Google Maps API script...');
        
        // Load Google Maps API script
        const script = document.createElement('script');
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        
        if (!apiKey) {
          throw new Error('Google Maps API key not found in environment variables');
        }

        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
        script.async = true;
        script.defer = true;
        
        // Set up callback
        window.initGoogleMaps = async () => {
          console.log('📍 Google Maps API loaded successfully');
          await initializeGoogleMap();
        };

        script.onerror = (error) => {
          console.error('❌ Failed to load Google Maps script:', error);
          setError('Failed to load Google Maps API');
          initializeFallbackMap();
        };

        document.head.appendChild(script);
        
        // Cleanup function
        return () => {
          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }
          delete window.initGoogleMaps;
        };
        
      } catch (error) {
        console.error('💥 Error in map initialization:', error);
        setError(error.message);
        initializeFallbackMap();
      }
    };

    const initializeGoogleMap = async () => {
      try {
        console.log('🎯 Initializing Google Maps instance...');
        
        if (!mapRef.current) {
          console.warn('⚠️ Map container not found');
          return;
        }

        if (!window.google || !window.google.maps) {
          throw new Error('Google Maps API not available');
        }

        console.log('🏗️ Creating map instance...');
        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          center: selectedCoords,
          zoom: 10,
          mapTypeId: 'hybrid',
          styles: [
            {
              featureType: 'all',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#ffffff' }]
            },
            {
              featureType: 'all',
              elementType: 'labels.text.stroke',
              stylers: [{ color: '#000000' }, { weight: 2 }]
            }
          ],
          mapTypeControl: false, // Removed map type selector
          zoomControl: true,
          streetViewControl: false,
          fullscreenControl: true
        });

        console.log('✅ Map instance created successfully');

        // Add click listener for pin method
        mapInstance.current.addListener('click', (event) => {
          console.log('🖱️ Map clicked:', event.latLng.toString());
          
          if (selectedMethod === 'pin') {
            handleMapClick(event);
          }
        });

        // Initialize Places service for search
        const placesService = new window.google.maps.places.PlacesService(mapInstance.current);
        window.placesService = placesService;
        
        // Initialize Autocomplete service for suggestions
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        
        console.log('🔍 Places and Autocomplete services initialized');

        setLoading(false);
        setError(null);
        
      } catch (error) {
        console.error('💥 Error initializing Google Map:', error);
        setError(`Map initialization failed: ${error.message}`);
        initializeFallbackMap();
      }
    };

    const handleMapClick = (event) => {
      try {
        console.log('📍 Handling map click for pin placement...');
        
        // Remove existing marker
        if (markerRef.current) {
          markerRef.current.setMap(null);
          console.log('🗑️ Removed existing marker');
        }
        
        // Create new marker
        markerRef.current = new window.google.maps.Marker({
          position: event.latLng,
          map: mapInstance.current,
          title: 'Selected Location',
          animation: window.google.maps.Animation.DROP
        });

        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        
        setSelectedCoords({ lat, lng });
        setSelectedArea(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        
        console.log('📌 Marker placed at:', { lat, lng });
        
      } catch (error) {
        console.error('💥 Error handling map click:', error);
        setError(`Click handling failed: ${error.message}`);
      }
    };

    const initializeFallbackMap = () => {
      console.log('🔄 Initializing fallback map...');
      
      setLoading(false);
      
      if (mapRef.current) {
        mapRef.current.innerHTML = `
          <div class="flex items-center justify-center h-full bg-slate-800 rounded-lg border border-slate-600">
            <div class="text-center p-8">
              <span class="material-symbols-outlined text-6xl text-red-500 mb-4 block">error</span>
              <h3 class="text-white text-lg font-semibold mb-2">Map Loading Failed</h3>
              <p class="text-slate-300 mb-4">Unable to load Google Maps</p>
              <p class="text-slate-400 text-sm">Error: ${error || 'Unknown error'}</p>
              <button 
                onclick="window.location.reload()" 
                class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        `;
      }
    };

    initMap();
  }, [selectedMethod, selectedCoords]);

  // Autocomplete functionality
  const getPlaceAutocomplete = async (input) => {
    if (!input || input.length < 2 || !autocompleteService.current) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      console.log('🔍 Getting autocomplete suggestions for:', input);
      
      const request = {
        input: input,
        types: ['establishment', 'geocode'],
        componentRestrictions: undefined // Allow worldwide results
      };

      autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
        console.log('📝 Autocomplete response:', { status, predictionsCount: predictions?.length || 0 });
        
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          const suggestionList = predictions.slice(0, 5).map(prediction => ({
            place_id: prediction.place_id,
            description: prediction.description,
            main_text: prediction.structured_formatting.main_text,
            secondary_text: prediction.structured_formatting.secondary_text
          }));
          
          setSuggestions(suggestionList);
          setShowSuggestions(true);
          setActiveSuggestion(-1);
          
          console.log('✅ Suggestions updated:', suggestionList.length);
        } else {
          console.log('⚠️ No autocomplete predictions found');
          setSuggestions([]);
          setShowSuggestions(false);
        }
      });
      
    } catch (error) {
      console.error('💥 Autocomplete error:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    console.log('📍 Suggestion selected:', suggestion);
    
    setSearchQuery(suggestion.description);
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveSuggestion(-1);
    
    // Search for the selected place
    searchPlace(suggestion.place_id, suggestion.description);
  };

  const searchPlace = async (placeId, description) => {
    try {
      console.log('🔍 Searching for place:', { placeId, description });
      
      if (window.placesService) {
        const request = {
          placeId: placeId,
          fields: ['geometry', 'name', 'formatted_address']
        };

        window.placesService.getDetails(request, (place, status) => {
          console.log('📍 Place details response:', { status, place: place?.name });
          
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            const location = place.geometry.location;
            const lat = location.lat();
            const lng = location.lng();
            
            console.log('✅ Place found:', { lat, lng, name: place.name });
            
            // Update map center
            mapInstance.current.setCenter(location);
            mapInstance.current.setZoom(15);
            
            // Remove existing marker
            if (markerRef.current) {
              markerRef.current.setMap(null);
            }
            
            // Add new marker
            markerRef.current = new window.google.maps.Marker({
              position: location,
              map: mapInstance.current,
              title: place.name,
              animation: window.google.maps.Animation.DROP
            });

            setSelectedCoords({ lat, lng });
            setSelectedArea(place.formatted_address || place.name);
            
          } else {
            console.warn('⚠️ Place details not found, trying geocoding...');
            tryGeocoding();
          }
        });
      } else {
        tryGeocoding();
      }
      
    } catch (error) {
      console.error('💥 Place search error:', error);
      setError(`Place search failed: ${error.message}`);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    console.log('🔤 Search query changed:', value);
    setSearchQuery(value);
    
    // Get autocomplete suggestions
    getPlaceAutocomplete(value);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestion(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestion(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (activeSuggestion >= 0) {
          handleSuggestionSelect(suggestions[activeSuggestion]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setSuggestions([]);
        setShowSuggestions(false);
        setActiveSuggestion(-1);
        searchInputRef.current?.blur();
        break;
    }
  };

  const handleSearch = async () => {
    console.log('🔍 Starting search for:', searchQuery);
    
    if (!searchQuery.trim()) {
      console.warn('⚠️ Empty search query');
      return;
    }

    try {
      setError(null);
      
      // Method 1: Try Google Places API if available
      if (window.placesService) {
        console.log('🔍 Using Google Places API...');
        
        const request = {
          query: searchQuery,
          fields: ['name', 'geometry', 'formatted_address']
        };

        window.placesService.findPlaceFromQuery(request, (results, status) => {
          console.log('📍 Places API response:', { results, status });
          
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results[0]) {
            const place = results[0];
            const location = place.geometry.location;
            const lat = location.lat();
            const lng = location.lng();
            
            console.log('✅ Place found:', { lat, lng, name: place.name });
            
            // Update map center
            mapInstance.current.setCenter(location);
            mapInstance.current.setZoom(15);
            
            // Remove existing marker
            if (markerRef.current) {
              markerRef.current.setMap(null);
            }
            
            // Add new marker
            markerRef.current = new window.google.maps.Marker({
              position: location,
              map: mapInstance.current,
              title: place.name,
              animation: window.google.maps.Animation.DROP
            });

            setSelectedCoords({ lat, lng });
            setSelectedArea(place.formatted_address || place.name);
            
          } else {
            console.warn('⚠️ No results from Places API, trying geocoding...');
            tryGeocoding();
          }
        });
      } else {
        console.log('🌐 Places API not available, using geocoding...');
        tryGeocoding();
      }
      
    } catch (error) {
      console.error('💥 Search error:', error);
      setError(`Search failed: ${error.message}`);
    }
  };

  const tryGeocoding = async () => {
    try {
      console.log('🌐 Trying geocoding API...');
      
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🗺️ Geocoding response:', data);
      
      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const { lat, lng } = result.geometry.location;
        
        console.log('✅ Location found via geocoding:', { lat, lng });
        
        setSelectedCoords({ lat, lng });
        setSelectedArea(result.formatted_address);
        
        // Update map if available
        if (mapInstance.current) {
          const location = new window.google.maps.LatLng(lat, lng);
          mapInstance.current.setCenter(location);
          mapInstance.current.setZoom(15);
          
          if (markerRef.current) {
            markerRef.current.setMap(null);
          }
          
          markerRef.current = new window.google.maps.Marker({
            position: location,
            map: mapInstance.current,
            title: result.formatted_address,
            animation: window.google.maps.Animation.DROP
          });
        }
        
      } else {
        throw new Error(data.error_message || 'Location not found');
      }
      
    } catch (error) {
      console.error('💥 Geocoding error:', error);
      setError(`Location search failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Define Area of Interest</h1>
            <p className="text-slate-300 text-lg">Select the area you want to monitor for agricultural insights</p>
          </div>

          {/* Debug Information */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-600 rounded-lg">
              <div className="flex items-center gap-2 text-red-300">
                <span className="material-symbols-outlined">error</span>
                <span className="font-semibold">Error:</span>
              </div>
              <p className="text-red-200 mt-1">{error}</p>
              <button 
                onClick={() => {
                  console.log('🔄 User clicked retry button');
                  window.location.reload();
                }} 
                className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Method Selection */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Selection Method</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  console.log('🔍 Selected search method');
                  setSelectedMethod('search');
                }}
                className={`p-6 rounded-lg border-2 transition-all ${
                  selectedMethod === 'search'
                    ? 'border-blue-500 bg-blue-500/20 text-white'
                    : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500'
                }`}
              >
                <span className="material-symbols-outlined text-4xl mb-2 block">search</span>
                <h3 className="text-xl font-semibold mb-2">Search Location</h3>
                <p className="text-sm opacity-75">Search for a specific address or place name</p>
              </button>
              
              <button
                onClick={() => {
                  console.log('📍 Selected pin method');
                  setSelectedMethod('pin');
                }}
                className={`p-6 rounded-lg border-2 transition-all ${
                  selectedMethod === 'pin'
                    ? 'border-green-500 bg-green-500/20 text-white'
                    : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500'
                }`}
              >
                <span className="material-symbols-outlined text-4xl mb-2 block">location_on</span>
                <h3 className="text-xl font-semibold mb-2">Pin on Map</h3>
                <p className="text-sm opacity-75">Click directly on the map to select a location</p>
              </button>
            </div>
          </div>

        {/* Search Input with Autocomplete */}
        {selectedMethod === 'search' && (
          <div className="mb-8">
            <div className="flex gap-4 max-w-2xl mx-auto">
              <div className="flex-1 relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                  search
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (suggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding suggestions to allow clicking on them
                    setTimeout(() => setShowSuggestions(false), 150);
                  }}
                  placeholder="Enter address, city, or coordinates..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                
                {/* Autocomplete Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={suggestion.place_id}
                        onClick={() => handleSuggestionSelect(suggestion)}
                        className={`px-4 py-3 cursor-pointer border-b border-slate-700 last:border-b-0 hover:bg-slate-700 transition-colors ${
                          index === activeSuggestion ? 'bg-blue-600/20 border-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-slate-400 text-lg">
                            location_on
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">
                              {suggestion.main_text}
                            </p>
                            <p className="text-slate-400 text-sm truncate">
                              {suggestion.secondary_text}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleSearch}
                disabled={!searchQuery.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-slate-600 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">search</span>
                Search
              </button>
            </div>
          </div>
        )}

          {/* Map Container */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-slate-800 border border-slate-600 rounded-lg p-4">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined">satellite</span>
                  Interactive Satellite Map
                  {loading && (
                    <span className="text-yellow-400 text-sm ml-2">(Loading...)</span>
                  )}
                </h3>
                
                {loading && (
                  <div className="h-96 flex items-center justify-center bg-slate-800 rounded-lg border border-slate-600">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-slate-300">Loading Google Maps...</p>
                      <p className="text-slate-400 text-sm mt-1">Initializing map services</p>
                    </div>
                  </div>
                )}
                
                <div 
                  ref={mapRef} 
                  className={`h-96 rounded-lg border border-slate-600 ${loading ? 'hidden' : ''}`}
                />
                
                {selectedMethod === 'pin' && !loading && !error && (
                  <p className="text-slate-400 text-sm mt-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">info</span>
                    Click on the map to place a pin at your desired location
                  </p>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Current Selection */}
              <div className="bg-slate-800 border border-slate-600 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined">location_on</span>
                  Selected Area
                </h3>
                
                {selectedArea ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-700 rounded-lg">
                      <p className="text-slate-300 text-sm font-medium mb-1">Location:</p>
                      <p className="text-white">{selectedArea}</p>
                    </div>
                    <div className="p-3 bg-slate-700 rounded-lg">
                      <p className="text-slate-300 text-sm font-medium mb-1">Coordinates:</p>
                      <p className="text-white font-mono text-sm">
                        {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-6xl text-slate-600 mb-3 block">
                      location_off
                    </span>
                    <p className="text-slate-400">No area selected yet</p>
                    <p className="text-slate-500 text-sm mt-1">
                      {selectedMethod === 'search' ? 'Search for a location' : 'Click on the map to select'}
                    </p>
                  </div>
                )}
              </div>

              {/* Area Info */}
              {selectedArea && (
                <div className="bg-slate-800 border border-slate-600 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">info</span>
                    Area Information
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Area Size:</span>
                      <span className="text-white">~1 km²</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Data Coverage:</span>
                      <span className="text-green-400">Available</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Resolution:</span>
                      <span className="text-white">30m/pixel</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Map Type:</span>
                      <span className="text-blue-400">Satellite</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Debug Information */}
              <div className="bg-slate-800 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined">bug_report</span>
                  Debug Info
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Maps API:</span>
                    <span className={`${window.google ? 'text-green-400' : 'text-red-400'}`}>
                      {window.google ? 'Loaded' : 'Not loaded'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Autocomplete:</span>
                    <span className={autocompleteService.current ? 'text-green-400' : 'text-orange-400'}>
                      {autocompleteService.current ? 'Ready' : 'Not ready'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Method:</span>
                    <span className="text-white">{selectedMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Suggestions:</span>
                    <span className="text-blue-400">{suggestions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Loading:</span>
                    <span className={loading ? 'text-yellow-400' : 'text-green-400'}>
                      {loading ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Error:</span>
                    <span className={error ? 'text-red-400' : 'text-green-400'}>
                      {error ? 'Yes' : 'No'}
                    </span>
                  </div>
                  {debugInfo.lastAction && (
                    <div className="pt-2 border-t border-slate-600">
                      <p className="text-slate-400 text-xs">Last: {debugInfo.lastAction}</p>
                      <p className="text-slate-500 text-xs">{debugInfo.lastUpdate}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Link
                  to="/dashboard"
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                    selectedArea
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  }`}
                  onClick={(e) => {
                    if (!selectedArea) {
                      e.preventDefault();
                      console.log('⚠️ Cannot continue without selected area');
                    } else {
                      console.log('✅ Continuing to dashboard with area:', selectedArea);
                    }
                  }}
                >
                  <span className="material-symbols-outlined">dashboard</span>
                  Continue to Dashboard
                </Link>
                
                <button
                  onClick={() => {
                    console.log('🔄 Resetting selection...');
                    setSelectedArea('');
                    setSearchQuery('');
                    setSelectedCoords({ lat: 37.7749, lng: -122.4194 });
                    setError(null);
                    setSuggestions([]);
                    setShowSuggestions(false);
                    setActiveSuggestion(-1);
                    
                    // Remove marker if exists
                    if (markerRef.current) {
                      markerRef.current.setMap(null);
                      markerRef.current = null;
                      console.log('🗑️ Marker removed during reset');
                    }
                  }}
                  className="w-full py-3 px-4 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">refresh</span>
                  Reset Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefineAreaPage;