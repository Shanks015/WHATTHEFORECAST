# EarthView - NASA Weather Dashboard

A modern React.js application that implements a sleek dark-themed dashboard for exploring **real NASA Earth observation data** and weather information with backend proxy integration.

## 🛰️ NASA Data Integration

### Real NASA APIs Supported:
- **NASA GES DISC**: Hydrological time-series data (precipitation, soil moisture, temperature, humidity, evapotranspiration, runoff)
- **Giovanni**: Interactive data analysis and visualization
- **Worldview**: Satellite imagery and data visualization  
- **CPTEC/INPE**: Brazilian space agency weather data
- **Earthdata Search**: Comprehensive NASA dataset discovery

### Backend Proxy Features:
- **CORS Resolution**: No browser cross-origin restrictions
- **Smart Fallback**: Automatic switch between real and mock data
- **Authentication Ready**: NASA Earthdata Login support
- **Health Monitoring**: Real-time server status checking
- **Bulk Data API**: Efficient multi-variable data fetching

## Features

- **🌍 Real NASA Data**: Access authentic Earth science measurements via backend proxy
- **📊 Global Coverage**: Access data from anywhere on Earth with high-resolution imagery and real-time updates
- **📈 Data Visualization**: Visualize complex NASA datasets with intuitive charts and graphs
- **🗺️ Interactive Maps**: Explore interactive maps with layers of data for detailed regional analysis
- **🎨 Modern UI**: Built with React and styled with Tailwind CSS for a responsive, professional interface
- **🌙 Dark Theme**: Eye-friendly dark interface with blue accent colors and glow effects
- **🧭 Multi-Page Navigation**: Seamless routing between homepage and area definition interface
- **📍 Interactive Area Selection**: Choose areas of interest through search, pin dropping, or boundary drawing
- **⚙️ Dashboard Customization**: Select weather variables and timeframes for personalized dashboards
- **📈 Analytics Dashboard**: Historical data trends with interactive charts and maps
- **💾 Data Export & Download**: Export NASA Earth observation data in multiple formats
- **🔄 Complete User Flow**: Full journey from landing page to data download and export

## Technology Stack

- **Frontend**: React 18 with Vite for fast development
- **Backend**: Node.js Express proxy server for NASA API access
- **NASA APIs**: GES DISC, Giovanni, Worldview, CPTEC/INPE integration
- **Routing**: React Router DOM for client-side navigation
- **Styling**: Tailwind CSS with custom dark theme
- **Typography**: Space Grotesk font for modern, clean look
- **Icons**: Material Symbols Outlined + custom SVG icons
- **Build Tool**: Vite for optimized builds and hot module replacement
- **Data Processing**: Real-time NASA Earth science data with intelligent fallback

## 🚀 Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

### Quick Start (Real NASA Data)

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Start both servers:**
   ```bash
   npm run dev:all
   ```
   
   This starts:
   - Backend proxy server on `http://localhost:3001`
   - Frontend React app on `http://localhost:5173`

3. **Access the application:**
   - Frontend: `http://localhost:5173`
   - NASA Resources: `http://localhost:5173/nasa-resources`

### Alternative Installation

1. **Install frontend dependencies:**
   ```bash
   npm install
   ```

2. **Install backend dependencies:**
   ```bash
   cd server
   npm install
   ```

3. **Start backend server:**
   ```bash
   cd server
   npm start
   ```

4. **Start frontend (separate terminal):**
   ```bash
   npm run dev
   ```

### NASA Credentials (Optional)

For enhanced NASA API access:

1. **Register at NASA Earthdata**: https://urs.earthdata.nasa.gov/
2. **Create server/.env file:**
   ```env
   NASA_USERNAME=your_username
   NASA_PASSWORD=your_password
   PORT=3001
   ```
3. **Restart backend server**

**Note**: Server works without credentials using intelligent fallback to mock data.

### Available Scripts

- `npm run dev` - Start frontend development server
- `npm run build` - Build frontend for production
- `npm run preview` - Preview frontend production build
- `npm run lint` - Run ESLint for code quality
- `npm run server` - Start backend proxy server
- `npm run server:dev` - Start backend with auto-reload
- `npm run install:all` - Install all dependencies (frontend + backend)
- `npm run dev:all` - Start both servers concurrently

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint for code quality

## Project Structure

```
├── src/                            # Frontend React application
│   ├── components/
│   │   ├── Header.jsx              # Navigation header with logo and menu
│   │   ├── HeroSection.jsx         # Main hero section with CTA
│   │   ├── FeaturesSection.jsx     # Features grid with icons
│   │   ├── Footer.jsx              # Footer with links and copyright
│   │   ├── HomePage.jsx            # Complete homepage layout
│   │   ├── DefineAreaPage.jsx      # Area selection interface with map
│   │   ├── CustomizeDashboardPage.jsx # Dashboard customization form
│   │   ├── DashboardPage.jsx       # Final weather dashboard view
│   │   ├── AnalyticsDashboardPage.jsx # Historical data and analytics
│   │   ├── DataDownloadPage.jsx    # Data export and download interface
│   │   └── NASAResourcesPage.jsx   # 🛰️ NASA real data dashboard
│   ├── services/
│   │   └── nasaDataService.js      # NASA API integration service
│   ├── App.jsx                     # Main router and route configuration
│   ├── main.jsx                    # Application entry point
│   └── index.css                   # Global styles and Tailwind base
├── server/                         # 🚀 Backend proxy server
│   ├── server.js                   # Full NASA API proxy server
│   ├── minimal-server.js           # Working minimal proxy server
│   ├── package.json                # Backend dependencies
│   ├── .env.example                # Environment template
│   └── test-server.js              # Server testing utilities
├── .env.development                # Frontend environment config
├── REAL_DATA_SETUP.md             # 📋 Detailed setup instructions
└── README.md                       # This file
```

## 🛰️ NASA Data Modes

### Real Data Mode (Recommended)
- **Status**: ✅ Fully implemented and working
- **Requirements**: Backend server running
- **Data Source**: Live NASA APIs via proxy
- **Benefits**: Authentic Earth science measurements
- **Setup**: Follow "Quick Start" instructions above

### Mock Data Mode (Fallback)
- **Status**: ✅ Automatic fallback
- **Requirements**: None
- **Data Source**: Realistic simulated data
- **Benefits**: Works without backend setup
- **Use Case**: Development and testing

## Customization

### Colors
The application uses a custom color palette defined in the Tailwind configuration:
- Primary: `#1173d4` (Blue)
- Background Dark: `#000000` (Black)
- Background Light: `#f6f7f8` (Light gray)

### Fonts
Uses Google Fonts "Space Grotesk" for a modern, tech-focused appearance.

### Components
All components are modular and can be easily customized or extended. The application follows React best practices with functional components and proper component separation.

## Development Server

The application is currently running at: http://localhost:5174/

### Available Routes

- `/` - Homepage with hero section and features
- `/define-area` - Interactive area selection interface
- `/customize` - Dashboard customization with weather variables
- `/dashboard` - Final personalized weather dashboard
- `/analytics` - Historical data trends and analytics
- `/download` - Data export and download interface
- `/nasa-resources` - 🛰️ **Real NASA data dashboard** (NEW!)

## 🛰️ NASA Resources Dashboard

Access the comprehensive NASA data portal at `/nasa-resources`:

### Features:
- **Real-time Data Status**: Green banner for live NASA data, orange for mock data
- **Multiple Variables**: Precipitation, soil moisture, temperature, humidity, evapotranspiration, runoff
- **Time Range Selection**: 7, 14, 30, or 60 days of historical data
- **External Links**: Direct access to Giovanni, Worldview, and Earthdata Search
- **Data Visualization**: Interactive charts with statistical summaries
- **CPTEC Integration**: Brazilian weather data for South America
- **Smart Switching**: Automatic fallback between real and mock data

### Data Sources:
- **NASA GES DISC**: Global Land Data Assimilation System (GLDAS)
- **GPM IMERG**: Global Precipitation Measurement
- **Giovanni**: NASA's web application for data analysis
- **Worldview**: Real-time satellite imagery
- **CPTEC/INPE**: Brazilian space agency weather data

## Complete User Flow

1. **Homepage** (`/`) - Landing page with hero section
   - Click "Create Dashboard" → Navigate to Area Selection

2. **Area Selection** (`/define-area`) - Choose location and method
   - Select search, pin drop, or boundary drawing
   - Click "Save Area" → Navigate to Customization

3. **Customization** (`/customize`) - Select weather variables and timeframe
   - Choose weather variables (Temperature, Precipitation, Air Quality, Wind Speed)
   - Select time of year (Current Season, Spring, Summer, Autumn, Winter)
   - Click "Create Dashboard" → Navigate to Final Dashboard

4. **Dashboard** (`/dashboard`) - View personalized weather data
   - See real-time weather cards for selected variables
   - Interactive weather map for selected area
   - Options to change area, customize dashboard, or view analytics

5. **Analytics** (`/analytics`) - Historical data and trends
   - Interactive tabs: Current Conditions, Historical Trends, Threshold Probabilities
   - Variable selection dropdown for different data types
   - Historical charts with trend analysis
   - Geographical map visualization with data overlay

## Navigation

- Click the **WeatherWise/EarthView** logo to return to homepage from any page
- Use the **"Create Dashboard"** button on homepage to start the flow
- Navigate between pages using the header navigation menu:
  - **Home** → Homepage
  - **Explore** → Analytics Dashboard
  - **Dashboards** → Customization page
- **Cancel** button on area selection page returns to homepage
- Dashboard page has quick actions to modify area, customize, or view analytics
- Analytics page includes search functionality and tab navigation

## 🚀 Production Deployment

### Backend Deployment:
1. Deploy Node.js server to cloud platform (Heroku, AWS, Vercel, etc.)
2. Set environment variables:
   ```env
   NASA_USERNAME=your_nasa_username
   NASA_PASSWORD=your_nasa_password
   PORT=3001
   ```
3. Update CORS origins for production domain

### Frontend Deployment:
1. Update environment variables:
   ```env
   VITE_PROXY_URL=https://your-backend-domain.com
   VITE_USE_REAL_NASA_DATA=true
   ```
2. Build and deploy:
   ```bash
   npm run build
   ```

## 🛠️ Development

### Architecture:
```
Frontend (React) → Backend Proxy (Node.js) → NASA APIs
                ↓
              Mock Data Fallback
```

### Key Benefits:
- **No CORS Issues**: Backend handles cross-origin requests
- **Authentication**: Centralized NASA credential management  
- **Error Recovery**: Automatic fallback to mock data
- **Rate Limiting**: Protects against API quota limits
- **Caching Ready**: Easy to add response caching

### Backend API Endpoints:
- `GET /health` - Server health check
- `POST /api/nasa/bulk-data` - Multiple NASA variables
- `GET /api/nasa/giovanni-url` - Giovanni visualization URL
- `GET /api/nasa/worldview-url` - Worldview imagery URL

## Future Enhancements

- 🔐 **Enhanced Authentication**: Full NASA Earthdata OAuth integration
- 💾 **Data Caching**: Redis/MongoDB for improved performance  
- 📊 **More NASA APIs**: MODIS, AIRS, VIIRS satellite data
- 🌐 **Real-time Updates**: WebSocket connections for live data
- 📱 **Mobile App**: React Native implementation
- 🤖 **AI Analysis**: Machine learning for weather prediction
- 🔗 **API Integration**: Public API for third-party access
- 🏢 **Enterprise Features**: User authentication and personal dashboards

Built with ❤️ using React and **real NASA Earth observation data**.
