import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const DataDownloadPage = () => {
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [selectedVariables, setSelectedVariables] = useState(['temperature']);
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState('2023-12-31');

  const formats = [
    { id: 'csv', label: 'CSV' },
    { id: 'json', label: 'JSON' },
    { id: 'netcdf', label: 'NetCDF' }
  ];

  const variables = [
    { id: 'temperature', label: 'Temperature' },
    { id: 'humidity', label: 'Humidity' },
    { id: 'wind-speed', label: 'Wind Speed' },
    { id: 'precipitation', label: 'Precipitation' }
  ];

  const handleVariableChange = (variableId) => {
    setSelectedVariables(prev => {
      if (prev.includes(variableId)) {
        return prev.filter(id => id !== variableId);
      } else {
        return [...prev, variableId];
      }
    });
  };

  const handleDownload = () => {
    // Here you would implement the actual download logic
    alert(`Initiating download for:\nFormat: ${selectedFormat}\nVariables: ${selectedVariables.join(', ')}\nDate Range: ${startDate} to ${endDate}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-4">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h.5A2.5 2.5 0 0021.5 5.5V3.935m-18.49 7.065A9 9 0 1021.95 11" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
                <h1 className="text-xl font-bold text-white">Earth Data</h1>
              </Link>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <Link className="text-sm font-medium text-text-muted hover:text-white transition-colors" to="/analytics">Explore</Link>
              <Link className="text-sm font-medium text-text-muted hover:text-white transition-colors" to="/dashboard">Dashboards</Link>
              <Link className="text-sm font-medium text-white" to="/download">Download</Link>
            </nav>
            <div className="flex items-center gap-4">
              <button className="w-10 h-10 flex items-center justify-center rounded-full text-text-muted hover:bg-white/10 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" fillRule="evenodd"></path>
                </svg>
              </button>
              <div 
                className="w-10 h-10 rounded-full bg-cover bg-center border-2 border-white/20" 
                style={{
                  backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCkhvAE34CnZgk3cPqA0L6njRqhgdzt-GCc_BtGVE31GihLzvfimGvxhMI_8233JSuwGxfNHYVnGenTwupV4HD3E6H-EyPf1YlGK0WrrEDao64se6tyfJfilhe9HUfx4la0SLmOATsaCGGSueI2RYTRl3U9HfhKozbXQ0nk6vcSRPBzlZgCmJd9Q8efLMSehxUDThjSEtzr_ZbKzPx_oKOUWY_bHfdh9Y9GYV0970_4z68PCFdiwoBHh2oe4sVZ4XbF1bITHi54Sls')"
                }}
              ></div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-10 text-center">
            <h2 className="text-4xl font-bold text-white tracking-tight">Data Download & Export</h2>
            <p className="mt-4 text-lg text-text-muted">
              Select your desired data format, variables, and timeframe to generate a custom export from NASA's Earth observation datasets.
            </p>
          </div>

          <div className="bg-surface-dark p-8 rounded-xl space-y-8 border border-white/10 shadow-2xl shadow-black/20">
            {/* Export Format */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Export Format</h3>
              <div className="flex flex-wrap gap-4">
                {formats.map((format) => (
                  <label key={format.id} className="relative cursor-pointer flex-1">
                    <input 
                      className="sr-only peer" 
                      name="data_format" 
                      type="radio" 
                      value={format.id}
                      checked={selectedFormat === format.id}
                      onChange={(e) => setSelectedFormat(e.target.value)}
                    />
                    <div className="text-center px-4 py-3 rounded-lg border border-white/20 bg-background-dark text-white peer-checked:border-primary peer-checked:ring-2 peer-checked:ring-primary peer-checked:bg-primary/10 transition-all duration-200 ease-in-out">
                      {format.label}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Data Variables */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Data Variables</h3>
              <div className="grid grid-cols-2 gap-4">
                {variables.map((variable) => (
                  <label key={variable.id} className="flex items-center gap-x-3 cursor-pointer p-3 rounded-lg hover:bg-white/5 transition-colors">
                    <input 
                      type="checkbox"
                      checked={selectedVariables.includes(variable.id)}
                      onChange={() => handleVariableChange(variable.id)}
                      className="form-checkbox h-5 w-5 rounded border-white/30 bg-surface-dark text-primary focus:ring-primary focus:ring-offset-background-dark checked:bg-primary border-2"
                    />
                    <span className="text-white">{variable.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Date Range</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2" htmlFor="start-date">
                    Start Date
                  </label>
                  <input 
                    className="form-input w-full rounded-lg border-white/20 bg-background-dark text-white focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0" 
                    id="start-date" 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2" htmlFor="end-date">
                    End Date
                  </label>
                  <input 
                    className="form-input w-full rounded-lg border-white/20 bg-background-dark text-white focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0" 
                    id="end-date" 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Download Button */}
            <div className="flex justify-end pt-6">
              <button 
                onClick={handleDownload}
                className="w-full sm:w-auto bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all duration-300 transform hover:scale-105"
              >
                Initiate Download
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DataDownloadPage;