const cron = require('node-cron');
const moment = require('moment-timezone');
const { getPrayerTimes } = require('./aladhanService');
const { morningAzkar, eveningAzkar, randomAzkar } = require('../assets/azkarData');
const quranVerses = require('../assets/quranData');
const hadiths = require('../assets/hadithData');
const db = require('../database');
const { 
  buildPrayerEmbed, 
  buildPrePrayerReminderEmbed,
  buildHadithEmbed,
  buildMorningAzkarEmbed, 
  buildEveningAzkarEmbed, 
  buildRandomDhikrEmbed, 
  buildQuranEmbed,
  buildFridayKahfEmbed, 
  buildFridayDuaEmbed 
} = require('../utils/embeds');

let lastDhikrIndex = -1;
let lastQuranIndex = -1;
let lastHadithIndex = -1;
let rotationType = 0; // 0: Quran, 1: Hadith, 2: Azkar

const sentPrayerAlerts = new Set();
const sentPrePrayerReminders = new Set();

const broadcastToGuilds = async (client, embedSupplier, type = 'general', roleMention = false) => {
  const activeGuilds = db.getAllActiveGuilds();
  if (!activeGuilds || activeGuilds.length === 0) return;

  for (const guildData of activeGuilds) {
    try {
      let targetChannelId = null;
      if (type === 'prayer') {
        targetChannelId = guildData.prayer_channel_id || guildData.channel_id;
      } else if (type === 'azkar') {
        targetChannelId = guildData.azkar_channel_id || guildData.channel_id;
      } else if (type === 'daily') {
        targetChannelId = guildData.daily_channel_id || guildData.channel_id;
      } else {
        targetChannelId = guildData.channel_id || guildData.prayer_channel_id || guildData.azkar_channel_id || guildData.daily_channel_id;
      }

      if (!targetChannelId) continue;

      const channel = await client.channels.fetch(targetChannelId).catch(() => null);
      if (!channel) continue;

      let content = '';
      if (roleMention && guildData.role_id) {
        content = `<@&${guildData.role_id}>`;
      }

      const embed = typeof embedSupplier === 'function' ? embedSupplier(guildData) : embedSupplier;
      await channel.send({ content, embeds: [embed] }).catch(err => {
        console.error(`[Scheduler] ❌ Failed to send ${type} reminder in channel ${targetChannelId}:`, err.message);
      });
    } catch (err) {
      console.error(`[Scheduler] ❌ Error processing guild ${guildData.guild_id}:`, err.message);
    }
  }
};

const initScheduler = (client) => {
  console.log('[Scheduler] 🟢 Initializing Islamic Scheduler Service (Prayers, 30m Pre-Prayer, Quran, Hadith, Azkar)...');

  // 1. Midnight cache reset
  cron.schedule('0 0 * * *', async () => {
    console.log('[Scheduler] 🔄 Refreshing daily prayer times and resetting reminder cache...');
    sentPrayerAlerts.clear();
    sentPrePrayerReminders.clear();
    await getPrayerTimes();
  }, { timezone: 'Africa/Cairo' });

  // 2. Minute-by-minute check for Prayer Alerts & 30-min Pre-Prayer Reminders
  cron.schedule('* * * * *', async () => {
    try {
      const timings = await getPrayerTimes();
      if (!timings) return;

      const now = moment().tz('Africa/Cairo');
      const timeNowStr = now.format('HH:mm');
      const todayStr = now.format('YYYY-MM-DD');

      const prayers = [
        { key: 'Fajr', name: 'الفجر' },
        { key: 'Sunrise', name: 'الشروق' },
        { key: 'Dhuhr', name: 'الظهر' },
        { key: 'Asr', name: 'العصر' },
        { key: 'Maghrib', name: 'المغرب' },
        { key: 'Isha', name: 'العشاء' }
      ];

      for (const prayer of prayers) {
        const rawTime = timings[prayer.key].split(' ')[0]; // e.g. "12:05"
        const prayerMoment = moment.tz(`${todayStr} ${rawTime}`, 'YYYY-MM-DD HH:mm', 'Africa/Cairo');
        
        // Exact Prayer Time Alert
        const alertKey = `${todayStr}-${prayer.key}-exact`;
        if (rawTime === timeNowStr && !sentPrayerAlerts.has(alertKey)) {
          sentPrayerAlerts.add(alertKey);
          console.log(`[Scheduler] 🕌 Triggering exact prayer alert for ${prayer.name} at ${timeNowStr}...`);

          const time12H = prayerMoment.format('hh:mm A').replace('AM', 'ص').replace('PM', 'م');
          const embed = buildPrayerEmbed(prayer.name, time12H);
          await broadcastToGuilds(client, embed, 'prayer', true);
        }

        // 30-Minute Pre-Prayer Reminder
        const pre30Moment = prayerMoment.clone().subtract(30, 'minutes');
        const pre30TimeStr = pre30Moment.format('HH:mm');
        const pre30Key = `${todayStr}-${prayer.key}-pre30`;

        if (pre30TimeStr === timeNowStr && !sentPrePrayerReminders.has(pre30Key)) {
          sentPrePrayerReminders.add(pre30Key);
          console.log(`[Scheduler] ⏳ Triggering 30-minute pre-prayer reminder for ${prayer.name} at ${timeNowStr}...`);

          const prayerTime12H = prayerMoment.format('hh:mm A').replace('AM', 'ص').replace('PM', 'م');
          const embed = buildPrePrayerReminderEmbed(prayer.name, prayerTime12H, 30);
          await broadcastToGuilds(client, embed, 'prayer', true);
        }
      }
    } catch (err) {
      console.error('[Scheduler] ❌ Error in minute prayer check:', err.message);
    }
  }, { timezone: 'Africa/Cairo' });

  // 3. 5-Minute rotating broadcast (Quran, Hadith, Azkar)
  cron.schedule('*/5 * * * *', async () => {
    let embed;

    if (rotationType === 0) {
      // Quran
      let qIndex;
      do {
        qIndex = Math.floor(Math.random() * quranVerses.length);
      } while (qIndex === lastQuranIndex && quranVerses.length > 1);
      lastQuranIndex = qIndex;
      embed = buildQuranEmbed(quranVerses[qIndex]);
    } else if (rotationType === 1) {
      // Hadith
      let hIndex;
      do {
        hIndex = Math.floor(Math.random() * hadiths.length);
      } while (hIndex === lastHadithIndex && hadiths.length > 1);
      lastHadithIndex = hIndex;
      embed = buildHadithEmbed(hadiths[hIndex]);
    } else {
      // Azkar
      let dIndex;
      do {
        dIndex = Math.floor(Math.random() * randomAzkar.length);
      } while (dIndex === lastDhikrIndex && randomAzkar.length > 1);
      lastDhikrIndex = dIndex;
      embed = buildRandomDhikrEmbed(randomAzkar[dIndex]);
    }

    rotationType = (rotationType + 1) % 3;
    await broadcastToGuilds(client, embed, 'azkar', false);
  }, { timezone: 'Africa/Cairo' });

  // 4. Morning Azkar (06:30 AM)
  cron.schedule('30 6 * * *', async () => {
    const embed = buildMorningAzkarEmbed(morningAzkar);
    await broadcastToGuilds(client, embed, 'daily', false);
  }, { timezone: 'Africa/Cairo' });

  // 5. Evening Azkar (04:30 PM)
  cron.schedule('30 16 * * *', async () => {
    const embed = buildEveningAzkarEmbed(eveningAzkar);
    await broadcastToGuilds(client, embed, 'daily', false);
  }, { timezone: 'Africa/Cairo' });

  // 6. Friday Surah Al-Kahf (08:00 AM)
  cron.schedule('0 8 * * 5', async () => {
    const embed = buildFridayKahfEmbed();
    await broadcastToGuilds(client, embed, 'daily', false);
  }, { timezone: 'Africa/Cairo' });

  // 7. Friday Dua Hour (05:00 PM)
  cron.schedule('0 17 * * 5', async () => {
    const embed = buildFridayDuaEmbed();
    await broadcastToGuilds(client, embed, 'daily', false);
  }, { timezone: 'Africa/Cairo' });

  console.log('[Scheduler] 🟢 Multi-channel Islamic scheduler active.');
};

module.exports = {
  initScheduler
};
