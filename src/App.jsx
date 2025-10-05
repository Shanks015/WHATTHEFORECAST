import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import DefineAreaPage from './components/DefineAreaPageClean';
import CustomizeDashboardPage from './components/CustomizeDashboardPage';
import DashboardPage from './components/DashboardPage';
import AnalyticsDashboardPage from './components/AnalyticsDashboardPage';
import DataDownloadPage from './components/DataDownloadPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/define-area" element={<DefineAreaPage />} />
        <Route path="/customize" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </Router>
  );
}

export default App;
