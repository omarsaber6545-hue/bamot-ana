const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  token: process.env.AZKAR_BOT_TOKEN || process.env.DISCORD_TOKEN,
  clientId: process.env.AZKAR_CLIENT_ID || process.env.CLIENT_ID,
  
  defaultCity: process.env.DEFAULT_CITY || 'Cairo',
  defaultCountry: process.env.DEFAULT_COUNTRY || 'Egypt',
  defaultTimezone: process.env.DEFAULT_TIMEZONE || 'Africa/Cairo',
  
  // 24/7 Live Radio Quran Streams
  quranRadioStreams: [
    { name: 'إذاعة القرآن الكريم من القاهرة', url: 'https://stream.radiojar.com/8svhky00y0uvw' },
    { name: 'إذاعة عبدالباسط عبدالصمد', url: 'https://backup.qurango.net/radio/abdulbasit_abdulsamad_mojawwad' },
    { name: 'إذاعة مشاري العفاسي', url: 'https://backup.qurango.net/radio/mishary_alafasi' },
    { name: 'إذاعة محمود خليل الحصري', url: 'https://backup.qurango.net/radio/mahmoud_khalil_alhussary' }
  ],
  
  colors: {
    primary: 0x1E824C,   // Deep Islamic Green
    gold: 0xD4AF37,      // Islamic Gold
    cyan: 0x00A86B,      // Jade Green
    error: 0xE74C3C,     // Red
    info: 0x3498DB       // Blue
  },
  
  footerText: 'اللهم صل وسلم على نبينا محمد ﷺ | 📿 بوت الأذكار والقرآن',
  aladhanApiUrl: 'http://api.aladhan.com/v1/timingsByCity'
};
