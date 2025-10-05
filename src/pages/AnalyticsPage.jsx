import React, { useState, useEffect } from 'react';
import { Container, Grid, Typography, Paper, Box } from '@mui/material';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchMlForecast } from '../services/mlForecastService';

const AnalyticsPage = ({ selectedLocation }) => {
    const [mlForecast, setMlForecast] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadMlForecast = async () => {
            if (selectedLocation) {
                setIsLoading(true);
                try {
                    const forecast = await fetchMlForecast(
                        selectedLocation.latitude,
                        selectedLocation.longitude
                    );
                    setMlForecast(forecast);
                } catch (err) {
                    setError('Failed to load ML forecast data');
                    console.error(err);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        loadMlForecast();
    }, [selectedLocation]);

    const prepareChartData = () => {
        if (!mlForecast) return [];
        return mlForecast.map(day => ({
            date: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
            avg: day.temperature.avg,
            min: day.temperature.min,
            max: day.temperature.max,
            range: day.temperature.max - day.temperature.min
        }));
    };

    const chartData = prepareChartData();

    return (
        <Container maxWidth="lg">
            <Typography variant="h4" gutterBottom>
                Weather Analytics
            </Typography>

            <Grid container spacing={3}>
                {/* Temperature Trends */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            5-Day Temperature Forecast Trends
                        </Typography>
                        <Box sx={{ height: 400 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis unit="°C" />
                                    <Tooltip />
                                    <Legend />
                                    <Line 
                                        type="monotone" 
                                        dataKey="avg" 
                                        stroke="#8884d8" 
                                        name="Average Temperature"
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="max" 
                                        stroke="#ff7300" 
                                        name="Maximum Temperature"
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="min" 
                                        stroke="#82ca9d" 
                                        name="Minimum Temperature"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>

                {/* Temperature Range Analysis */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Daily Temperature Range Analysis
                        </Typography>
                        <Box sx={{ height: 400 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis unit="°C" />
                                    <Tooltip />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="range"
                                        fill="#8884d8"
                                        stroke="#8884d8"
                                        name="Temperature Range"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default AnalyticsPage;