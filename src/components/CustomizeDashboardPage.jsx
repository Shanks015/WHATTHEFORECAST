import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';

const CustomizeDashboardPage = () => {
  const [selectedVariables, setSelectedVariables] = useState(['temperature']);
  const [selectedTimeframe, setSelectedTimeframe] = useState('Current Season');
  const [weatherData, setWeatherData] = useState(null);

  // Weather variable metadata with units and API parameter mapping
  const weatherVariables = [
    { id: 'temperature', label: 'Temperature', parameter: 't_2m:C', unit: '°C' },
    { id: 'precipitation', label: 'Precipitation', parameter: 'precip_1h:mm', unit: 'mm' },
    { id: 'air-quality', label: 'Air Quality', parameter: null, unit: 'AQI' }, // Not available in Meteomatics
    { id: 'wind-speed', label: 'Wind Speed', parameter: 'wind_speed_10m:ms', unit: 'm/s' }
  ];

  const timeframes = [
    'Current Season',
    'Spring',
    'Summer',
    'Autumn',
    'Winter'
  ];

  // Load weather data from localStorage
  React.useEffect(() => {
    const locationData = localStorage.getItem('selectedLocationData');
    if (locationData) {
      try {
        const parsed = JSON.parse(locationData);
        if (parsed.weatherData && parsed.weatherData.data) {
          setWeatherData(parsed.weatherData);
        }
      } catch (e) {
        setWeatherData(null);
      }
    }
  }, []);

  // Helper to get chart data for a variable
  const getChartData = (variableId) => {
    if (!weatherData || !weatherData.data) return [];
    const variableMeta = weatherVariables.find(v => v.id === variableId);
    if (!variableMeta || !variableMeta.parameter) return [];
    const paramData = weatherData.data.find(d => d.parameter === variableMeta.parameter);
    if (!paramData || !paramData.coordinates || !paramData.coordinates[0].dates) return [];
    // For simplicity, show the first 7 data points
    return paramData.coordinates[0].dates.slice(0, 7).map(d => ({ value: d.value, date: d.date }));
  };

  const handleVariableChange = (variableId) => {
    setSelectedVariables(prev => {
      if (prev.includes(variableId)) {
        return prev.filter(id => id !== variableId);
      } else {
        return [...prev, variableId];
      }
    });
  };

  return (
    <div className="min-h-screen bg-background-dark text-text-light">
      <Header />

      <main className="flex-grow flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">Customize Your Dashboard</h1>
            <p className="mt-4 text-lg text-white/60">
              Tailor your weather view by selecting variables and timeframes that matter to you.
            </p>
          </div>

          <div className="bg-surface-dark rounded-xl shadow-lg border border-white/10 backdrop-blur-md">
            <div className="p-8 space-y-8">
              <div>
                <h3 className="text-xl font-bold mb-4">Weather Variables</h3>
                <div className="grid grid-cols-2 gap-4">
                  {weatherVariables.map((variable) => (
                    <label 
                      key={variable.id}
                      className="flex items-center gap-3 p-4 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors border border-white/10"
                    >
                      <input 
                        type="checkbox"
                        checked={selectedVariables.includes(variable.id)}
                        onChange={() => handleVariableChange(variable.id)}
                        className="form-checkbox h-5 w-5 rounded border-white/30 bg-transparent text-primary focus:ring-primary focus:ring-offset-surface-dark checked:bg-primary"
                      />
                      <span className="font-medium text-white/90">{variable.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4">Time of Year</h3>
                <div className="relative">
                  <select 
                    value={selectedTimeframe}
                    onChange={(e) => setSelectedTimeframe(e.target.value)}
                    className="form-select w-full appearance-none rounded-lg bg-background-dark border border-white/20 py-3 px-4 focus:border-primary focus:ring-primary/50 text-white/90"
                  >
                    {timeframes.map((timeframe) => (
                      <option key={timeframe} value={timeframe}>
                        {timeframe}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none text-white/50">
                    expand_more
                  </span>
                </div>
              </div>
            </div>
                {/* Analytics Visualization Section */}
                <div className="bg-black/20 rounded-xl p-6 mb-8">
                  <h3 className="text-2xl font-bold text-white mb-4">Analytics Preview</h3>
                  {selectedVariables.length === 0 ? (
                    <div className="text-white/70">Select weather variables to see analytics.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {selectedVariables.map((variable) => (
                        <div key={variable} className="bg-background-dark rounded-lg p-4 shadow">
                          <h4 className="text-lg font-semibold text-white mb-2">
                            {weatherVariables.find((v) => v.id === variable)?.label} ({selectedTimeframe})
                          </h4>
                          <AnalyticsChart variable={variable} data={getChartData(variable)} unit={weatherVariables.find(v => v.id === variable)?.unit} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

            <div className="px-8 py-5 bg-black/30 border-t border-white/10 rounded-b-xl">
              <Link to="/dashboard" className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-3 px-6 text-white font-bold text-base hover:opacity-90 transition-opacity">
                <span>Create Dashboard</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Chart component for analytics using actual weather data
const AnalyticsChart = ({ variable, data, unit }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return <div className="text-white/60">No data available for this variable.</div>;
  }
  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  return (
    <svg width="100%" height="80" viewBox="0 0 200 80">
      <rect x="0" y="0" width="200" height="80" fill="#222" rx="8" />
      <polyline
        fill="none"
        stroke="#4f8cff"
        strokeWidth="3"
        points={data.map((d, i) => `${(i * 30) + 10},${70 - ((d.value - min) / (max - min + 1e-6)) * 60}`).join(' ')}
      />
      {data.map((d, i) => (
        <circle
          key={i}
          cx={(i * 30) + 10}
          cy={70 - ((d.value - min) / (max - min + 1e-6)) * 60}
          r="4"
          fill="#4f8cff"
        />
      ))}
      {/* Value labels */}
      {data.map((d, i) => (
        <text
          key={i}
          x={(i * 30) + 10}
          y={70 - ((d.value - min) / (max - min + 1e-6)) * 60 - 10}
          fontSize="10"
          fill="#fff"
          textAnchor="middle"
        >
          {d.value}{unit}
        </text>
      ))}
    </svg>
  );
};

export default CustomizeDashboardPage;