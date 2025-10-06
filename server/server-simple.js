import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// NASA API configuration
const NASA_CONFIG = {
  gesDiscBaseUrl: 'https://hydro1.gesdisc.eosdis.nasa.gov/daac-bin/access/timeseries.cgi',
  giovanniBaseUrl: 'https://giovanni.gsfc.nasa.gov/giovanni',
  worldviewBaseUrl: 'https://worldview.earthdata.nasa.gov',
  earthdataSearchUrl: 'https://search.earthdata.nasa.gov',
  // Add your NASA Earthdata credentials here
  username: process.env.NASA_USERNAME,
  password: process.env.NASA_PASSWORD
};

// NASA Data Rods variables
const DATA_RODS_VARIABLES = {
  precipitation: 'GPM_3IMERGDF_06_precipitation',
  soilMoisture: 'GLDAS_NOAH025_3H_2_1_SoilMoi0_10cm_inst',
  runoff: 'GLDAS_NOAH025_3H_2_1_Qs_acc',
  evapotranspiration: 'GLDAS_NOAH025_3H_2_1_Evap_tavg',
  temperature: 'GLDAS_NOAH025_3H_2_1_Tair_f_inst',
  humidity: 'GLDAS_NOAH025_3H_2_1_Qair_f_inst'
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'NASA Data Proxy Server is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Bulk data endpoint for multiple variables
app.post('/api/nasa/bulk-data', async (req, res) => {
  try {
    const { variables, latitude, longitude, startDate, endDate } = req.body;

    if (!variables || !Array.isArray(variables) || !latitude || !longitude || !startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing required parameters: variables (array), latitude, longitude, startDate, endDate'
      });
    }

    console.log(`🌍 Bulk fetching NASA data for ${variables.length} variables`);

    const results = {};
    
    // For now, return mock data for all variables
    variables.forEach(variable => {
      results[variable] = {
        series: generateMockDataSeries(variable, startDate, endDate),
        source: 'Mock Data (NASA API proxy fallback)',
        status: 'fallback',
        variable: DATA_RODS_VARIABLES[variable] || variable,
        ...getVariableMetadata(variable)
      };
    });

    res.json({
      hydrological: results,
      coordinates: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
      timestamp: new Date().toISOString(),
      source: 'NASA Data Proxy Server (Mock Mode)'
    });

  } catch (error) {
    console.error('Bulk data error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to generate mock data as fallback
function generateMockDataSeries(variable, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const series = [];
  
  const currentDate = new Date(start);
  while (currentDate <= end) {
    let value;
    const dayOfYear = Math.floor((currentDate - new Date(currentDate.getFullYear(), 0, 0)) / 86400000);
    const seasonFactor = Math.sin((dayOfYear / 365) * 2 * Math.PI);
    
    switch (variable) {
      case 'precipitation':
        value = Math.max(0, Math.random() * 8 + seasonFactor * 3);
        break;
      case 'soilMoisture':
        value = Math.max(0.05, Math.random() * 0.25 + 0.15 + seasonFactor * 0.1);
        break;
      case 'temperature':
        value = 20 + Math.random() * 15 + seasonFactor * 10;
        break;
      case 'humidity':
        value = Math.max(20, Math.min(90, 50 + Math.random() * 30 + seasonFactor * 15));
        break;
      case 'evapotranspiration':
        value = Math.max(0, Math.random() * 4 + 2 + seasonFactor * 2);
        break;
      case 'runoff':
        value = Math.max(0, Math.random() * 3 + seasonFactor * 2);
        break;
      default:
        value = Math.random() * 10;
    }
    
    series.push({
      date: currentDate.toISOString().split('T')[0],
      value: Math.round(value * 100) / 100
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return series;
}

// Helper function to get variable metadata
function getVariableMetadata(variable) {
  const metadata = {
    precipitation: { unit: 'mm/day', description: 'Daily precipitation from GPM IMERG' },
    soilMoisture: { unit: 'm³/m³', description: 'Soil moisture content (0-10cm depth)' },
    temperature: { unit: '°C', description: 'Air temperature at 2m height' },
    humidity: { unit: '%', description: 'Relative humidity' },
    evapotranspiration: { unit: 'mm/day', description: 'Evapotranspiration rate' },
    runoff: { unit: 'mm/day', description: 'Surface runoff' }
  };
  
  return metadata[variable] || { unit: 'units', description: 'Unknown parameter' };
}

// Giovanni time-series URL generator
app.get('/api/nasa/giovanni-url', (req, res) => {
  const { latitude, longitude, variable = 'GPM_3IMERGM_06_precipitation', days = 30 } = req.query;
  
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);
  
  const params = new URLSearchParams({
    service: 'ArAvTs',
    starttime: startDate.toISOString().split('T')[0],
    endtime: endDate.toISOString().split('T')[0],
    bbox: `${longitude-0.1},${latitude-0.1},${longitude+0.1},${latitude+0.1}`,
    data: variable,
    variableFacets: 'dataFieldMeasurement%3APrecipitation%3B',
    portal: 'GIOVANNI'
  });
  
  const url = `${NASA_CONFIG.giovanniBaseUrl}/#${params.toString()}`;
  res.json({ url });
});

// Worldview URL generator
app.get('/api/nasa/worldview-url', (req, res) => {
  const { latitude, longitude, layers = 'MODIS_Terra_CorrectedReflectance_TrueColor' } = req.query;
  const today = new Date().toISOString().split('T')[0];
  const url = `${NASA_CONFIG.worldviewBaseUrl}/?v=${longitude-2},${latitude-2},${longitude+2},${latitude+2}&t=${today}&l=${layers}`;
  res.json({ url });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server with error handling
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 NASA Data Proxy Server running on port ${PORT}`);
  console.log(`🌍 CORS enabled for localhost development`);
  console.log(`🛰️ NASA API endpoints configured`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  if (!NASA_CONFIG.username || !NASA_CONFIG.password) {
    console.warn('⚠️  NASA credentials not configured - using mock data fallback');
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
  }
});

export default app;