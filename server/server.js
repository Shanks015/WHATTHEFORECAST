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
    timestamp: new Date().toISOString()
  });
});

// Proxy endpoint for NASA GES DISC Data Rods
app.get('/api/nasa/data-rods', async (req, res) => {
  try {
    const { variable, latitude, longitude, startDate, endDate, format = 'json' } = req.query;

    if (!variable || !latitude || !longitude || !startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing required parameters: variable, latitude, longitude, startDate, endDate'
      });
    }

    // Build NASA API URL
    const params = new URLSearchParams({
      variable,
      latitude: parseFloat(latitude).toString(),
      longitude: parseFloat(longitude).toString(),
      startDate,
      endDate,
      type: 'asc',
      format
    });

    const nasaUrl = `${NASA_CONFIG.gesDiscBaseUrl}?${params.toString()}`;
    console.log(`🛰️ Fetching NASA data: ${nasaUrl}`);

    // Make request to NASA API with authentication if available
    const fetchOptions = {
      method: 'GET',
      headers: {
        'User-Agent': 'NASA-Weather-App/1.0',
        'Accept': 'application/json, text/plain, */*'
      }
    };

    // Add authentication if credentials are available
    if (NASA_CONFIG.username && NASA_CONFIG.password) {
      const auth = Buffer.from(`${NASA_CONFIG.username}:${NASA_CONFIG.password}`).toString('base64');
      fetchOptions.headers['Authorization'] = `Basic ${auth}`;
    }

    const response = await fetch(nasaUrl, fetchOptions);
    
    if (!response.ok) {
      console.error(`NASA API error: ${response.status} ${response.statusText}`);
      
      // Return mock data as fallback
      return res.json({
        data: generateMockDataSeries(variable, startDate, endDate),
        source: 'Mock Data (NASA API unavailable)',
        status: 'fallback',
        originalError: `${response.status} ${response.statusText}`
      });
    }

    const data = await response.text();
    
    // Try to parse as JSON, fall back to text
    let parsedData;
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      // NASA might return CSV or other formats
      parsedData = parseNasaTextData(data, variable);
    }

    res.json({
      data: parsedData,
      source: 'NASA GES DISC',
      status: 'success',
      variable,
      location: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
      dateRange: { startDate, endDate }
    });

  } catch (error) {
    console.error('Error fetching NASA data:', error);
    
    // Return mock data as fallback
    res.json({
      data: generateMockDataSeries(req.query.variable, req.query.startDate, req.query.endDate),
      source: 'Mock Data (Error occurred)',
      status: 'error',
      error: error.message
    });
  }
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
    const promises = variables.map(async (variable) => {
      try {
        const params = new URLSearchParams({
          variable: DATA_RODS_VARIABLES[variable] || variable,
          latitude: parseFloat(latitude).toString(),
          longitude: parseFloat(longitude).toString(),
          startDate,
          endDate,
          type: 'asc',
          format: 'json'
        });

        const nasaUrl = `${NASA_CONFIG.gesDiscBaseUrl}?${params.toString()}`;
        
        const fetchOptions = {
          method: 'GET',
          headers: {
            'User-Agent': 'NASA-Weather-App/1.0',
            'Accept': 'application/json, text/plain, */*'
          }
        };

        if (NASA_CONFIG.username && NASA_CONFIG.password) {
          const auth = Buffer.from(`${NASA_CONFIG.username}:${NASA_CONFIG.password}`).toString('base64');
          fetchOptions.headers['Authorization'] = `Basic ${auth}`;
        }

        const response = await fetch(nasaUrl, fetchOptions);
        
        if (!response.ok) {
          throw new Error(`${response.status} ${response.statusText}`);
        }

        const data = await response.text();
        let parsedData;
        
        try {
          parsedData = JSON.parse(data);
        } catch (e) {
          parsedData = parseNasaTextData(data, variable);
        }

        results[variable] = {
          series: parsedData,
          source: 'NASA GES DISC',
          status: 'success',
          variable: DATA_RODS_VARIABLES[variable] || variable,
          ...getVariableMetadata(variable)
        };

      } catch (error) {
        console.warn(`Failed to fetch ${variable}:`, error.message);
        results[variable] = {
          series: generateMockDataSeries(variable, startDate, endDate),
          source: 'Mock Data (NASA API failed)',
          status: 'fallback',
          error: error.message,
          variable: DATA_RODS_VARIABLES[variable] || variable,
          ...getVariableMetadata(variable)
        };
      }
    });

    await Promise.all(promises);

    res.json({
      hydrological: results,
      coordinates: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
      timestamp: new Date().toISOString(),
      source: 'NASA Data Proxy Server'
    });

  } catch (error) {
    console.error('Bulk data error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to parse NASA text data
function parseNasaTextData(textData, variable) {
  const lines = textData.split('\n').filter(line => line.trim());
  const series = [];

  for (const line of lines) {
    // Skip header lines and comments
    if (line.startsWith('#') || line.startsWith('Date') || !line.includes(',')) continue;

    const parts = line.split(',');
    if (parts.length >= 2) {
      const date = parts[0].trim();
      const value = parseFloat(parts[1].trim());
      
      if (!isNaN(value)) {
        series.push({
          date: date,
          value: Math.round(value * 1000) / 1000 // Round to 3 decimal places
        });
      }
    }
  }

  return series;
}

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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 NASA Data Proxy Server running on port ${PORT}`);
  console.log(`🌍 CORS enabled for localhost development`);
  console.log(`🛰️ NASA API endpoints configured`);
  if (!NASA_CONFIG.username || !NASA_CONFIG.password) {
    console.warn('⚠️  NASA credentials not configured - using mock data fallback');
  }
});

export default app;