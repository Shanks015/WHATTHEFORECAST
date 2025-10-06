import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// NASA Data Rods variables
const DATA_RODS_VARIABLES = {
  precipitation: 'GPM_3IMERGDF_06_precipitation',
  soilMoisture: 'GLDAS_NOAH025_3H_2_1_SoilMoi0_10cm_inst',
  runoff: 'GLDAS_NOAH025_3H_2_1_Qs_acc',
  evapotranspiration: 'GLDAS_NOAH025_3H_2_1_Evap_tavg',
  temperature: 'GLDAS_NOAH025_3H_2_1_Tair_f_inst',
  humidity: 'GLDAS_NOAH025_3H_2_1_Qair_f_inst'
};

app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'ok', 
    message: 'NASA Data Proxy Server is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Bulk data endpoint
app.post('/api/nasa/bulk-data', async (req, res) => {
  try {
    const { variables, latitude, longitude, startDate, endDate } = req.body;

    console.log('Bulk data request:', { variables, latitude, longitude, startDate, endDate });

    if (!variables || !Array.isArray(variables) || !latitude || !longitude || !startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing required parameters: variables (array), latitude, longitude, startDate, endDate'
      });
    }

    const results = {};
    
    // Generate mock data for all variables
    variables.forEach(variable => {
      results[variable] = {
        series: generateMockDataSeries(variable, startDate, endDate),
        source: 'NASA Data Proxy Server (Mock Mode)',
        status: 'success',
        variable: DATA_RODS_VARIABLES[variable] || variable,
        ...getVariableMetadata(variable)
      };
    });

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

// Giovanni URL endpoint
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
  
  const url = `https://giovanni.gsfc.nasa.gov/giovanni/#${params.toString()}`;
  res.json({ url });
});

// Worldview URL endpoint
app.get('/api/nasa/worldview-url', (req, res) => {
  const { latitude, longitude, layers = 'MODIS_Terra_CorrectedReflectance_TrueColor' } = req.query;
  const today = new Date().toISOString().split('T')[0];
  const url = `https://worldview.earthdata.nasa.gov/?v=${longitude-2},${latitude-2},${longitude+2},${latitude+2}&t=${today}&l=${layers}`;
  res.json({ url });
});

// Helper functions
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

app.listen(PORT, (err) => {
  if (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
  console.log(`🚀 NASA Data Proxy Server running on http://localhost:${PORT}`);
  console.log(`🌍 CORS enabled for localhost development`);
  console.log(`🛰️ NASA API endpoints configured`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`⚠️  Using mock data mode for development`);
});