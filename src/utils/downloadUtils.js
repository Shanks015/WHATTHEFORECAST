// Utility functions for data download

export const downloadAsJson = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `${filename}.json`);
};

export const downloadAsCsv = (data, filename) => {
  // Convert data to CSV format
  const headers = ['Date', 'Temperature (°C)', 'Humidity (%)', 'Wind Speed (km/h)', 'Pressure (hPa)', 'Precipitation (mm)'];
  
  // Format current weather and forecast data
  const rows = [headers];
  
  // Add current weather
  if (data.current) {
    rows.push([
      new Date().toISOString(),
      data.current.temperature,
      data.current.humidity,
      data.current.windSpeed,
      data.current.pressure,
      data.current.precipitation
    ]);
  }

  // Add forecast data
  if (data.forecast) {
    data.forecast.forEach(day => {
      rows.push([
        new Date(day.date).toISOString(),
        day.temperature,
        '-', // Humidity not available in forecast
        '-', // Wind speed not available in forecast
        '-', // Pressure not available in forecast
        day.precipitation
      ]);
    });
  }

  // Convert to CSV string
  const csvContent = rows
    .map(row => row.map(item => typeof item === 'string' ? `"${item}"` : item).join(','))
    .join('\\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
};

const downloadBlob = (blob, filename) => {
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};