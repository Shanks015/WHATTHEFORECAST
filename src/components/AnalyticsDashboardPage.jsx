import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import earthEngineService from '../services/earthEngineService';
import weatherService from '../services/weatherService';

const AnalyticsDashboardPage = () => {
  const [selectedTab, setSelectedTab] = useState('historical');
  const [selectedVariable, setSelectedVariable] = useState('Temperature');
  const [satelliteData, setSatelliteData] = useState(null);
  const [earthData, setEarthData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarthEngineData = async () => {
      try {
        setLoading(true);
        
        // Fetch satellite imagery and Earth observation data
        const [landsat, modis, elevation] = await Promise.all([
          earthEngineService.getLandsatImagery(37.7749, -122.4194),
          earthEngineService.getModisWeatherData(37.7749, -122.4194),
          earthEngineService.getElevationData(37.7749, -122.4194)
        ]);

        setSatelliteData(landsat);
        setEarthData({ modis, elevation });
      } catch (error) {
        console.error('Error fetching Earth Engine data:', error);
        // Set fallback data
        setSatelliteData({
          collection: 'LANDSAT/LC08/C02/T1_L2',
          metadata: { cloudCover: 5.2, acquisitionDate: '2023-08-15' }
        });
        setEarthData({
          modis: { temperature: { day: 28.5, night: 18.2 } },
          elevation: { elevation: 156 }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEarthEngineData();
  }, []);

  const tabs = [
    { id: 'current', label: 'Current Conditions' },
    { id: 'historical', label: 'Historical Trends' },
    { id: 'satellite', label: 'Satellite Data' },
    { id: 'threshold', label: 'Threshold Probabilities' }
  ];

  const variables = ['Temperature', 'Humidity', 'Wind Speed', 'Vegetation Index', 'Land Surface Temperature'];

  // Helper to convert data to CSV
  const handleDownloadData = () => {
    // Example: Download modis temperature and elevation as CSV
    if (!earthData) return;
    let csv = 'Variable,Value\n';
    if (earthData.modis) {
      if (earthData.modis.temperature) {
        csv += `MODIS Day Temperature,${earthData.modis.temperature.day}\n`;
        csv += `MODIS Night Temperature,${earthData.modis.temperature.night}\n`;
      }
    }
    if (earthData.elevation) {
      csv += `Elevation,${earthData.elevation.elevation}\n`;
    }
    // Add more fields as needed
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analytics_data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="border-b border-gray-800 px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link className="flex items-center gap-2" to="/">
              {/* whattheforecast logo: simple cloud with sun icon */}
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <circle cx="34" cy="16" r="7" fill="#FFD600" />
                <ellipse cx="22" cy="28" rx="12" ry="8" fill="#90CAF9" />
                <ellipse cx="30" cy="28" rx="8" ry="6" fill="#E3F2FD" />
              </svg>
              <h1 className="text-lg font-bold text-white">whattheforecast</h1>
            </Link>
            <nav className="hidden items-center gap-6 md:flex">
              <Link className="text-sm font-medium text-gray-400 hover:text-primary" to="/">Home</Link>
              <a className="text-sm font-medium text-gray-400 hover:text-primary" href="#">Explore</a>
              <a className="text-sm font-medium text-gray-400 hover:text-primary" href="#">About</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="text-gray-500" fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                  <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
                </svg>
              </div>
              <input className="form-input w-full rounded-lg border-gray-700 bg-gray-900 pl-10 text-sm text-gray-50 focus:border-primary focus:ring-primary" placeholder="Search"/>
            </div>
            <button className="rounded-full p-2 text-gray-400 hover:bg-gray-800 hover:text-gray-200">
              <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                <path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"></path>
              </svg>
            </button>
            <div 
              className="h-10 w-10 rounded-full bg-cover bg-center" 
              style={{
                backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBFCl7paUd6WFlqjxpxYvm6XbzGAB5fc8kyUcyCTMta4NXLn9AjbTkBUEcWUADVKVis7MtNMnFVcOtl41nSpXs63iiEaMrRkuuT47hX6gEe-61eVUARO5EIyeoqxJpMulPpVIcEauerSJuDtT4B59-IQuf7anqRh09XLvQc5uV2ooa4GSl6iI2GRxBHK5RVzGpxJHCHmVuB401HmbhTjunLbZSxFm2LjqsZGnxBpqSZa09MWykyEraAYgubtyMZ4tAPAfW8H9qnMuU")'
              }}
            ></div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <button
              onClick={handleDownloadData}
              className="mb-4 rounded-lg bg-primary px-4 py-2 text-white font-bold hover:opacity-90 transition-opacity"
              disabled={loading || !earthData}
            >
              Download Data
            </button>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Personalized Weather Dashboard</h1>
            <p className="mt-2 text-sm text-gray-400">NASA Earth observation data for your personalized weather experience.</p>
          </div>

          <div className="mb-8">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="text-gray-500" fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                  <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
                </svg>
              </div>
              <input className="form-input w-full rounded-lg border-gray-700 bg-gray-900 py-3 pl-12 text-base text-gray-50 focus:border-primary focus:ring-primary" placeholder="Search for a location"/>
            </div>
          </div>

          <div className="border-b border-gray-800">
            <nav aria-label="Tabs" className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                    selectedTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-400 hover:border-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="py-8">
            <h2 className="text-2xl font-bold text-white">Historical Data Trends</h2>
            <div className="mt-4 max-w-xs">
              <select 
                value={selectedVariable}
                onChange={(e) => setSelectedVariable(e.target.value)}
                className="form-select w-full rounded-lg border-gray-700 bg-gray-900 py-3 text-base text-gray-50 focus:border-primary focus:ring-primary"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                {variables.map((variable) => (
                  <option key={variable} value={variable}>{variable}</option>
                ))}
              </select>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-8">
              <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
                <p className="text-base font-medium text-white">Temperature Trends Over Time</p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-white">25°C</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <p className="text-sm text-gray-400">Last 30 Days</p>
                  <p className="text-sm font-medium text-green-500">+5%</p>
                </div>
                <div className="mt-6 h-48">
                  <svg fill="none" height="100%" preserveAspectRatio="none" viewBox="0 0 472 150" width="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient gradientUnits="userSpaceOnUse" id="chartGradient" x1="0" x2="0" y1="0" y2="150">
                        <stop stopColor="#1173d4" stopOpacity="0.3"></stop>
                        <stop offset="1" stopColor="#1173d4" stopOpacity="0"></stop>
                      </linearGradient>
                    </defs>
                    <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25V150H0V109Z" fill="url(#chartGradient)"></path>
                    <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25" stroke="#1173d4" strokeLinecap="round" strokeWidth="2"></path>
                  </svg>
                </div>
                <div className="mt-4 flex justify-between text-xs font-bold text-gray-400">
                  <span>1W Ago</span>
                  <span>2W Ago</span>
                  <span>3W Ago</span>
                  <span>4W Ago</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div 
                className="aspect-video w-full rounded-lg bg-cover bg-center object-cover" 
                style={{
                  backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB3tNUzBpiWEYLeez6kDqrPcDIxO77kI1OEOkruzo5pPHplZzmwgA4uvQtWx0GSRM_5sAL89YZWfj-Q-mLTGHCBFb1o_8k7qUqtsnBZ-e3FW8IYRmmNwRMK7MVxULFEU5hkDiwrV26fFjJuLSwP8QH_g_8zYsTrKMJcWNG44AO6GR2n0y6Yn0ODceRDF0h_sNUrfRMVQx0kf5C_9AT9QGjKNrC0of8taNqpRjN_0b9-SPYKfYOlFcHazf-d-6HNQYsR11EcFf_2-iQ")'
                }}
              ></div>
            </div>

            <p className="mt-4 text-sm text-gray-400">
              The chart and map above illustrate temperature trends over the past 30 days for New York. 
              The data shows a 5% increase in average temperature compared to the previous month, 
              with the map providing a clear geographical reference.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AnalyticsDashboardPage;