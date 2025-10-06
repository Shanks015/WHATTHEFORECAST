import React from 'react';
import { Card, Typography, Box, CircularProgress, useTheme } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
    padding: theme.spacing(3),
    background: theme.palette.background.paper,
    boxShadow: theme.shadows[3],
    borderRadius: theme.shape.borderRadius * 2,
    '& .MuiTypography-h6': {
        marginBottom: theme.spacing(3),
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1)
    }
}));

const TemperatureBox = styled(Box)(({ theme }) => ({
    textAlign: 'center',
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    transition: 'transform 0.3s ease',
    '&:hover': {
        transform: 'translateY(-5px)'
    }
}));

const MLForecastCard = ({ forecast, isLoading, error }) => {
    const theme = useTheme();
    const theme = useTheme();

    if (isLoading) {
        return (
            <StyledCard>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                    <CircularProgress />
                </Box>
            </StyledCard>
        );
    }

    if (error) {
        return (
            <StyledCard>
                <Typography color="error" sx={{ textAlign: 'center' }}>
                    {error}
                </Typography>
            </StyledCard>
        );
    }
    return (
        return (
        <StyledCard>
            <Typography variant="h6" gutterBottom>
                ML-Based Forecast
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                {forecast.map((day) => (
                    <Box key={day.date} sx={{ textAlign: 'center', p: 1 }}>
                        <Typography variant="body2">
                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </Typography>
                        <Typography variant="h6">
                            {day.temperature.avg}°C
                        </Typography>
                        <Typography variant="caption">
                            {day.temperature.min}°C - {day.temperature.max}°C
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Card>
    );
};

export default MLForecastCard;