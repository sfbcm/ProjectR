import { convertTimeToTwelveHourFormat, isTimeBetween } from './helpers.js';

async function slotParser(slots, reservationNumber) {
  const numberOfSlots = slots.length;
//  console.log(`There are ${numberOfSlots} slots available`);
  let slotId = null;

  for (const slot of slots) {
    let time = convertTimeToTwelveHourFormat(slot.date.start);
    const reservationType = slot.config.type;
    let isPrime = await slotChooser(slot, time, reservationType, reservationNumber);
    if (isPrime) {
      slotId = isPrime;
      break;
    }
  }
  return slotId;
}

async function slotChooser(slot, time, type, reservationNumber) {
  const earliest = process.env[`EARLIEST_${reservationNumber}`];
  const latest = process.env[`LATEST_${reservationNumber}`];

  if (!earliest || !latest) {
    console.error(`Invalid environment variables. EARLIEST: ${earliest}, LATEST: ${latest}`);
    return null;
  }

  if (isTimeBetween(earliest, latest, slot.date.start)) {
    console.log(`Booking a prime slot at ${time} ${type === 'Dining Room' ? 'in' : 'on'} the ${type}!`);
    return slot.config.token;
  }
}

export { slotParser };
