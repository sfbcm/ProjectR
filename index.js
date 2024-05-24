import dotenv from 'dotenv';
import { checkTokenExpiration } from './utils/helpers.js';
import { checkForExistingBooking, fetchDataAndParseSlots, getBookingConfig, makeBooking } from './utils/bookingLogic.js';

dotenv.config();

const runBookingLogic = async (reservation, reservationNumber) => {
  const { venueId, date, earliest, latest, partySize } = reservation;
  try {
    let token = await checkTokenExpiration(process.env.AUTH_TOKEN);
    if (token) {
      let existingBooking = await checkForExistingBooking(process.env.AUTH_TOKEN, venueId);
      if (!existingBooking) {
        let slots = await fetchDataAndParseSlots(process.env.AUTH_TOKEN, date, partySize, venueId, reservationNumber);

        if (slots) {
          let bookToken = await getBookingConfig(process.env.AUTH_TOKEN, slots, date, partySize);
          if (bookToken) {
            let booking = await makeBooking(process.env.AUTH_TOKEN, process.env.PAYMENT_ID, bookToken);
            if (booking && booking.resy_token) {
              console.log(`You've got a reservation at venue ID ${venueId} on ${date}!`);
            } else {
              console.log(`Failed to make a reservation at venue ID ${venueId} on ${date}`);
            }
          } else {
            console.error(`Failed to get booking token for venue ID ${venueId} on ${date}`);
          }
        } else {
      //    console.error(`No slots available for venue ID ${venueId} on ${date}`);
        }
      }
    }
  } catch (error) {
    console.error(`An error occurred for venue ID ${venueId} on ${date}:`, error);
  }
};

// Function to manage concurrent reservations
const manageReservations = async (reservations) => {
  const bookingPromises = reservations.map((reservation, index) =>
    runBookingLogic(reservation, index + 1) // Pass index as reservation number
  );
  await Promise.all(bookingPromises);
};

// Load reservations from .env
const loadReservations = () => {
  const reservations = [];
  let index = 1;
  while (process.env[`VENUE_ID_${index}`]) {
    reservations.push({
      venueId: process.env[`VENUE_ID_${index}`],
      date: process.env[`DATE_${index}`],
      earliest: process.env[`EARLIEST_${index}`],
      latest: process.env[`LATEST_${index}`],
      partySize: process.env[`PARTY_SIZE_${index}`],
    });
    index++;
  }
  return reservations;
};

// Example usage with multiple reservations
const reservations = loadReservations();

// Run the logic immediately on start
manageReservations(reservations);

// Set the interval to check and manage reservations every 5 seconds
const interval = setInterval(() => manageReservations(reservations), 5 * 1000);
