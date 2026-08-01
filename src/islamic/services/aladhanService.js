const axios = require('axios');
const config = require('../config');

let cachedTimings = null;
let lastFetchDate = null;

const getPrayerTimes = async (city = config.defaultCity, country = config.defaultCountry) => {
  const today = new Date().toISOString().split('T')[0];
  if (cachedTimings && lastFetchDate === today) {
    return cachedTimings;
  }

  try {
    const response = await axios.get(config.aladhanApiUrl, {
      params: {
        city: city,
        country: country,
        method: 5 // Egyptian General Authority of Survey
      },
      timeout: 10000
    });

    if (response.data && response.data.data && response.data.data.timings) {
      cachedTimings = response.data.data.timings;
      lastFetchDate = today;
      console.log(`[IslamicBot] 🟢 Successfully fetched prayer timings for ${city}, ${country} (${today}).`);
      return cachedTimings;
    }
  } catch (err) {
    console.error(`[IslamicBot] ❌ Failed to fetch prayer timings from AlAdhan API:`, err.message);
  }

  return cachedTimings;
};

module.exports = {
  getPrayerTimes
};
