// Environment configuration
const config = {
  development: {
    websocketUrl: 'ws://localhost:3001'
  },
  production: {
    // Use environment variable for production
    websocketUrl: process.env.REACT_APP_WEBSOCKET_URL || 'wss://tic-tac-toe-backend.onrender.com'
  }
};

const environment = process.env.NODE_ENV || 'development';
export const websocketUrl = config[environment].websocketUrl; 