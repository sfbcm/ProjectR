function existingReservationConfig(authToken) {
  return {
    method: 'get',
    maxBodyLength: Infinity,
    url: 'https://api.resy.com/3/user/reservations?limit=10&offset=1&type=upcoming',
    headers: {
      authority: 'api.resy.com',
      accept: 'application/json, text/plain, */*',
      'accept-language': 'en-US,en;q=0.9,la;q=0.8',
      authorization: 'ResyAPI api_key="VbWk7s3L4KiK5fzlO7JD3Q5EYolJI7n5"',
      'cache-control': 'no-cache',
      origin: 'https://resy.com',
      referer: 'https://resy.com/',
      'sec-ch-ua': '"Chromium";v="118", "Google Chrome";v="118", "Not=A?Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
      'x-origin': 'https://resy.com',
      'x-resy-auth-token': `${authToken}`,
      'x-resy-universal-auth': `${authToken}`,
    },
  };
}

function slotConfig(authToken, date, partySize, venueId) {
  return {
    method: 'get',
    maxBodyLength: Infinity,
    url: `https://api.resy.com/4/find?lat=0&long=0&day=${date}&party_size=${partySize}&venue_id=${venueId}`,
    headers: {
      authority: 'api.resy.com',
      accept: 'application/json, text/plain, */*',
      'accept-language': 'en-US,en;q=0.9,la;q=0.8',
      authorization: 'ResyAPI api_key="VbWk7s3L4KiK5fzlO7JD3Q5EYolJI7n5"',
      'cache-control': 'no-cache',
      origin: 'https://resy.com',
      referer: 'https://resy.com/',
      'sec-ch-ua': '"Chromium";v="118", "Google Chrome";v="118", "Not=A?Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
      'x-origin': 'https://resy.com',
      'x-resy-auth-token': `${authToken}`,
      'x-resy-universal-auth': `${authToken}`,
    },
  };
}

function bookingConfig(authToken, token, date, partySize) {
  const slotId = encodeURIComponent(token);
  return {
    method: 'get',
    maxBodyLength: Infinity,
    url: `https://api.resy.com/3/details?&day=${date}&party_size=${partySize}&config_id=${slotId}`,
    headers: {
      authority: 'api.resy.com',
      accept: 'application/json, text/plain, */*',
      'accept-language': 'en-US,en;q=0.9,la;q=0.8',
      authorization: 'ResyAPI api_key="VbWk7s3L4KiK5fzlO7JD3Q5EYolJI7n5"',
      'cache-control': 'no-cache',
      origin: 'https://resy.com',
      referer: 'https://resy.com/',
      'sec-ch-ua': '"Chromium";v="118", "Google Chrome";v="118", "Not=A?Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
      'x-origin': 'https://resy.com',
    },
  };
}

function finalConfig(authToken) {
  return {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://api.resy.com/3/book',
    headers: {
      authority: 'api.resy.com',
      accept: 'application/json, text/plain, */*',
      'accept-language': 'en-US,en;q=0.9,la;q=0.8',
      authorization: 'ResyAPI api_key="VbWk7s3L4KiK5fzlO7JD3Q5EYolJI7n5"',
      'cache-control': 'no-cache',
      'content-type': 'application/x-www-form-urlencoded',
      origin: 'https://widgets.resy.com',
      referer: 'https://widgets.resy.com/',
      'sec-ch-ua': '"Chromium";v="118", "Google Chrome";v="118", "Not=A?Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
      'x-origin': 'https://widgets.resy.com',
      'x-resy-auth-token': `${authToken}`,
      'x-resy-universal-auth': `${authToken}`,
    },
  };
}

export { existingReservationConfig, slotConfig, bookingConfig, finalConfig };
