import { convertTimeToTwelveHourFormat, isTimeBetween } from './helpers.js';

async function slotParser(slots, reservationNumber, earliest, latest) {
  const numberOfSlots = slots.length;
  let slotId = null;

  for (const slot of slots) {
    let time = convertTimeToTwelveHourFormat(slot.date.start);
    const reservationType = slot.config.type;
    let isPrime = await slotChooser(slot, time, reservationType, reservationNumber, earliest, latest);
    if (isPrime) {
      slotId = isPrime;
      break;
    }
  }
  return slotId;
}

async function slotChooser(slot, time, type, reservationNumber, earliest, latest) {
  if (!earliest || !latest) {
    console.error(`Invalid earliest/latest times. EARLIEST: ${earliest}, LATEST: ${latest}`);
    return null;
  }

  if (isTimeBetween(earliest, latest, slot.date.start)) {
    return slot.config.token;
  }
  return null;
}

export { slotParser };
