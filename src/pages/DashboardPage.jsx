import React, { useState, useEffect } from 'react';
import { Container, Grid, Typography } from '@mui/material';
import WeatherCard from './WeatherCard';
import MLForecastCard from './MLForecastCard';
import { getMlForecast } from '../services/mlForecastService';

const DashboardPage = ({ selectedLocation }) => {
    const [mlForecast, setMlForecast] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMlForecast = async () => {
            if (selectedLocation) {
                try {
                    const forecast = await getMlForecast(
                        selectedLocation.latitude,
                        selectedLocation.longitude
                    );
                    setMlForecast(forecast);
                } catch (err) {
                    setError('Failed to fetch ML forecast');
                    console.error(err);
                }
            }
        };

        fetchMlForecast();
    }, [selectedLocation]);

    return (
        <Container>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Typography variant="h4" gutterBottom>
                        Weather Dashboard
                    </Typography>
                </Grid>

                {/* Regular weather forecast */}
                <Grid item xs={12}>
                    <WeatherCard location={selectedLocation} />
                </Grid>

                {/* ML-based forecast */}
                {mlForecast && (
                    <Grid item xs={12}>
                        <MLForecastCard forecast={mlForecast} />
                    </Grid>
                )}

                {error && (
                    <Grid item xs={12}>
                        <Typography color="error">{error}</Typography>
                    </Grid>
                )}
            </Grid>
        </Container>
    );
};

export default DashboardPage;