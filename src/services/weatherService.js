import axios from 'axios';

const METEOMATICS_BASE_URL = 'https://api.meteomatics.com';

class WeatherService {
  constructor() {
    this.apiUsername = import.meta.env.VITE_METEOMATICS_USERNAME;
    this.apiPassword = import.meta.env.VITE_METEOMATICS_PASSWORD;
    this.baseURL = METEOMATICS_BASE_URL;
  }

  // Create authorization header
  getAuthHeader() {
    const credentials = btoa(`${this.apiUsername}:${this.apiPassword}`);
    return {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json'
    };
  }

  // Format date for API
  formatDate(date) {
    return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
  }

  // Get current weather for a location
  async getCurrentWeather(lat, lng) {
    try {
      const now = new Date();
      const params = [
        't_2m:C',           // Temperature at 2m in Celsius
        'precip_1h:mm',     // Precipitation in last hour
        'wind_speed_10m:ms', // Wind speed at 10m
        'wind_dir_10m:d',   // Wind direction at 10m
        'relative_humidity_2m:p', // Relative humidity
        'msl_pressure:hPa'  // Mean sea level pressure
      ].join(',');

      const url = `${this.baseURL}/${this.formatDate(now)}/${params}/${lat},${lng}/json`;
      
      const response = await axios.get(url, {
        headers: this.getAuthHeader()
      });

      return this.parseCurrentWeatherResponse(response.data);
    } catch (error) {
      console.error('Error fetching current weather:', error);
      throw error;
    }
  }

  // Get weather forecast
  async getWeatherForecast(lat, lng, days = 7) {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + days);

      const params = [
        't_2m:C',
        't_max_2m_24h:C',
        't_min_2m_24h:C',
        'precip_24h:mm',
        'wind_speed_10m:ms',
        'weather_symbol_1h:idx'
      ].join(',');

      const timeString = `${this.formatDate(startDate)}--${this.formatDate(endDate)}:PT1H`;
      const url = `${this.baseURL}/${timeString}/${params}/${lat},${lng}/json`;

      const response = await axios.get(url, {
        headers: this.getAuthHeader()
      });

      return this.parseWeatherForecastResponse(response.data);
    } catch (error) {
      console.error('Error fetching weather forecast:', error);
      throw error;
    }
  }

  // Get historical weather data
  async getHistoricalWeather(lat, lng, startDate, endDate) {
    try {
      const params = [
        't_2m:C',
        'precip_1h:mm',
        'wind_speed_10m:ms',
        'relative_humidity_2m:p'
      ].join(',');

      const timeString = `${this.formatDate(startDate)}--${this.formatDate(endDate)}:PT1H`;
      const url = `${this.baseURL}/${timeString}/${params}/${lat},${lng}/json`;

      const response = await axios.get(url, {
        headers: this.getAuthHeader()
      });

      return this.parseHistoricalWeatherResponse(response.data);
    } catch (error) {
      console.error('Error fetching historical weather:', error);
      throw error;
    }
  }

  // Parse current weather response
  parseCurrentWeatherResponse(data) {
    const weatherData = {};
    
    data.data.forEach(item => {
      const parameter = item.parameter;
      const value = item.coordinates[0].dates[0].value;
      
      switch (parameter) {
        case 't_2m:C':
          weatherData.temperature = Math.round(value);
          break;
        case 'precip_1h:mm':
          weatherData.precipitation = value;
          break;
        case 'wind_speed_10m:ms':
          weatherData.windSpeed = Math.round(value * 3.6); // Convert m/s to km/h
          break;
        case 'wind_dir_10m:d':
          weatherData.windDirection = Math.round(value);
          break;
        case 'relative_humidity_2m:p':
          weatherData.humidity = Math.round(value);
          break;
        case 'msl_pressure:hPa':
          weatherData.pressure = Math.round(value);
          break;
      }
    });

    return {
      current: weatherData,
      location: {
        lat: data.data[0].coordinates[0].lat,
        lng: data.data[0].coordinates[0].lon
      },
      timestamp: new Date(data.data[0].coordinates[0].dates[0].date)
    };
  }

  // Parse weather forecast response
  parseWeatherForecastResponse(data) {
    const forecastData = [];
    const dailyData = {};

    data.data.forEach(item => {
      const parameter = item.parameter;
      
      item.coordinates[0].dates.forEach(dateItem => {
        const date = new Date(dateItem.date);
        const dateKey = date.toDateString();
        
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = {
            date: date,
            temperatures: [],
            precipitation: 0,
            windSpeeds: [],
            weatherSymbol: null
          };
        }

        switch (parameter) {
          case 't_2m:C':
            dailyData[dateKey].temperatures.push(dateItem.value);
            break;
          case 't_max_2m_24h:C':
            dailyData[dateKey].maxTemp = Math.round(dateItem.value);
            break;
          case 't_min_2m_24h:C':
            dailyData[dateKey].minTemp = Math.round(dateItem.value);
            break;
          case 'precip_24h:mm':
            dailyData[dateKey].precipitation = dateItem.value;
            break;
          case 'wind_speed_10m:ms':
            dailyData[dateKey].windSpeeds.push(dateItem.value * 3.6);
            break;
          case 'weather_symbol_1h:idx':
            if (!dailyData[dateKey].weatherSymbol) {
              dailyData[dateKey].weatherSymbol = dateItem.value;
            }
            break;
        }
      });
    });

    // Convert to array and calculate averages
    Object.keys(dailyData).forEach(dateKey => {
      const day = dailyData[dateKey];
      const avgTemp = day.temperatures.length > 0 
        ? Math.round(day.temperatures.reduce((a, b) => a + b, 0) / day.temperatures.length)
        : null;
      const avgWind = day.windSpeeds.length > 0
        ? Math.round(day.windSpeeds.reduce((a, b) => a + b, 0) / day.windSpeeds.length)
        : null;

      forecastData.push({
        date: day.date,
        temperature: avgTemp,
        maxTemp: day.maxTemp,
        minTemp: day.minTemp,
        precipitation: day.precipitation,
        windSpeed: avgWind,
        weatherSymbol: this.getWeatherDescription(day.weatherSymbol)
      });
    });

    return forecastData.sort((a, b) => a.date - b.date);
  }

  // Parse historical weather response
  parseHistoricalWeatherResponse(data) {
    const historicalData = [];

    if (data.data && data.data.length > 0) {
      const dates = data.data[0].coordinates[0].dates;
      
      dates.forEach(dateItem => {
        const weatherPoint = {
          timestamp: new Date(dateItem.date),
          temperature: null,
          precipitation: null,
          windSpeed: null,
          humidity: null
        };

        data.data.forEach(item => {
          const value = item.coordinates[0].dates.find(d => d.date === dateItem.date)?.value;
          
          switch (item.parameter) {
            case 't_2m:C':
              weatherPoint.temperature = Math.round(value);
              break;
            case 'precip_1h:mm':
              weatherPoint.precipitation = value;
              break;
            case 'wind_speed_10m:ms':
              weatherPoint.windSpeed = Math.round(value * 3.6);
              break;
            case 'relative_humidity_2m:p':
              weatherPoint.humidity = Math.round(value);
              break;
          }
        });

        historicalData.push(weatherPoint);
      });
    }

    return historicalData;
  }

  // Convert weather symbol to description
  getWeatherDescription(symbol) {
    const descriptions = {
      1: 'Clear sky',
      2: 'Light clouds',
      3: 'Partly cloudy',
      4: 'Cloudy',
      5: 'Rain',
      6: 'Rain and snow',
      7: 'Snow',
      8: 'Rain shower',
      9: 'Snow shower',
      10: 'Sleet',
      11: 'Fog',
      12: 'Thunderstorm',
      13: 'Thunderstorm with hail'
    };
    
    return descriptions[symbol] || 'Unknown';
  }

  // Get weather icon based on description
  getWeatherIcon(description) {
    const iconMap = {
      'Clear sky': 'wb_sunny',
      'Light clouds': 'partly_cloudy_day',
      'Partly cloudy': 'partly_cloudy_day',
      'Cloudy': 'cloud',
      'Rain': 'rainy',
      'Rain and snow': 'weather_mix',
      'Snow': 'ac_unit',
      'Rain shower': 'rainy',
      'Snow shower': 'weather_snowy',
      'Sleet': 'weather_mix',
      'Fog': 'foggy',
      'Thunderstorm': 'thunderstorm',
      'Thunderstorm with hail': 'thunderstorm'
    };
    
    return iconMap[description] || 'cloud';
  }
}

export default new WeatherService();