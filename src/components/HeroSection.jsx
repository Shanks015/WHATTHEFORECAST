import React from 'react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  return (
    <div className="relative min-h-[60vh] md:min-h-[75vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40" 
          style={{
            backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCvPJHxJ9lH5ZsAmng-c7IhQUL_TGZOb7TozuskM3eUtNLdrU2It5whfxhvgzxT7MU3RJieLct8GZYGQXqH2aVn12Ne1LiXm9EQ7vFrQLQ9sIXR0s0Ve7ylS1EDotjf2k2-ROqkN4GRmhPEoKzxXB9hHZBvrkt41bEoNbGCuE8R9y-89oFeEVGpAt2D0QlEUAhtkc7TovbVzLVErmlqiftYlHXhI00HJZbZEm4zJ2n8PM3LtDPkr5Eydj4X1unQ7nUjk41k1egOs58")'
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900"></div>
      </div>
      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-text-light sm:text-5xl md:text-6xl">
          Weather Analytics with whattheforecast
        </h1>
        <p className="mt-6 text-lg leading-8 text-text-muted">
          Harness the power of real-time weather data to create personalized dashboards. 
          Track weather patterns, monitor environmental changes, and gain insights into our dynamic atmosphere.
        </p>
        <div className="mt-10">
          <Link to="/define-area" className="relative h-12 inline-flex items-center justify-center overflow-hidden rounded-lg bg-primary px-6 text-base font-bold text-white shadow-lg transition-all duration-200 ease-in-out hover:scale-105 group">
            <span className="absolute inset-0 w-0 bg-white/20 transition-all duration-300 ease-out group-hover:w-full"></span>
            <span className="relative truncate">Create Your Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;