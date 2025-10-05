import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from './Header';

const DefineAreaPage = () => {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchingWeather, setFetchingWeather] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const autocompleteService = useRef(null);
  const searchInputRef = useRef(null);
  const [selectedCoords, setSelectedCoords] = useState({ lat: 37.7749, lng: -122.4194 });

  // Reliable Google Maps script loader with callback
  const loadGoogleMapsScript = () => {
    if (window.google && window.google.maps) {
      window.initMap && window.initMap();
      return;
    }
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) return;
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return setError('Google Maps API key missing');
    window.initMap = () => {
      initializeGoogleMap();
      setLoading(false);
    };
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async&callback=initMap`;
    script.async = true;
    script.defer = true;
    script.onerror = () => setError('Failed to load Google Maps API');
    document.head.appendChild(script);
  };

  useEffect(() => {
    setLoading(true);
    loadGoogleMapsScript();
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      
      if (mapInstance.current) {
        window.google?.maps?.event?.clearInstanceListeners?.(mapInstance.current);
        mapInstance.current = null;
      }
    };
  }, []);

  // Robust map click handler with debugging
  const handleMapClick = (event) => {
    try {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      const coords = { lat, lng };
      if (markerRef.current) {
        if (markerRef.current.map) markerRef.current.map = null;
        if (markerRef.current.setMap) markerRef.current.setMap(null);
      }
      if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
        markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
          position: coords,
          map: mapInstance.current,
          title: `Pinned Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`
        });
      } else {
        markerRef.current = new window.google.maps.Marker({
          position: coords,
          map: mapInstance.current,
          title: `Pinned Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`
        });
      }
      selectLocationAndRedirect(lat, lng, `Pinned Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
    } catch (error) {
      setError('Error handling map click');
      console.error('[DEBUG] Error in handleMapClick:', error);
    }
  };

  // Add debugging to map initialization
  const initializeGoogleMap = () => {
    console.log('[DEBUG] Initializing Google Map...');
    if (!mapRef.current || !window.google || !window.google.maps) {
      console.error('[DEBUG] Google Maps API or mapRef missing');
      return;
    }
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
      mapTypeControl: false,
      zoomControl: true,
      streetViewControl: false,
      fullscreenControl: true
    });

    window.google.maps.event.clearListeners(mapInstance.current, 'click');
    mapInstance.current.addListener('click', (event) => {
      console.log('[DEBUG] Map click listener triggered');
      handleMapClick(event);
    });
    console.log('[DEBUG] Map initialized and click listener attached');
  };

  const initializeFallbackMap = () => {
    if (!isMounted) return;
    
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

  // Fetch weather data from Meteomatics API
  const fetchWeatherData = async (lat, lng, locationName) => {
    try {
      setFetchingWeather(true);
      console.log('🌤️ Fetching weather data for:', { lat, lng, locationName });

      // Meteomatics API configuration
      // Note: You'll need to replace these with your actual Meteomatics credentials
      const username = import.meta.env.VITE_METEOMATICS_USERNAME || 'your_username';
      const password = import.meta.env.VITE_METEOMATICS_PASSWORD || 'your_password';
      
      // Get current date and time for API request
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 19) + 'Z';
      
      // Parameters for weather data
      const parameters = [
        't_2m:C',           // Temperature at 2m in Celsius
        'relative_humidity_2m:p', // Relative humidity at 2m in %
        'precip_1h:mm',     // Precipitation 1h in mm
        'wind_speed_10m:ms', // Wind speed at 10m in m/s
        'wind_dir_10m:d',   // Wind direction at 10m in degrees
        'msl_pressure:hPa', // Mean sea level pressure in hPa
        'weather_symbol_1h:idx' // Weather symbol
      ].join(',');

      // Meteomatics API endpoint
      const apiUrl = `https://api.meteomatics.com/${dateStr}/${parameters}/${lat},${lng}/json`;
      
      // Create authorization header
      const auth = btoa(`${username}:${password}`);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
      }

      const weatherData = await response.json();
      console.log('✅ Weather data received:', weatherData);

      return weatherData;

    } catch (error) {
      console.error('💥 Weather data fetch error:', error);
      setError(`Failed to fetch weather data: ${error.message}`);
      return null;
    } finally {
      setFetchingWeather(false);
    }
  };

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
        componentRestrictions: undefined
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
    
    if (window.placesService) {
      const request = {
        placeId: suggestion.place_id,
        fields: ['name', 'geometry', 'formatted_address']
      };

      window.placesService.getDetails(request, (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          const location = place.geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          const locationName = place.formatted_address || place.name;
          
            // Create plain coordinate objects for Google Maps
            const coords = { lat: lat, lng: lng };
          
            mapInstance.current.setCenter(coords);
          mapInstance.current.setZoom(15);
          
          if (markerRef.current) {
            markerRef.current.setMap(null);
          }
          
          markerRef.current = new window.google.maps.Marker({
              position: coords,
            map: mapInstance.current,
            title: place.name,
            animation: window.google.maps.Animation.DROP
          });

          // Unified location selection handler
          const selectLocationAndRedirect = (lat, lng, locationName) => {
            setSelectedCoords({ lat, lng });
            setSelectedArea(locationName);
            setLoading(true);
            fetchWeatherData(lat, lng, locationName)
              .then((weatherData) => {
                setLoading(false);
                // Save location and weather data to localStorage
                localStorage.setItem('selectedLocationData', JSON.stringify({
                  coordinates: { lat, lng },
                  locationName,
                  weatherData,
                  timestamp: new Date().toISOString(),
                  selectedArea: locationName
                }));
                // Redirect to dashboard with state
                navigate('/dashboard', {
                  state: {
                    locationData: {
                      coordinates: { lat, lng },
                      locationName,
                      weatherData,
                      timestamp: new Date().toISOString(),
                      selectedArea: locationName
                    }
                  }
                });
              })
              .catch((error) => {
                setLoading(false);
                setError('Failed to fetch weather data');
              });
          };

          selectLocationAndRedirect(lat, lng, locationName);
        }
      });
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
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
    if (!searchQuery.trim()) return;

    try {
      setError(null);
      
      if (window.placesService) {
        const request = {
          query: searchQuery,
          fields: ['name', 'geometry', 'formatted_address']
        };

        window.placesService.findPlaceFromQuery(request, (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results[0]) {
            const place = results[0];
            const location = place.geometry.location;
            const lat = location.lat();
            const lng = location.lng();
            const locationName = place.formatted_address || place.name;
            
              // Create plain coordinate objects for Google Maps
              const coords = { lat: lat, lng: lng };
            
              mapInstance.current.setCenter(coords);
            mapInstance.current.setZoom(15);
            
            if (markerRef.current) {
              markerRef.current.setMap(null);
            }
            
            markerRef.current = new window.google.maps.Marker({
                position: coords,
              map: mapInstance.current,
              title: place.name,
              animation: window.google.maps.Animation.DROP
            });

            // Unified location selection handler
            const selectLocationAndRedirect = (lat, lng, locationName) => {
              setSelectedCoords({ lat, lng });
              setSelectedArea(locationName);
              setLoading(true);
              fetchWeatherData(lat, lng, locationName)
                .then((weatherData) => {
                  setLoading(false);
                  // Save location and weather data to localStorage
                  localStorage.setItem('selectedLocationData', JSON.stringify({
                    coordinates: { lat, lng },
                    locationName,
                    weatherData,
                    timestamp: new Date().toISOString(),
                    selectedArea: locationName
                  }));
                  // Redirect to dashboard with state
                  navigate('/dashboard', {
                    state: {
                      locationData: {
                        coordinates: { lat, lng },
                        locationName,
                        weatherData,
                        timestamp: new Date().toISOString(),
                        selectedArea: locationName
                      }
                    }
                  });
                })
                .catch((error) => {
                  setLoading(false);
                  setError('Failed to fetch weather data');
                });
            };

            selectLocationAndRedirect(lat, lng, locationName);
          }
        });
      }
    } catch (error) {
      console.error('💥 Search error:', error);
      setError(`Search failed: ${error.message}`);
    }
  };

  // Get current location and set map/pin
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        if (markerRef.current) {
          if (markerRef.current.map) markerRef.current.map = null;
          if (markerRef.current.setMap) markerRef.current.setMap(null);
        }
        if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
          markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
            position: { lat, lng },
            map: mapInstance.current,
            title: 'Your Current Location'
          });
        } else {
          markerRef.current = new window.google.maps.Marker({
            position: { lat, lng },
            map: mapInstance.current,
            title: 'Your Current Location'
          });
        }
        selectLocationAndRedirect(lat, lng, 'Your Current Location');
      },
      (err) => {
        setError('Unable to retrieve your location');
        setLoading(false);
      }
    );
  };

  // Ensure pin-on-map works for all clicks
  useEffect(() => {
    if (mapInstance.current) {
      window.google.maps.event.clearListeners(mapInstance.current, 'click');
      mapInstance.current.addListener('click', (event) => {
        handleMapClick(event);
      });
    }
  }, [mapInstance.current]);

  // Unified location selection handler
  const selectLocationAndRedirect = (lat, lng, locationName) => {
    setSelectedCoords({ lat, lng });
    setSelectedArea(locationName);
    setLoading(true);
    fetchWeatherData(lat, lng, locationName)
      .then((weatherData) => {
        setLoading(false);
        // Save location and weather data to localStorage
        localStorage.setItem('selectedLocationData', JSON.stringify({
          coordinates: { lat, lng },
          locationName,
          weatherData,
          timestamp: new Date().toISOString(),
          selectedArea: locationName
        }));
        // Redirect to dashboard with state
        navigate('/dashboard', {
          state: {
            locationData: {
              coordinates: { lat, lng },
              locationName,
              weatherData,
              timestamp: new Date().toISOString(),
              selectedArea: locationName
            }
          }
        });
      })
      .catch((error) => {
        setLoading(false);
        setError('Failed to fetch weather data');
      });
  };

  return (
    <div className="min-h-screen bg-background-dark text-text-light">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Define Area</h1>
        <div className="mb-4 flex gap-4">
          <button
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark"
            onClick={handleGetCurrentLocation}
            disabled={loading}
          >
            📍 Get Current Location
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-600 rounded-lg">
            <div className="flex items-center gap-2 text-red-300">
              <span className="material-symbols-outlined">error</span>
              <span className="font-semibold">Error:</span>
            </div>
            <p className="text-red-200 mt-1">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
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
              onClick={() => setSelectedMethod('search')}
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
              onClick={() => setSelectedMethod('pin')}
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

        {/* Search Input */}
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
                    setTimeout(() => setShowSuggestions(false), 150);
                  }}
                  placeholder="Enter address, city, or coordinates..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                
                {/* Autocomplete Suggestions */}
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
              
              {fetchingWeather && (
                <div className="h-96 flex items-center justify-center bg-slate-800 rounded-lg border border-slate-600 absolute inset-0 z-10 bg-slate-900/90">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-slate-300">Fetching Weather Data...</p>
                    <p className="text-slate-400 text-sm mt-1">Getting current conditions from Meteomatics</p>
                    <p className="text-slate-500 text-xs mt-2">Redirecting to dashboard...</p>
                  </div>
                </div>
              )}
              
              <div 
                ref={mapRef} 
                className={`h-96 rounded-lg border border-slate-600 ${loading ? 'hidden' : ''} relative`}
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
                  }
                }}
              >
                <span className="material-symbols-outlined">dashboard</span>
                Continue to Dashboard
              </Link>
              
              <button
                onClick={() => {
                  setSelectedArea('');
                  setSearchQuery('');
                  setSelectedCoords({ lat: 37.7749, lng: -122.4194 });
                  setError(null);
                  setSuggestions([]);
                  setShowSuggestions(false);
                  setActiveSuggestion(-1);
                  
                  if (markerRef.current) {
                    markerRef.current.setMap(null);
                    markerRef.current = null;
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
      </main>
    </div>
  );
};

export default DefineAreaPage;