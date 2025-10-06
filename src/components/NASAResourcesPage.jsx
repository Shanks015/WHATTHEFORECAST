import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import nasaDataService from '../services/nasaDataService';

const NASAResourcesPage = () => {
  const routerLocation = useLocation();
  const [location, setLocation] = useState({ lat: 37.7749, lng: -122.4194, name: 'San Francisco, CA' });
  const [nasaData, setNasaData] = useState({
    hydrological: {},
    cptec: {},
    links: {},
    loading: true,
    error: null,
    isMockData: false
  });
  const [selectedVariable, setSelectedVariable] = useState('precipitation');
  const [timeRange, setTimeRange] = useState(14);

  // GES DISC dataset options with metadata
  const datasetOptions = [
    { 
      key: 'precipitation', 
      label: 'Precipitation (GPM)', 
      unit: 'mm/day',
      description: 'Global Precipitation Measurement mission data',
      source: 'GPM_3IMERGDF'
    },
    { 
      key: 'soilMoisture', 
      label: 'Soil Moisture (GLDAS)', 
      unit: 'm³/m³',
      description: 'Global Land Data Assimilation System',
      source: 'GLDAS_NOAH025'
    },
    { 
      key: 'temperature', 
      label: 'Air Temperature (GLDAS)', 
      unit: '°C',
      description: 'Near-surface air temperature',
      source: 'GLDAS_NOAH025'
    },
    { 
      key: 'humidity', 
      label: 'Specific Humidity (GLDAS)', 
      unit: '%',
      description: 'Near-surface specific humidity',
      source: 'GLDAS_NOAH025'
    },
    { 
      key: 'evapotranspiration', 
      label: 'Evapotranspiration (GLDAS)', 
      unit: 'kg/m²/s',
      description: 'Total evapotranspiration',
      source: 'GLDAS_NOAH025'
    },
    { 
      key: 'runoff', 
      label: 'Surface Runoff (GLDAS)', 
      unit: 'kg/m²/s',
      description: 'Surface runoff',
      source: 'GLDAS_NOAH025'
    }
  ];

  useEffect(() => {
    // Get location from state or localStorage
    const locationFromState = routerLocation.state?.locationData;
    const locationFromStorage = localStorage.getItem('selectedLocationData');
    
    if (locationFromState) {
      setLocation({
        lat: locationFromState.coordinates.lat,
        lng: locationFromState.coordinates.lng,
        name: locationFromState.locationName
      });
    } else if (locationFromStorage) {
      try {
        const parsedLocationData = JSON.parse(locationFromStorage);
        setLocation({
          lat: parsedLocationData.coordinates.lat,
          lng: parsedLocationData.coordinates.lng,
          name: parsedLocationData.locationName
        });
      } catch (error) {
        console.error('Error parsing stored location data:', error);
      }
    }
  }, [routerLocation]);

  useEffect(() => {
    if (!location.lat || !location.lng) return;
    fetchNASAData();
  }, [location, timeRange]);

  const fetchNASAData = async () => {
    setNasaData(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await nasaDataService.getComprehensiveData(location.lat, location.lng, timeRange);
      
      // Check data mode (real vs mock)
      const isRealData = data.dataMode === 'real';
      const isMockData = data.dataMode === 'mock';
      
      setNasaData({
        ...data,
        loading: false,
        error: null,
        isMockData,
        isRealData
      });
    } catch (error) {
      console.error('Error fetching NASA data:', error);
      setNasaData(prev => ({ ...prev, loading: false, error: error.message }));
    }
  };

  const renderDataVisualization = (data, datasetInfo) => {
    if (!data || !data.series || data.series.length === 0) {
      return (
        <div className="text-center py-8 text-text-muted">
          <span className="material-symbols-outlined text-4xl mb-4 block opacity-50">data_usage</span>
          <p>No {datasetInfo.label.toLowerCase()} data available</p>
          {data?.error && <p className="text-sm text-red-400 mt-2">{data.error}</p>}
          <p className="text-xs mt-2">Try adjusting the time range or location</p>
        </div>
      );
    }

    const maxValue = Math.max(...data.series.map(d => d.value));
    const minValue = Math.min(...data.series.map(d => d.value));
    const range = maxValue - minValue;

    return (
      <div>
        {/* Dataset header with metadata */}
        <div className="mb-6 p-4 bg-background-dark rounded-lg border border-border-dark">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="text-lg font-semibold text-text-light">{datasetInfo.label}</h4>
              <p className="text-sm text-text-muted">{datasetInfo.description}</p>
              <p className="text-xs text-text-muted mt-1">Source: {datasetInfo.source}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-text-muted">Latest</p>
              <p className="text-xl font-bold text-primary">{data.latest?.toFixed(3)} {datasetInfo.unit}</p>
              <p className="text-xs text-text-muted">{timeRange}-day avg: {data.average?.toFixed(3)}</p>
            </div>
          </div>
        </div>
        
        {/* Enhanced visualization with gradient bars */}
        <div className="space-y-3">
          {data.series.slice(-Math.min(15, data.series.length)).map((point, index) => {
            const percentage = range > 0 ? ((point.value - minValue) / range) * 100 : 50;
            const isLatest = index === data.series.slice(-15).length - 1;
            
            return (
              <div key={index} className={`flex items-center gap-3 p-2 rounded ${isLatest ? 'bg-primary/10' : ''}`}>
                <span className="text-xs text-text-muted w-24 flex-shrink-0 font-mono">
                  {new Date(point.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: '2-digit'
                  })}
                </span>
                <div className="flex-1 bg-background-dark rounded-full h-6 relative overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 rounded-full ${
                      isLatest ? 'bg-gradient-to-r from-primary to-primary/80' : 'bg-gradient-to-r from-blue-500 to-blue-400'
                    }`}
                    style={{ width: `${Math.max(percentage, 3)}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-semibold text-white drop-shadow">
                      {point.value.toFixed(3)}
                    </span>
                  </div>
                </div>
                <span className={`text-xs w-20 text-right font-mono ${isLatest ? 'text-primary font-bold' : 'text-text-light'}`}>
                  {point.value.toFixed(4)} {datasetInfo.unit}
                </span>
              </div>
            );
          })}
        </div>

        {/* Statistical summary */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-background-dark rounded-lg">
            <p className="text-xs text-text-muted uppercase tracking-wide">Maximum</p>
            <p className="text-lg font-bold text-green-400">{maxValue.toFixed(3)}</p>
          </div>
          <div className="p-3 bg-background-dark rounded-lg">
            <p className="text-xs text-text-muted uppercase tracking-wide">Average</p>
            <p className="text-lg font-bold text-blue-400">{data.average?.toFixed(3)}</p>
          </div>
          <div className="p-3 bg-background-dark rounded-lg">
            <p className="text-xs text-text-muted uppercase tracking-wide">Minimum</p>
            <p className="text-lg font-bold text-orange-400">{minValue.toFixed(3)}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background-dark text-text-light">
      <Header />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-light mb-2">NASA Earth Science Data Portal</h1>
          <p className="text-text-muted">
            Access NASA GES DISC datasets, Giovanni visualizations, and CPTEC weather data for {location.name}
          </p>
          <p className="text-sm text-text-muted mt-2">
            Following NASA's Python data access tutorials and best practices
          </p>
        </div>

        {/* Real Data Status Banner */}
        {nasaData.isRealData && (
          <div className="bg-green-900/30 border border-green-700 rounded-xl p-4 mb-8">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-green-400 text-xl mt-0.5">verified</span>
              <div className="flex-1">
                <h3 className="text-green-300 font-semibold mb-2">Real NASA Data Active</h3>
                <p className="text-green-200 text-sm mb-2">
                  Successfully connected to NASA's Earth science data servers via backend proxy.
                  Displaying authentic measurements from NASA GES DISC and other NASA resources.
                </p>
                <div className="text-green-300 text-xs">
                  ✅ Backend proxy server operational • ✅ NASA APIs responding • ✅ Real-time data access
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CORS Information Banner */}
        {nasaData.isMockData && (
          <div className="bg-orange-900/30 border border-orange-700 rounded-xl p-4 mb-8">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-orange-400 text-xl mt-0.5">info</span>
              <div className="flex-1">
                <h3 className="text-orange-300 font-semibold mb-2">Mock Data Mode</h3>
                <p className="text-orange-200 text-sm mb-3">
                  Backend proxy server is not running or NASA APIs are unavailable. 
                  Currently displaying realistic mock data that simulates actual NASA Earth science measurements.
                </p>
                <div className="bg-orange-800/30 rounded-lg p-3">
                  <h4 className="text-orange-300 font-medium text-sm mb-2">To Enable Real NASA Data:</h4>
                  <ul className="text-orange-200 text-xs space-y-1">
                    <li>• Start the backend proxy: <code className="bg-orange-900/50 px-1 rounded">cd server && npm start</code></li>
                    <li>• Optional: Add NASA Earthdata credentials to server/.env</li>
                    <li>• Server will handle authentication and CORS automatically</li>
                    <li>• Interface remains identical - seamless data switching</li>
                  </ul>
                </div>
                <p className="text-orange-300 text-xs mt-2">
                  Mock data provides realistic patterns for development and testing.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-surface-dark rounded-xl border border-border-dark p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-light mb-2">
                NASA Dataset Variable
              </label>
              <select 
                value={selectedVariable}
                onChange={(e) => setSelectedVariable(e.target.value)}
                className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-text-light focus:border-primary"
              >
                {datasetOptions.map(option => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-text-muted mt-1">
                {datasetOptions.find(opt => opt.key === selectedVariable)?.description}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-light mb-2">
                Time Range (Days)
              </label>
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
                className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-text-light focus:border-primary"
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
                <option value={60}>Last 60 days</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchNASAData}
                disabled={nasaData.loading}
                className="w-full px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                {nasaData.loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">refresh</span>
                    Refresh Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Data Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* NASA Data Rods Visualization */}
          <div className="bg-surface-dark rounded-xl border border-border-dark p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary text-2xl">water_drop</span>
              <div>
                <h3 className="text-xl font-semibold text-text-light">NASA Data Rods</h3>
                <p className="text-sm text-text-muted">Hydrological time-series data</p>
              </div>
            </div>
            
            {nasaData.loading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-text-muted">Fetching NASA GES DISC data...</p>
                <p className="text-xs text-text-muted mt-2">This may take a few moments</p>
              </div>
            ) : nasaData.error ? (
              <div className="text-center py-12 text-red-400">
                <span className="material-symbols-outlined text-4xl mb-4 block">error</span>
                <p className="font-medium">Data Access Error</p>
                <p className="text-sm mt-2">{nasaData.error}</p>
                <button 
                  onClick={fetchNASAData}
                  className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-300 text-sm transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : (
              renderDataVisualization(
                nasaData.hydrological?.[selectedVariable],
                datasetOptions.find(opt => opt.key === selectedVariable)
              )
            )}
          </div>

          {/* CPTEC Weather Data */}
          <div className="bg-surface-dark rounded-xl border border-border-dark p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary text-2xl">satellite</span>
              <div>
                <h3 className="text-xl font-semibold text-text-light">CPTEC/INPE</h3>
                <p className="text-sm text-text-muted">Brazilian Space Agency weather data</p>
              </div>
            </div>
            
            {nasaData.cptec?.available ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-400 mb-4">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span className="text-sm font-medium">CPTEC data available for this region</span>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {nasaData.cptec.forecastUrl && (
                    <a 
                      href={nasaData.cptec.forecastUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-background-dark rounded-lg hover:bg-primary/10 transition-colors border border-border-dark hover:border-primary"
                    >
                      <span className="material-symbols-outlined text-primary">satellite_alt</span>
                      <div>
                        <p className="text-sm font-medium text-text-light">GOES-16 Satellite Imagery</p>
                        <p className="text-xs text-text-muted">Latest infrared channel data</p>
                      </div>
                    </a>
                  )}
                  
                  {nasaData.cptec.radarUrl && (
                    <a 
                      href={nasaData.cptec.radarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-background-dark rounded-lg hover:bg-primary/10 transition-colors border border-border-dark hover:border-primary"
                    >
                      <span className="material-symbols-outlined text-primary">radar</span>
                      <div>
                        <p className="text-sm font-medium text-text-light">Weather Radar Data</p>
                        <p className="text-xs text-text-muted">Real-time precipitation patterns</p>
                      </div>
                    </a>
                  )}

                  {nasaData.cptec.satelliteUrl && (
                    <a 
                      href={nasaData.cptec.satelliteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-background-dark rounded-lg hover:bg-primary/10 transition-colors border border-border-dark hover:border-primary"
                    >
                      <span className="material-symbols-outlined text-primary">image</span>
                      <div>
                        <p className="text-sm font-medium text-text-light">Animated Satellite</p>
                        <p className="text-xs text-text-muted">Time-lapse cloud movement</p>
                      </div>
                    </a>
                  )}
                </div>

                <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-xs text-blue-300">
                    <strong>CPTEC Coverage:</strong> South America region (Brazil, Argentina, Chile, etc.)
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-text-muted">
                <span className="material-symbols-outlined text-6xl mb-4 block opacity-30">location_off</span>
                <p className="font-medium mb-2">CPTEC data not available</p>
                <p className="text-sm">Coverage limited to South America</p>
                <p className="text-xs mt-2 opacity-70">
                  Current location: {location.name} ({location.lat.toFixed(2)}°, {location.lng.toFixed(2)}°)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* NASA Resource Links */}
        <div className="bg-surface-dark rounded-xl border border-border-dark p-6 mb-8">
          <h3 className="text-xl font-semibold mb-6 text-text-light flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">link</span>
            NASA Earth Science Resources & Tools
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Location-specific links */}
            {nasaData.links?.giovanni && (
              <a 
                href={nasaData.links.giovanni}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-4 bg-background-dark rounded-lg hover:bg-primary/10 transition-all border border-border-dark hover:border-primary"
              >
                <span className="material-symbols-outlined text-primary text-2xl group-hover:scale-110 transition-transform">analytics</span>
                <div>
                  <p className="font-medium text-text-light">Giovanni Analysis</p>
                  <p className="text-sm text-text-muted">Time-series for this location</p>
                </div>
              </a>
            )}

            {nasaData.links?.worldview && (
              <a 
                href={nasaData.links.worldview}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-4 bg-background-dark rounded-lg hover:bg-primary/10 transition-all border border-border-dark hover:border-primary"
              >
                <span className="material-symbols-outlined text-primary text-2xl group-hover:scale-110 transition-transform">public</span>
                <div>
                  <p className="font-medium text-text-light">Worldview Imagery</p>
                  <p className="text-sm text-text-muted">Satellite imagery viewer</p>
                </div>
              </a>
            )}

            {nasaData.links?.earthdataSearch && (
              <a 
                href={nasaData.links.earthdataSearch}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-4 bg-background-dark rounded-lg hover:bg-primary/10 transition-all border border-border-dark hover:border-primary"
              >
                <span className="material-symbols-outlined text-primary text-2xl group-hover:scale-110 transition-transform">search</span>
                <div>
                  <p className="font-medium text-text-light">Earthdata Search</p>
                  <p className="text-sm text-text-muted">Browse datasets for region</p>
                </div>
              </a>
            )}

            {/* General NASA resources */}
            <a 
              href="https://disc.gsfc.nasa.gov/information/howto?page=1&dataTools=Python"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 p-4 bg-background-dark rounded-lg hover:bg-primary/10 transition-all border border-border-dark hover:border-primary"
            >
              <span className="material-symbols-outlined text-primary text-2xl group-hover:scale-110 transition-transform">code</span>
              <div>
                <p className="font-medium text-text-light">GES DISC Tutorials</p>
                <p className="text-sm text-text-muted">Python data access guides</p>
              </div>
            </a>

            <a 
              href="https://giovanni.gsfc.nasa.gov/giovanni/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 p-4 bg-background-dark rounded-lg hover:bg-primary/10 transition-all border border-border-dark hover:border-primary"
            >
              <span className="material-symbols-outlined text-primary text-2xl group-hover:scale-110 transition-transform">dashboard</span>
              <div>
                <p className="font-medium text-text-light">Giovanni Portal</p>
                <p className="text-sm text-text-muted">Interactive data analysis</p>
              </div>
            </a>

            <a 
              href="https://opendap.cr.usgs.gov/opendap/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 p-4 bg-background-dark rounded-lg hover:bg-primary/10 transition-all border border-border-dark hover:border-primary"
            >
              <span className="material-symbols-outlined text-primary text-2xl group-hover:scale-110 transition-transform">storage</span>
              <div>
                <p className="font-medium text-text-light">OPeNDAP Server</p>
                <p className="text-sm text-text-muted">Data subsetting service</p>
              </div>
            </a>
          </div>
        </div>

        {/* Data Information Footer */}
        <div className="bg-surface-dark rounded-xl border border-border-dark p-6">
          <div className="text-center text-text-muted text-sm">
            <p className="flex items-center justify-center gap-2 mb-2">
              <span className="material-symbols-outlined text-xs">info</span>
              Data Sources: NASA GES DISC, Giovanni, CPTEC/INPE, Worldview
              {nasaData.isMockData && <span className="text-orange-400 text-xs ml-2">(Mock Data Mode)</span>}
              {nasaData.isRealData && <span className="text-green-400 text-xs ml-2">(Real NASA Data)</span>}
            </p>
            <p>
              Location: {location.lat.toFixed(4)}°N, {location.lng.toFixed(4)}°E ({location.name})
            </p>
            <p className="mt-1">
              Last updated: {nasaData.timestamp ? new Date(nasaData.timestamp).toLocaleString() : 'Never'} | 
              Time range: {timeRange} days
              {nasaData.isMockData && <span className="text-orange-400 text-xs ml-2">• Simulated data</span>}
            </p>
            <p className="text-xs mt-2 opacity-70">
              Following NASA's Python API best practices for web applications
            </p>
            {nasaData.note && (
              <p className="text-xs mt-2 text-orange-400 bg-orange-900/20 rounded px-2 py-1 inline-block">
                {nasaData.note}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default NASAResourcesPage;