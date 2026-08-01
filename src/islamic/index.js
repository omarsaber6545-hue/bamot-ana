const { Client, GatewayIntentBits, Partials } = require('discord.js');
const config = require('./config');
const loadEvents = require('./handlers/eventHandler');

const createIslamicClient = () => {
  return new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates
    ],
    partials: [Partials.Channel]
  });
};

const startIslamicBot = async () => {
  const token = config.token;
  if (!token || token === 'YOUR_BOT_TOKEN_HERE' || token.includes('xxxxxxxx')) {
    console.warn('⚠️ [IslamicBot] DISCORD_TOKEN / AZKAR_BOT_TOKEN missing or default placeholder. Islamic bot launch skipped.');
    return null;
  }

  try {
    const client = createIslamicClient();

    process.on('unhandledRejection', (reason) => {
      console.error('⚠️ [IslamicBot Guard]:', reason?.message || reason);
    });

    process.on('uncaughtException', (err) => {
      console.error('⚠️ [IslamicBot Uncaught Exception]:', err?.message || err);
    });

    loadEvents(client);

    await client.login(token);
    console.log('[IslamicBot] 🟢 Islamic Bot client initialized successfully.');
    return client;
  } catch (err) {
    console.error('[IslamicBot] ❌ Failed to log in to Discord:', err.message);
    return null;
  }
};

module.exports = {
  startIslamicBot
};
