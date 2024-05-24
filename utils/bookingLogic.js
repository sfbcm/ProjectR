import axios from 'axios';
import FormData from 'form-data';
import { slotParser } from './slotParser.js';
import { convertDateToLongFormat, checkTokenExpiration } from './helpers.js';
import { existingReservationConfig, slotConfig, bookingConfig, finalConfig } from '../config.js';

// Function to check for existing bookings
async function checkForExistingBooking(authToken, venueId) {
  let config = existingReservationConfig(authToken);
  try {
    const response = await axios.request(config);
    return response.data.reservations.some(reservation => reservation.venue.id === venueId);
  } catch (error) {
    handleError('checking for existing booking', error);
    return false;
  }
}

// Function to fetch and parse available slots
async function fetchDataAndParseSlots(authToken, date, partySize, venueId, reservationNumber, earliest, latest) {
  let config = slotConfig(authToken, date, partySize, venueId);
  try {
    const response = await axios.request(config);
    console.log(
      `Checking for reservations at ${response.data.results.venues[0].venue.name} on ${convertDateToLongFormat(date)} for ${partySize} people...`
    );
    let slots = response.data.results.venues[0].slots;
    const slotId = await slotParser(slots, reservationNumber, earliest, latest);
    return slotId;
  } catch (error) {
    handleError('fetching and parsing slots', error);
    return null;
  }
}

// Function to get booking token
async function getBookingConfig(authToken, slotId, date, partySize) {
  let config = bookingConfig(authToken, slotId, date, partySize);
  try {
    const response = await axios.request(config);
    return response.data.book_token.value;
  } catch (error) {
    handleError('getting booking token', error);
    return null;
  }
}

// Function to make the booking
async function makeBooking(authToken, paymentId, bookToken) {
  let config = finalConfig(authToken);
  const formData = new FormData();
  formData.append('struct_payment_method', JSON.stringify({ id: paymentId }));
  formData.append('book_token', bookToken);
  try {
    const response = await axios.post(config.url, formData, config);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 412) {
      console.error('Failed to make booking: Precondition Failed (HTTP 412). The reservation might already be booked.');
      return { preconditionFailed: true };
    } else {
      handleError('making booking', error);
    }
    return null;
  }
}

// Core booking logic function
const runBookingLogic = async (reservation, reservationNumber, authToken, paymentId) => {
  const { venueId, date, earliest, latest, partySize } = reservation;
  try {
    let tokenValid = await checkTokenExpiration(authToken);
    if (tokenValid) {
      let existingBooking = await checkForExistingBooking(authToken, venueId);
      if (existingBooking) {
        console.log(`Already have a reservation at venue ID ${venueId} for tonight!`);
        return; // Exit early if there is an existing reservation
      }

      let slotId = await fetchDataAndParseSlots(authToken, date, partySize, venueId, reservationNumber, earliest, latest);
      if (slotId) {
        let bookToken = await getBookingConfig(authToken, slotId, date, partySize);
        if (bookToken) {
          let booking = await makeBooking(authToken, paymentId, bookToken);
          if (booking && booking.resy_token) {
            console.log(`You've got a reservation at venue ID ${venueId} on ${date}!`);
          } else if (!booking?.preconditionFailed) {
            console.error(`Failed to make a reservation at venue ID ${venueId} on ${date}`);
          }
        } else {
          console.error(`Failed to get booking token for venue ID ${venueId} on ${date}`);
        }
      } else {
        console.error(`No slots available for venue ID ${venueId} on ${date}`);
      }
    }
  } catch (error) {
    handleError(`running booking logic for venue ID ${venueId} on ${date}`, error);
  }
};

// Function to manage concurrent reservations
const manageReservations = async (reservations, authToken, paymentId) => {
  try {
    const bookingPromises = reservations.map((reservation, index) =>
      runBookingLogic(reservation, index + 1, authToken, paymentId)
    );
    await Promise.all(bookingPromises);
  } catch (error) {
    handleError('managing reservations', error);
  }
};

// Function to handle errors gracefully
function handleError(action, error) {
  if (error.response) {
    // Server responded with a status other than 2xx
    console.error(`Error ${action}:`, error.response.status, error.response.statusText);
    if (error.response.data) {
      console.error('Response data:', error.response.data);
    }
  } else if (error.request) {
    // Request was made but no response was received
    console.error(`No response received while ${action}.`, error.request);
  } else {
    // Something happened in setting up the request
    console.error(`Error ${action}:`, error.message);
  }
}

export { manageReservations, runBookingLogic, checkForExistingBooking, fetchDataAndParseSlots, getBookingConfig, makeBooking };
