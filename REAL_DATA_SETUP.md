# NASA Real Data Implementation

## 🚀 Quick Start

### 1. Install Backend Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment (Optional)
```bash
# Copy environment template
cp .env.example .env

# Edit .env to add NASA credentials (optional)
# NASA_USERNAME=your_username
# NASA_PASSWORD=your_password
```

### 3. Start Backend Proxy Server
```bash
# In server directory
npm start
```

### 4. Start Frontend (separate terminal)
```bash
# In project root
npm run dev
```

## 🛰️ Real Data Features

### ✅ What's Working:
- **Backend Proxy Server**: Handles CORS and NASA API authentication
- **Automatic Fallback**: Uses mock data if NASA APIs are unavailable
- **Bulk Data Fetching**: Efficiently gets multiple variables
- **Smart Switching**: Seamlessly switches between real and mock data
- **Error Handling**: Graceful degradation when services are down

### 🔧 NASA API Variables Supported:
- **Precipitation**: GPM_3IMERGDF_06_precipitation
- **Soil Moisture**: GLDAS_NOAH025_3H_2_1_SoilMoi0_10cm_inst
- **Temperature**: GLDAS_NOAH025_3H_2_1_Tair_f_inst
- **Humidity**: GLDAS_NOAH025_3H_2_1_Qair_f_inst
- **Evapotranspiration**: GLDAS_NOAH025_3H_2_1_Evap_tavg
- **Runoff**: GLDAS_NOAH025_3H_2_1_Qs_acc

## 🔐 NASA Credentials (Optional)

1. **Register**: https://urs.earthdata.nasa.gov/
2. **Add to server/.env**:
   ```
   NASA_USERNAME=your_username
   NASA_PASSWORD=your_password
   ```
3. **Note**: Server works without credentials using fallback methods

## 🏗️ Architecture

```
Frontend (React) → Backend Proxy (Node.js) → NASA APIs
                ↓
              Mock Data Fallback
```

### Benefits:
- **No CORS Issues**: Backend handles cross-origin requests
- **Authentication**: Centralized NASA credential management
- **Caching**: Could add response caching (future enhancement)
- **Rate Limiting**: Protects against API quota limits
- **Error Recovery**: Automatic fallback to mock data

## 📡 Endpoints

### Backend API:
- `GET /health` - Health check
- `GET /api/nasa/data-rods` - Single variable data
- `POST /api/nasa/bulk-data` - Multiple variables
- `GET /api/nasa/giovanni-url` - Giovanni visualization URL
- `GET /api/nasa/worldview-url` - Worldview imagery URL

### Frontend Environment:
- `VITE_USE_REAL_NASA_DATA=true` - Enable real data mode
- `VITE_PROXY_URL=http://localhost:3001` - Backend URL

## 🔄 Data Flow

1. **Frontend** requests NASA data
2. **Service** checks if real data mode is enabled
3. **Proxy Health Check** verifies backend availability
4. **NASA API Call** via backend proxy (with auth if configured)
5. **Fallback** to mock data if any step fails
6. **UI Update** shows data source status

## 🎯 Production Deployment

### Backend:
- Deploy Node.js server (Heroku, AWS, etc.)
- Set NASA credentials as environment variables
- Configure CORS for production frontend domain

### Frontend:
- Update `VITE_PROXY_URL` to production backend URL
- Build and deploy static files

## 🛠️ Development Commands

```bash
# Start both servers concurrently
npm run dev:all

# Backend only
cd server && npm start

# Frontend only
npm run dev

# Install all dependencies
npm run install:all
```