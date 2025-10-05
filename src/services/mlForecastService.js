import axios from 'axios';

const ML_FORECAST_API_URL = 'http://localhost:5001/api/ml-forecast';

const formatForecastData = (data) => {
    return data.map(day => ({
        ...day,
        date: new Date(day.date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        })
    }));
};

/**
 * Fetch ML-based weather forecast for a specific location
 * @param {number} latitude - Location latitude
 * @param {number} longitude - Location longitude
 * @returns {Promise<Array>} - Array of daily forecasts
 */
export const fetchMlForecast = async (latitude, longitude) => {
    try {
        const response = await axios.post(ML_FORECAST_API_URL, {
            latitude,
            longitude
        });
        return formatForecastData(response.data.forecast);
    } catch (error) {
        console.error('Error fetching ML forecast:', error);
        throw error;
    }
};