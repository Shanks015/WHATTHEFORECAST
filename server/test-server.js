// Simple test script for the NASA proxy server
const testServer = async () => {
  try {
    console.log('Testing NASA proxy server...');
    
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:3001/health');
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check passed:', healthData);
    } else {
      console.log('❌ Health check failed:', healthResponse.status);
      return;
    }
    
    // Test bulk data endpoint
    const bulkResponse = await fetch('http://localhost:3001/api/nasa/bulk-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        variables: ['precipitation', 'temperature'],
        latitude: 37.7749,
        longitude: -122.4194,
        startDate: '2025-09-30',
        endDate: '2025-10-06'
      })
    });
    
    if (bulkResponse.ok) {
      const bulkData = await bulkResponse.json();
      console.log('✅ Bulk data test passed');
      console.log('📊 Data keys:', Object.keys(bulkData.hydrological || {}));
    } else {
      console.log('❌ Bulk data test failed:', bulkResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Server test failed:', error.message);
  }
};

testServer();