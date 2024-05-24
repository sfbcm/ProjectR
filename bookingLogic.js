import axios from 'axios';
import FormData from 'form-data';
import { slotParser } from './slotParser.js';
import { convertDateToLongFormat } from './helpers.js';
import { existingReservationConfig, slotConfig, bookingConfig, finalConfig } from '../config.js';

// First, we'll see if we already have a reservation
async function checkForExistingBooking(authToken, venueId) {
  let config = existingReservationConfig(authToken);
  try {
    const response = await axios.request(config);
    if (response.data.reservations[0]?.venue?.id == venueId) {
      console.log(`You already have a reservation at venue ID ${venueId} for tonight!`);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);
  }
}

// Then, we'll check to see if there are any reservations available
async function fetchDataAndParseSlots(authToken, date, partySize, venueId, reservationNumber) {
  let config = slotConfig(authToken, date, partySize, venueId);
  try {
    const response = await axios.request(config);
    console.log(
      `Checking for reservations at ${response.data.results.venues[0].venue.name} on ${convertDateToLongFormat(date)} for ${partySize} people...`
    );
    let slots = response.data.results.venues[0].slots;
    const slotId = await slotParser(slots, reservationNumber);
    return slotId;
  } catch (error) {
    console.log(error);
  }
}

// If there are reservations available, we'll grab the booking token
async function getBookingConfig(authToken, slotId, date, partySize) {
  let config = bookingConfig(authToken, slotId, date, partySize);
  try {
    console.log(`Booking config: ${JSON.stringify(config)}`); // Log the request config
    const response = await axios.request(config);
    console.log(`Booking token response: ${JSON.stringify(response.data)}`); // Log the response
    return response.data.book_token.value;
  } catch (error) {
    console.error(`Failed to get booking token:`, error.response ? error.response.data : error.message); // Log the error response
    console.error(`Error details:`, error.config ? error.config : 'No config available'); // Log the error config
  }
}

// Finally, we'll make the reservation
async function makeBooking(authToken, paymentId, bookToken) {
  let config = finalConfig(authToken);
  const formData = new FormData();
  
  // Log paymentId and bookToken to ensure they are not undefined
  console.log(`Payment ID: ${paymentId}, Book Token: ${bookToken}`);

  if (!paymentId || !bookToken) {
    console.error(`Missing required parameters. Payment ID: ${paymentId}, Book Token: ${bookToken}`);
    return null;
  }

  formData.append('struct_payment_method', JSON.stringify({ id: paymentId }));
  formData.append('book_token', bookToken);
  try {
    const response = await axios.post(config.url, formData, config);
    return response.data;
  } catch (error) {
    console.error(`Failed to make booking:`, error);
  }
}

export { checkForExistingBooking, fetchDataAndParseSlots, getBookingConfig, makeBooking };
