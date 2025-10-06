// NASA Data Service
// Provides access to NASA Earthdata resources via backend proxy
// Supports both real NASA API data and mock data fallback

class NasaDataService {
  constructor() {
    // Backend proxy configuration
    this.proxyBaseUrl = import.meta.env.VITE_PROXY_URL || 'http://localhost:3001';
    this.useRealData = import.meta.env.VITE_USE_REAL_NASA_DATA === 'true' || false;
    
    // Data Rods variables for hydrology
    this.dataRodsVariables = {
      precipitation: 'GPM_3IMERGDF_06_precipitation',
      soilMoisture: 'GLDAS_NOAH025_3H_2_1_SoilMoi0_10cm_inst',
      runoff: 'GLDAS_NOAH025_3H_2_1_Qs_acc',
      evapotranspiration: 'GLDAS_NOAH025_3H_2_1_Evap_tavg',
      temperature: 'GLDAS_NOAH025_3H_2_1_Tair_f_inst',
      humidity: 'GLDAS_NOAH025_3H_2_1_Qair_f_inst'
    };
    
    this.defaultPrecipVariable = this.dataRodsVariables.precipitation;
    
    // External NASA service URLs
    this.giovanniBaseUrl = 'https://giovanni.gsfc.nasa.gov/giovanni';
    this.worldviewBaseUrl = 'https://worldview.earthdata.nasa.gov';
    this.cptecBaseUrl = 'https://satellite.cptec.inpe.br/repositorio';
    
    console.log(`🛰️ NASA Data Service initialized - Real data: ${this.useRealData}`);
  }

  /**
   * Check if backend proxy is available
   */
  async checkProxyHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${this.proxyBaseUrl}/health`, {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ NASA proxy server is healthy:', data);
        return true;
      } else {
        console.warn('⚠️ NASA proxy server responded with error:', response.status);
        return false;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('⚠️ NASA proxy server health check timed out');
      } else {
        console.warn('⚠️ NASA proxy server unavailable:', error.message);
      }
      return false;
    }
  }

  /**
   * Fetch real NASA data from backend proxy
   */
  async fetchRealNasaData(variable, lat, lng, startDate, endDate) {
    try {
      const params = new URLSearchParams({
        variable,
        latitude: lat.toString(),
        longitude: lng.toString(),
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        format: 'json'
      });

      const response = await fetch(`${this.proxyBaseUrl}/api/nasa/data-rods?${params}`);
      
      if (!response.ok) {
        throw new Error(`Proxy server error: ${response.status}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error(`Failed to fetch real NASA data for ${variable}:`, error);
      throw error;
    }
  }

  /**
   * Fetch bulk NASA data for multiple variables
   */
  async fetchBulkRealData(lat, lng, days = 7) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - (days - 1));

      const response = await fetch(`${this.proxyBaseUrl}/api/nasa/bulk-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variables: Object.keys(this.dataRodsVariables),
          latitude: lat,
          longitude: lng,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        })
      });

      if (!response.ok) {
        throw new Error(`Bulk data request failed: ${response.status}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Failed to fetch bulk real NASA data:', error);
      throw error;
    }
  }

  /**
   * Build Data Rods time series URL
   * @param {Object} opts
   * @param {string} opts.variable - Variable name
   * @param {Date} opts.startDate
   * @param {Date} opts.endDate
   * @param {number} opts.lat
   * @param {number} opts.lng
   * @param {string} [opts.format='json']
   */
  buildDataRodsUrl({ variable, startDate, endDate, lat, lng, format = 'json' }) {
    const params = new URLSearchParams({
      variable,
      latitude: lat.toString(),
      longitude: lng.toString(),
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      type: 'asc', // ascending chronological order
      format
    });
    return `${this.baseDataRodsUrl}?${params.toString()}`;
  }

  /**
   * Fetch precipitation time series (last N days)
   * @param {number} lat
   * @param {number} lng
   * @param {number} days
   */
  async getPrecipitationTimeSeries(lat, lng, days = 7) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - (days - 1));
      const url = this.buildDataRodsUrl({
        variable: this.defaultPrecipVariable,
        startDate,
        endDate,
        lat,
        lng
      });
      const res = await fetch(url);
      if (!res.ok) throw new Error(`NASA Data Rods request failed: ${res.status}`);
      const data = await res.json();
      return this.parsePrecipitationSeries(data);
    } catch (err) {
      console.error('Error fetching NASA precipitation time series:', err);
      return { series: [], error: err.message };
    }
  }

  /**
   * Parse Data Rods JSON structure
   */
  parsePrecipitationSeries(json) {
    // Expected structure: { data: [ { date_time: 'YYYY-MM-DD', value: number }, ... ] }
    if (!json || !Array.isArray(json.data)) return { series: [] };
    const series = json.data
      .filter(d => d.value !== null && d.value !== 'NA')
      .map(d => ({
        date: d.date_time,
        value: Number(d.value)
      }));
    const latest = series.length ? series[series.length - 1].value : null;
    const avg = series.length ? (series.reduce((a, b) => a + b.value, 0) / series.length) : null;
    return { series, latest, average: avg };
  }

  /**
   * Generate mock hydrological data when NASA APIs are unavailable due to CORS
   */
  generateMockHydrologicalData(lat, lng, days = 7) {
    const results = {};
    const endDate = new Date();
    
    // Generate seasonal and location-based variations
    const dayOfYear = endDate.getDayOfYear ? endDate.getDayOfYear() : Math.floor((endDate - new Date(endDate.getFullYear(), 0, 0)) / 86400000);
    const latFactor = Math.abs(lat) / 90; // 0-1 based on distance from equator
    const seasonFactor = Math.sin((dayOfYear / 365) * 2 * Math.PI); // -1 to 1
    
    Object.keys(this.dataRodsVariables).forEach(key => {
      const series = [];
      let unit, description; // Declare these outside the loop
      
      // Set unit and description based on variable type
      switch (key) {
        case 'precipitation':
          unit = 'mm/day';
          description = 'Daily precipitation from GPM IMERG';
          break;
        case 'soilMoisture':
          unit = 'm³/m³';
          description = 'Soil moisture content (0-10cm depth)';
          break;
        case 'temperature':
          unit = '°C';
          description = 'Air temperature at 2m height';
          break;
        case 'humidity':
          unit = '%';
          description = 'Relative humidity';
          break;
        case 'evapotranspiration':
          unit = 'mm/day';
          description = 'Evapotranspiration rate';
          break;
        case 'runoff':
          unit = 'mm/day';
          description = 'Surface runoff';
          break;
        default:
          unit = 'units';
          description = 'Unknown parameter';
      }
      
      for (let i = 0; i < days; i++) {
        const date = new Date(endDate);
        date.setDate(endDate.getDate() - (days - 1 - i));
        
        let value;
        const dailyVariation = Math.sin(i * 0.7) * 0.3; // Daily variation
        
        switch (key) {
          case 'precipitation':
            value = Math.max(0, Math.random() * 8 + seasonFactor * 3 + dailyVariation);
            break;
          case 'soilMoisture':
            value = Math.max(0.05, Math.random() * 0.25 + 0.15 + seasonFactor * 0.1);
            break;
          case 'temperature':
            const baseTemp = 20 - (latFactor * 15) + seasonFactor * 10;
            value = baseTemp + Math.random() * 10 - 5 + dailyVariation * 3;
            break;
          case 'humidity':
            value = Math.max(20, Math.min(90, 50 + Math.random() * 30 + seasonFactor * 15));
            break;
          case 'evapotranspiration':
            value = Math.max(0, Math.random() * 4 + 2 + seasonFactor * 2 + latFactor);
            break;
          case 'runoff':
            value = Math.max(0, Math.random() * 3 + seasonFactor * 2);
            break;
          default:
            value = Math.random() * 10;
        }
        
        series.push({
          date: date.toISOString().split('T')[0],
          value: Math.round(value * 100) / 100
        });
      }
      
      results[key] = {
        series,
        unit,
        description,
        source: 'Mock Data (NASA APIs blocked by CORS)',
        location: { lat, lng },
        variable: this.dataRodsVariables[key],
        lastUpdated: new Date().toISOString()
      };
    });
    
    return results;
  }

  /**
   * Get multiple hydrological variables (real or mock data)
   */
  async getHydrologicalData(lat, lng, days = 7) {
    // First check if we should try real data and if proxy is available
    if (this.useRealData) {
      console.log('🔍 Checking NASA proxy server availability...');
      const proxyAvailable = await this.checkProxyHealth();
      
      if (proxyAvailable) {
        try {
          console.log('🌍 Fetching real NASA data via proxy...');
          const result = await this.fetchBulkRealData(lat, lng, days);
          
          if (result && result.hydrological) {
            console.log('✅ Real NASA data fetched successfully');
            return result.hydrological;
          }
        } catch (error) {
          console.warn('⚠️ Real NASA data failed, falling back to mock data:', error.message);
        }
      } else {
        console.warn('⚠️ Proxy server unavailable, using mock data');
      }
    } else {
      console.log('📊 Real data mode disabled, using mock data');
    }
    
    // Fall back to mock data
    console.log('📊 Using mock NASA data');
    return this.generateMockHydrologicalData(lat, lng, days);
  }

  /**
   * Generate Giovanni time-series plot URL
   */
  async getGiovanniTimeSeriesUrl(lat, lng, variable = 'GPM_3IMERGM_06_precipitation', days = 30) {
    // Try to get URL from proxy if available
    if (this.useRealData) {
      try {
        const params = new URLSearchParams({
          latitude: lat,
          longitude: lng,
          variable,
          days
        });
        
        const response = await fetch(`${this.proxyBaseUrl}/api/nasa/giovanni-url?${params}`);
        if (response.ok) {
          const result = await response.json();
          return result.url;
        }
      } catch (error) {
        console.warn('Failed to get Giovanni URL from proxy:', error);
      }
    }
    
    // Fallback to direct URL generation
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    const params = new URLSearchParams({
      service: 'ArAvTs',
      starttime: startDate.toISOString().split('T')[0],
      endtime: endDate.toISOString().split('T')[0],
      bbox: `${lng-0.1},${lat-0.1},${lng+0.1},${lat+0.1}`,
      data: variable,
      variableFacets: 'dataFieldMeasurement%3APrecipitation%3B',
      portal: 'GIOVANNI'
    });
    
    return `${this.giovanniBaseUrl}/#${params.toString()}`;
  }

  /**
   * Generate Worldview imagery URL for location
   */
  async getWorldviewUrl(lat, lng, layers = 'MODIS_Terra_CorrectedReflectance_TrueColor') {
    // Try to get URL from proxy if available
    if (this.useRealData) {
      try {
        const params = new URLSearchParams({
          latitude: lat,
          longitude: lng,
          layers
        });
        
        const response = await fetch(`${this.proxyBaseUrl}/api/nasa/worldview-url?${params}`);
        if (response.ok) {
          const result = await response.json();
          return result.url;
        }
      } catch (error) {
        console.warn('Failed to get Worldview URL from proxy:', error);
      }
    }
    
    // Fallback to direct URL generation
    const today = new Date().toISOString().split('T')[0];
    return `${this.worldviewBaseUrl}/?v=${lng-2},${lat-2},${lng+2},${lat+2}&t=${today}&l=${layers}`;
  }

  /**
   * Get CPTEC weather data (Brazil/South America focus)
   */
  async getCptecWeatherData(lat, lng) {
    try {
      // CPTEC provides various weather products
      // This is a simplified example - actual implementation may need specific endpoints
      const cptecData = {
        forecastUrl: `${this.cptecBaseUrl}/goes16/produtos/tempo/goes16_ret_ch13_ams_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.jpg`,
        radarUrl: `${this.cptecBaseUrl}/radar/radar_ppi_ams.gif`,
        satelliteUrl: `${this.cptecBaseUrl}/goes16/produtos/tempo/goes16_ret_ch13_ams.gif`,
        available: this.isInSouthAmerica(lat, lng)
      };
      
      return cptecData;
    } catch (err) {
      console.error('Error fetching CPTEC data:', err);
      return { error: err.message, available: false };
    }
  }

  /**
   * Check if coordinates are in South America (CPTEC coverage area)
   */
  isInSouthAmerica(lat, lng) {
    return lat >= -60 && lat <= 15 && lng >= -85 && lng <= -30;
  }

  /**
   * Get Earthdata Search URL for location and keywords
   */
  getEarthdataSearchUrl(lat, lng, keywords = 'precipitation,temperature') {
    const bbox = `${lng-1},${lat-1},${lng+1},${lat+1}`;
    return `https://search.earthdata.nasa.gov/search?sb=${bbox}&q=${encodeURIComponent(keywords)}`;
  }

  /**
   * Get comprehensive NASA data summary for location
   */
  async getComprehensiveData(lat, lng, days = 7) {
    console.log('🛰️ NASA Data Service: Fetching comprehensive Earth science data...');
    console.log('📍 Location:', { lat, lng });
    
    const dataSource = this.useRealData ? 'Real NASA APIs (via proxy)' : 'Mock data simulation';
    console.log('📊 Data source:', dataSource);
    
    const [hydrologicalData, cptecData] = await Promise.all([
      this.getHydrologicalData(lat, lng, days),
      this.getCptecWeatherData(lat, lng)
    ]);

    // Generate external links
    const giovanniUrl = await this.getGiovanniTimeSeriesUrl(lat, lng);
    const worldviewUrl = await this.getWorldviewUrl(lat, lng);

    const isUsingRealData = hydrologicalData && Object.values(hydrologicalData).some(
      data => data.source && data.source.includes('NASA GES DISC')
    );

    return {
      hydrological: hydrologicalData,
      cptec: cptecData,
      links: {
        giovanni: giovanniUrl,
        worldview: worldviewUrl,
        earthdataSearch: this.getEarthdataSearchUrl(lat, lng)
      },
      coordinates: { lat, lng },
      timestamp: new Date().toISOString(),
      dataMode: isUsingRealData ? 'real' : 'mock',
      note: isUsingRealData 
        ? 'Real NASA data accessed via backend proxy' 
        : 'Mock data used - start proxy server for real NASA data access'
    };
  }
}

const nasaDataService = new NasaDataService();
export default nasaDataService;
