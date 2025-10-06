import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Header from './Header';
import weatherService from '../services/weatherService';
import nasaDataService from '../services/nasaDataService';
import { downloadAsJson, downloadAsCsv } from '../utils/downloadUtils';

const DashboardPage = () => {
  const routerLocation = useLocation();
  const [weatherData, setWeatherData] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocationData, setSelectedLocationData] = useState(null);
  const [location, setLocation] = useState({ lat: 37.7749, lng: -122.4194, name: 'San Francisco, CA' }); // Default location
  const [nasaPrecip, setNasaPrecip] = useState({ loading: false, series: [], latest: null, average: null, error: null });
  const [nasaOverlayEnabled, setNasaOverlayEnabled] = useState(false);
  const mapRef = React.useRef(null);
  const nasaOverlayRef = React.useRef(null);

  const handleDownload = (format) => {
    const downloadData = {
      location: location,
      current: weatherData?.current,
      forecast: forecast,
      timestamp: new Date().toISOString()
    };

    const filename = `weather-data-${location.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}`;

    if (format === 'json') {
      downloadAsJson(downloadData, filename);
    } else if (format === 'csv') {
      downloadAsCsv({ current: weatherData?.current, forecast }, filename);
    }

    setAnchorEl(null); // Close the menu
  };

  // Function to fetch weather data
  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      
      // Fetch current weather and forecast
      const [currentWeather, weatherForecast] = await Promise.all([
        weatherService.getCurrentWeather(location.lat, location.lng),
        weatherService.getWeatherForecast(location.lat, location.lng, 1)
      ]);

      setWeatherData(currentWeather);
      setForecast(weatherForecast);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      // Fallback to mock data if API fails
      setWeatherData({
        current: {
          temperature: 22,
          humidity: 65,
          windSpeed: 12,
          windDirection: 180,
          pressure: 1013,
          precipitation: 0
        }
      });
      // Provide 1 day fallback
      const fallbackForecast = [];
      for (let i = 0; i < 1; i++) {
        fallbackForecast.push({
          date: new Date(Date.now() + i * 86400000),
          temperature: 22 - i,
          maxTemp: 25 - i,
          minTemp: 18 - i,
          weatherSymbol: i === 0 ? 'Partly cloudy' : i === 1 ? 'Rain' : i === 2 ? 'Cloudy' : i === 3 ? 'Sunny' : 'Clear',
          precipitation: i === 1 ? 2 : 0
        });
      }
      setForecast(fallbackForecast);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if we have location data from DefineAreaPage
    const locationFromStorage = localStorage.getItem('selectedLocationData');
    const locationFromState = routerLocation.state?.locationData;
    
    if (locationFromState) {
      console.log('📍 Using location data from navigation state:', locationFromState);
      setSelectedLocationData(locationFromState);
      setLocation({
        lat: locationFromState.coordinates.lat,
        lng: locationFromState.coordinates.lng,
        name: locationFromState.locationName
      });
      
      // If we have Meteomatics weather data, use it directly
      if (locationFromState.weatherData && locationFromState.weatherData.data) {
        setWeatherData(formatMeteomaticsData(locationFromState.weatherData));
        // Initialize weather map after data is set
        setTimeout(() => initializeWeatherMap(), 100);
        setLoading(false);
        return;
      }
    } else if (locationFromStorage) {
      try {
        const parsedLocationData = JSON.parse(locationFromStorage);
        console.log('📍 Using location data from localStorage:', parsedLocationData);
        setSelectedLocationData(parsedLocationData);
        setLocation({
          lat: parsedLocationData.coordinates.lat,
          lng: parsedLocationData.coordinates.lng,
          name: parsedLocationData.locationName
        });
        
        // If we have Meteomatics weather data, use it directly
        if (parsedLocationData.weatherData && parsedLocationData.weatherData.data) {
          setWeatherData(formatMeteomaticsData(parsedLocationData.weatherData));
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error parsing stored location data:', error);
      }
    }
    
    fetchWeatherData();
  }, [routerLocation]);

  // Initialize weather map when location and weather data are available
  useEffect(() => {
    if (!loading && location.lat && location.lng && weatherData) {
      const timer = setTimeout(() => {
        initializeWeatherMap();
      }, 500); // Delay to ensure DOM is ready
      
      return () => clearTimeout(timer);
    }
  }, [loading, location, weatherData]);

  // Format Meteomatics API data to our expected structure
  const formatMeteomaticsData = (meteomaticsData) => {
    try {
      const data = meteomaticsData.data;
      // Get current weather data
      const temperature = data.find(d => d.parameter === 't_2m:C')?.coordinates?.[0]?.dates?.[0]?.value || 0;
      const humidity = data.find(d => d.parameter === 'relative_humidity_2m:p')?.coordinates?.[0]?.dates?.[0]?.value || 0;
      const windSpeed = data.find(d => d.parameter === 'wind_speed_10m:ms')?.coordinates?.[0]?.dates?.[0]?.value || 0;
      const windDirection = data.find(d => d.parameter === 'wind_dir_10m:d')?.coordinates?.[0]?.dates?.[0]?.value || 0;
      const pressure = data.find(d => d.parameter === 'msl_pressure:hPa')?.coordinates?.[0]?.dates?.[0]?.value || 0;
      const precipitation = data.find(d => d.parameter === 'precip_1h:mm')?.coordinates?.[0]?.dates?.[0]?.value || 0;
      // Build 5-day forecast from available dates
      const tempData = data.find(d => d.parameter === 't_2m:C');
      const precipData = data.find(d => d.parameter === 'precip_1h:mm');
      const forecastData = [];
      if (tempData?.coordinates?.[0]?.dates) {
        const tempDates = tempData.coordinates[0].dates;
        const precipDates = precipData?.coordinates?.[0]?.dates || [];
        for (let i = 0; i < 5; i++) {
          // Use unique date for each forecast day
          let forecastDate;
          if (tempDates[i] && tempDates[i].date) {
            forecastDate = new Date(tempDates[i].date);
          } else if (tempDates[0] && tempDates[0].date) {
            forecastDate = new Date(Date.now() + i * 86400000);
          } else {
            forecastDate = new Date(Date.now() + i * 86400000);
          }
          const tempValue = tempDates[i]?.value ?? tempDates[0]?.value ?? temperature;
          const precipValue = precipDates[i]?.value ?? precipDates[0]?.value ?? 0;
          forecastData.push({
            date: forecastDate,
            temperature: Math.round(tempValue),
            maxTemp: Math.round(tempValue + 3),
            minTemp: Math.round(tempValue - 3),
            weatherSymbol: getWeatherDescription(tempValue, precipValue),
            precipitation: precipValue
          });
        }
      } else {
        // Fallback to mock data for one day
        for (let i = 0; i < 1; i++) {
          forecastData.push({
            date: new Date(Date.now() + i * 86400000),
            temperature: 22 - i,
            maxTemp: 25 - i,
            minTemp: 18 - i,
            weatherSymbol: i === 0 ? 'Partly cloudy' : i === 1 ? 'Rain' : i === 2 ? 'Cloudy' : i === 3 ? 'Sunny' : 'Clear',
            precipitation: i === 1 ? 2 : 0
          });
        }
      }
      setForecast(forecastData);
      return {
        current: {
          temperature: Math.round(temperature),
          humidity: Math.round(humidity),
          windSpeed: Math.round(windSpeed * 3.6),
          windDirection: Math.round(windDirection),
          pressure: Math.round(pressure),
          precipitation: precipitation,
          description: getWeatherDescription(temperature, precipitation),
          icon: getWeatherIcon(temperature, precipitation)
        },
        source: 'meteomatics',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error formatting Meteomatics data:', error);
      return null;
    }
  };

  // Get weather description based on conditions
  const getWeatherDescription = (temp, precip) => {
    if (precip > 0.1) return 'Rainy';
    if (temp > 25) return 'Sunny';
    if (temp > 15) return 'Partly Cloudy';
    return 'Cloudy';
  };

  // Get weather icon based on conditions
  const getWeatherIcon = (temp, precip) => {
    if (precip > 0.1) return '🌧️';
    if (temp > 25) return '☀️';
    if (temp > 15) return '⛅';
    return '☁️';
  };

  // Initialize Google Maps for weather display
  const initializeWeatherMap = () => {
    try {
      if (typeof google === 'undefined' || !location.lat || !location.lng) {
        console.log('Google Maps not loaded or invalid coordinates');
        return;
      }

      const mapElement = document.getElementById('weather-map');
      if (!mapElement) {
        console.log('Weather map element not found');
        return;
      }

      const map = new google.maps.Map(mapElement, {
        center: { lat: Number(location.lat), lng: Number(location.lng) },
        zoom: 10,
        mapTypeId: 'satellite',
        styles: [
          {
            elementType: 'geometry',
            stylers: [{ color: '#242f3e' }]
          },
          {
            elementType: 'labels.text.stroke',
            stylers: [{ color: '#242f3e' }]
          },
          {
            elementType: 'labels.text.fill',
            stylers: [{ color: '#746855' }]
          }
        ]
      });
      mapRef.current = map;

      // Only show the blue pin marker, remove the red pin and text
      if (window.dashboardMarker) {
        window.dashboardMarker.setMap(null);
      }
      window.dashboardMarker = new google.maps.Marker({
        position: { lat: Number(location.lat), lng: Number(location.lng) },
        map: map,
        title: location.name,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          scaledSize: new google.maps.Size(40, 40)
        }
      });

      // If overlay should be active, ensure it is added
      if (nasaOverlayEnabled) {
        addNasaGibsOverlay();
      }

      console.log('Weather map initialized successfully');
    } catch (error) {
      console.error('Error initializing weather map:', error);
    }
  };

  // Add / remove NASA GIBS overlay
  const addNasaGibsOverlay = () => {
    if (!mapRef.current) return;
    const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const layer = 'MODIS_Terra_CorrectedReflectance_TrueColor';
    const urlTemplate = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/${dateStr}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`;
    if (!nasaOverlayRef.current) {
      nasaOverlayRef.current = new google.maps.ImageMapType({
        getTileUrl: (coord, zoom) => urlTemplate
          .replace('{z}', zoom)
          .replace('{y}', coord.y)
          .replace('{x}', coord.x),
        tileSize: new google.maps.Size(256, 256),
        name: 'NASA GIBS',
        opacity: 0.85
      });
    }
    mapRef.current.overlayMapTypes.insertAt(0, nasaOverlayRef.current);
  };

  const removeNasaGibsOverlay = () => {
    if (!mapRef.current) return;
    // Remove all overlays matching our reference
    for (let i = mapRef.current.overlayMapTypes.getLength() - 1; i >= 0; i--) {
      const mt = mapRef.current.overlayMapTypes.getAt(i);
      if (mt === nasaOverlayRef.current) {
        mapRef.current.overlayMapTypes.removeAt(i);
      }
    }
  };

  const toggleNasaOverlay = () => {
    setNasaOverlayEnabled(prev => {
      const next = !prev;
      if (next) {
        addNasaGibsOverlay();
      } else {
        removeNasaGibsOverlay();
      }
      return next;
    });
  };

  // Fetch NASA precipitation time series after weather location available
  useEffect(() => {
    if (!location.lat || !location.lng) return;
    let cancelled = false;
    const run = async () => {
      setNasaPrecip(p => ({ ...p, loading: true }));
      const res = await nasaDataService.getPrecipitationTimeSeries(location.lat, location.lng, 7);
      if (cancelled) return;
      setNasaPrecip({
        loading: false,
        series: res.series || [],
        latest: res.latest ?? null,
        average: res.average ?? null,
        error: res.error || (res.series && res.series.length ? null : 'No data')
      });
    };
    run();
    return () => { cancelled = true; };
  }, [location.lat, location.lng]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark text-text-light">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-text-muted">Loading weather data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-dark text-text-light">
      <Header />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-light mb-2">Your Weather Dashboard</h1>
          <p className="text-text-muted">Real-time weather insights for {location.name}</p>
        </div>

        {/* Current Weather Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-surface-dark rounded-xl border border-border-dark p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-light">Temperature</h3>
              <span className="material-symbols-outlined text-primary text-2xl">device_thermostat</span>
            </div>
            <div className="text-3xl font-bold mb-2 text-text-light">
              {weatherData?.current?.temperature || '--'}°C
            </div>
            <p className="text-text-muted text-sm">Current temperature</p>
          </div>

          <div className="bg-surface-dark rounded-xl border border-border-dark p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-light">Humidity</h3>
              <span className="material-symbols-outlined text-primary text-2xl">humidity_percentage</span>
            </div>
            <div className="text-3xl font-bold mb-2 text-text-light">
              {weatherData?.current?.humidity || '--'}%
            </div>
            <p className="text-text-muted text-sm">Relative humidity</p>
          </div>

          <div className="bg-surface-dark rounded-xl border border-border-dark p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-light">Wind Speed</h3>
              <span className="material-symbols-outlined text-primary text-2xl">air</span>
            </div>
            <div className="text-3xl font-bold mb-2 text-text-light">
              {weatherData?.current?.windSpeed || '--'} km/h
            </div>
            <p className="text-text-muted text-sm">Current wind speed</p>
          </div>

          <div className="bg-surface-dark rounded-xl border border-border-dark p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-light">Pressure</h3>
              <span className="material-symbols-outlined text-primary text-2xl">compress</span>
            </div>
            <div className="text-3xl font-bold mb-2 text-text-light">
              {weatherData?.current?.pressure || '--'} hPa
            </div>
            <p className="text-text-muted text-sm">Atmospheric pressure</p>
          </div>
        </div>

        {/* Forecast Section */}
        <div className="bg-surface-dark rounded-xl border border-border-dark p-6 mb-8">
          <h3 className="text-xl font-semibold mb-6 text-text-light">Today's Forecast</h3>
          <div className="grid grid-cols-1 gap-4">
            {forecast && forecast.length > 0 ? (
              <div className="text-center p-6 bg-background-dark rounded-lg border border-border-dark max-w-md mx-auto">
                <p className="text-sm text-text-muted mb-2">
                  {forecast[0].date ? new Date(forecast[0].date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Unknown'}
                </p>
                <div className="text-3xl mb-2 block">
                  {getWeatherIcon(forecast[0].temperature || 20, forecast[0].precipitation || 0)}
                </div>
                <div className="text-lg font-semibold text-text-light mb-1">
                  {forecast[0].maxTemp || '--'}° / {forecast[0].minTemp || '--'}°
                </div>
                <p className="text-xs text-text-muted">{forecast[0].weatherSymbol || 'Unknown'}</p>
              </div>
            ) : (
              <div className="text-center text-text-muted py-8">
                <p>No forecast data available</p>
              </div>
            )}
          </div>
        </div>

        {/* NASA Precipitation (Data Rods) */}
        <div className="bg-surface-dark rounded-xl border border-border-dark p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4 text-text-light">NASA 7-Day Precipitation</h3>
          {nasaPrecip.loading ? (
            <p className="text-text-muted text-sm">Loading NASA precipitation data...</p>
          ) : nasaPrecip.error ? (
            <p className="text-red-400 text-sm">{nasaPrecip.error}</p>
          ) : (
            <div>
              <div className="flex flex-wrap gap-6 mb-4">
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wide">Latest (mm)</p>
                  <p className="text-2xl font-semibold text-text-light">{nasaPrecip.latest != null ? nasaPrecip.latest.toFixed(2) : '--'}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wide">7-Day Avg (mm)</p>
                  <p className="text-2xl font-semibold text-text-light">{nasaPrecip.average != null ? nasaPrecip.average.toFixed(2) : '--'}</p>
                </div>
              </div>
              {nasaPrecip.series.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-text-muted text-left border-b border-border-dark">
                        <th className="py-2 pr-4 font-medium">Date</th>
                        <th className="py-2 font-medium">Precip (mm)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nasaPrecip.series.map(row => (
                        <tr key={row.date} className="border-b border-border-dark/40 last:border-0">
                          <td className="py-1 pr-4 text-text-light">{row.date}</td>
                          <td className="py-1 text-text-light">{row.value.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          <p className="mt-3 text-xs text-text-muted">Source: NASA GES DISC Data Rods (example variable: {nasaDataService.defaultPrecipVariable})</p>
        </div>

        {/* Weather Map with Google Maps + NASA GIBS overlay */}
        <div className="bg-surface-dark rounded-xl border border-border-dark p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4 text-text-light">Satellite Weather Map</h3>
          <div className="relative h-96 rounded-lg border border-border-dark overflow-hidden">
            <div id="weather-map" className="w-full h-full" />
            
            {/* Map controls */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
              <button
                onClick={() => mapRef.current && mapRef.current.setZoom(mapRef.current.getZoom() + 1)}
                className="bg-slate-800/80 border border-slate-600 text-white p-2 rounded hover:bg-slate-700 transition-colors"
                title="Zoom In"
              >
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
              <button
                onClick={() => mapRef.current && mapRef.current.setZoom(mapRef.current.getZoom() - 1)}
                className="bg-slate-800/80 border border-slate-600 text-white p-2 rounded hover:bg-slate-700 transition-colors"
                title="Zoom Out"
              >
                <span className="material-symbols-outlined text-sm">remove</span>
              </button>
              <button
                onClick={toggleNasaOverlay}
                className={`bg-slate-800/80 border ${nasaOverlayEnabled ? 'border-primary' : 'border-slate-600'} text-white p-2 rounded hover:bg-slate-700 transition-colors`}
                title="Toggle NASA GIBS Overlay"
              >
                <span className="material-symbols-outlined text-sm">layers</span>
              </button>
            </div>
            {nasaOverlayEnabled && (
              <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-3 py-1 rounded z-10">
                NASA GIBS: MODIS Terra True Color
              </div>
            )}
          </div>
          <p className="mt-3 text-xs text-text-muted">Imagery © NASA GIBS / Blue Marble, map data © Google</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <Link 
            to="/define-area" 
            className="flex items-center gap-2 px-6 py-3 bg-surface-dark border border-border-dark hover:border-primary rounded-lg transition-colors text-text-light"
          >
            <span className="material-symbols-outlined">edit_location</span>
            <span>Change Area</span>
          </Link>
          <Link 
            to="/customize" 
            className="flex items-center gap-2 px-6 py-3 bg-surface-dark border border-border-dark hover:border-primary rounded-lg transition-colors text-text-light"
          >
            <span className="material-symbols-outlined">tune</span>
            <span>Customize Dashboard</span>
          </Link>
          <Link 
            to="/analytics" 
            className="flex items-center gap-2 px-6 py-3 bg-surface-dark border border-border-dark hover:border-primary rounded-lg transition-colors text-text-light"
          >
            <span className="material-symbols-outlined">analytics</span>
            <span>View Analytics</span>
          </Link>
          <div className="flex gap-2">
            <button
              onClick={() => handleDownload('json')}
              className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 rounded-lg transition-colors text-white"
            >
              <span className="material-symbols-outlined">download</span>
              Download as JSON
            </button>
            <button
              onClick={() => handleDownload('csv')}
              className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 rounded-lg transition-colors text-white"
            >
              <span className="material-symbols-outlined">download</span>
              Download as CSV
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;