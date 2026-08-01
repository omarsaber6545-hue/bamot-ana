const { ActivityType } = require('discord.js');
const loadCommands = require('../handlers/commandHandler');
const { initScheduler } = require('../services/schedulerService');
const quranVoiceService = require('../services/quranVoiceService');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`[IslamicBot] 🟢 Logged in successfully as ${client.user.tag}!`);

    client.user.setPresence({
      activities: [{ name: 'مواقيت الصلاة والأذكار 🕌 | /help_islamic', type: ActivityType.Watching }],
      status: 'online'
    });

    await loadCommands(client);
    initScheduler(client);

    // Auto-restore 24/7 Quran Voice in saved voice channels
    setTimeout(() => {
      quranVoiceService.joinAllSavedVoiceChannels(client);
    }, 5000);
  }
};
