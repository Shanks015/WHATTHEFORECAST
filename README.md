# EarthView - NASA Weather Dashboard

A modern React.js application that implements a sleek dark-themed dashboard for exploring NASA Earth observation data and weather information.

## Features

- **Global Coverage**: Access data from anywhere on Earth with high-resolution imagery and real-time updates
- **Data Visualization**: Visualize complex data sets with intuitive charts and graphs
- **Interactive Maps**: Explore interactive maps with layers of data for detailed regional analysis
- **Modern UI**: Built with React and styled with Tailwind CSS for a responsive, professional interface
- **Dark Theme**: Eye-friendly dark interface with blue accent colors and glow effects
- **Multi-Page Navigation**: Seamless routing between homepage and area definition interface
- **Interactive Area Selection**: Choose areas of interest through search, pin dropping, or boundary drawing
- **Dashboard Customization**: Select weather variables and timeframes for personalized dashboards
- **Analytics Dashboard**: Historical data trends with interactive charts and maps
- **Data Export & Download**: Export NASA Earth observation data in multiple formats
- **Complete User Flow**: Full journey from landing page to data download and export

## Technology Stack

- **Frontend**: React 18 with Vite for fast development
- **Routing**: React Router DOM for client-side navigation
- **Styling**: Tailwind CSS with custom dark theme
- **Typography**: Space Grotesk font for modern, clean look
- **Icons**: Material Symbols Outlined + custom SVG icons
- **Build Tool**: Vite for optimized builds and hot module replacement

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5174` (or the port shown in terminal)

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint for code quality

## Project Structure

```
src/
├── components/
│   ├── Header.jsx                  # Navigation header with logo and menu
│   ├── HeroSection.jsx             # Main hero section with CTA
│   ├── FeaturesSection.jsx         # Features grid with icons
│   ├── Footer.jsx                  # Footer with links and copyright
│   ├── HomePage.jsx                # Complete homepage layout
│   ├── DefineAreaPage.jsx          # Area selection interface with map
│   ├── CustomizeDashboardPage.jsx  # Dashboard customization form
│   ├── DashboardPage.jsx           # Final weather dashboard view
│   ├── AnalyticsDashboardPage.jsx  # Historical data and analytics
│   └── DataDownloadPage.jsx        # Data export and download interface
├── App.jsx                         # Main router and route configuration
├── main.jsx                       # Application entry point
├── index.css                      # Global styles and Tailwind base
└── App.css                        # Component-specific styles
```

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

## Future Enhancements

- Integration with NASA APIs for real-time data
- Interactive dashboard creation tools
- User authentication and personal dashboards
- Data export and sharing capabilities
- Mobile-optimized responsive design improvements

Built with ❤️ using React and NASA's inspiration for Earth observation.
