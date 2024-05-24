import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { manageReservations } from './utils/bookingLogic.js';

dotenv.config();

// Load the JSON configuration file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, 'reservations.json');  // Ensure your configuration file is named 'reservations.json'

const loadConfig = () => {
  try {
    const data = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(data);
    return config;
  } catch (error) {
    console.error('Error reading reservations configuration:', error);
    return null;
  }
};

// Example usage with multiple reservations
const config = loadConfig();
if (config) {
  const { reservations, authToken, paymentId } = config;

  // Ensure the environment variables are set for authToken and paymentId
  process.env.AUTH_TOKEN = authToken;
  process.env.PAYMENT_ID = paymentId;

  // Run the logic immediately on start
  manageReservations(reservations, authToken, paymentId);

  // Set the interval to check and manage reservations every 5 seconds
  setInterval(() => manageReservations(reservations, authToken, paymentId), 5 * 1000);
}
