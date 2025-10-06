import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-background-dark/90 backdrop-blur-sm border-b border-border-dark">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-4">
              <img src="/logo.svg" alt="whattheforecast" className="h-8 w-8" />
              <h2 className="text-xl font-bold text-text-light">whattheforecast</h2>
            </Link>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <Link className="text-sm font-medium text-text-muted hover:text-primary transition-colors" to="/">Home</Link>{/* 
            <Link className="text-sm font-medium text-text-muted hover:text-primary transition-colors" to="/analytics">Explore</Link> */}
            <Link className="text-sm font-medium text-text-muted hover:text-primary transition-colors" to="/customize">Dashboards</Link>
            <Link className="text-sm font-medium text-text-muted hover:text-primary transition-colors" to="/nasa-resources">NASA Data</Link>{/* 
            <Link className="text-sm font-medium text-text-muted hover:text-primary transition-colors" to="/download">Download</Link> */}{/* 
            <a className="text-sm font-medium text-text-muted hover:text-primary transition-colors" href="#">About</a> */}
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/define-area" className="hidden sm:inline-flex relative h-10 items-center justify-center overflow-hidden rounded-lg bg-primary px-5 text-sm font-bold text-white transition-transform duration-200 ease-in-out hover:scale-105">
              <span className="absolute -inset-full animate-pulse-radial-gradient from-white/20 via-white/5 to-white/0 rounded-full"></span>
              <span className="truncate">Create Dashboard</span>
            </Link>
            <div 
              className="h-10 w-10 aspect-square rounded-full bg-cover bg-center border-2 border-border-dark" 
              style={{
                backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB5PAUlt1aFuObzRuvefZCocDf_rkguumsNUrAuCgeSXxu24nEIlhe3wxKElmX4868ZzbTCLX5XeLcuIzAHkr2IYQxi9s__3Jm5Qz-lpUblYgyRRzXdUTLoPFW-O7HLsZLuTICRAY5o6l8P8hHBBmLYW4MifCqXpsJCusbRR19FKGbFpNwbDcuiJvqw1vUkRyQN-WUz-7icLoqMAQXoNNeif6fAcwUMDhe9OEvnTiie89hRPkdwmj3Nq4rYykKFvuqgZmrna96JoFc")'
              }}
            ></div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;