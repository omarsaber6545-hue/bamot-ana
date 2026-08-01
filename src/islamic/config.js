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
    { name: 'إذاعة الشيخ مشاري العفاسي', url: 'https://backup.qurango.net/radio/mishary_alafasi' },
    { name: 'إذاعة القرآن الكريم من القاهرة', url: 'https://stream.zeno.fm/f3wvbb1v818uv' },
    { name: 'إذاعة الشيخ عبدالباسط عبدالصمد (المجود)', url: 'https://backup.qurango.net/radio/abdulbasit_abdulsamad_mojawwad' },
    { name: 'إذاعة الشيخ محمود خليل الحصري', url: 'https://backup.qurango.net/radio/mahmoud_khalil_alhussary' },
    { name: 'إذاعة الشيخ محمد صديق المنشاوي (المجود)', url: 'https://backup.qurango.net/radio/mohammed_siddiq_alminshawi_mojawwad' },
    { name: 'إذاعة الشيخ ماهر المعيقلي', url: 'https://backup.qurango.net/radio/maher_al_muaiqly' },
    { name: 'إذاعة الشيخ سعود الشريم', url: 'https://backup.qurango.net/radio/saud_alshuraim' },
    { name: 'إذاعة الشيخ ياسر الدوسري', url: 'https://backup.qurango.net/radio/yasser_aldosari' },
    { name: 'إذاعة الشيخ سعد الغامدي', url: 'https://backup.qurango.net/radio/saad_alghamdi' },
    { name: 'إذاعة الشيخ أبو بكر الشاطري', url: 'https://backup.qurango.net/radio/shatri' }
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
