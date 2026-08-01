require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const { startDashboardServer } = require('./dashboard/server');
const { initMultiBotManager } = require('./services/multiBotManager');
const { initSubBotClients } = require('./services/fiveBotOrchestrator');

const createClient = () =>
  new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildModeration,
      GatewayIntentBits.GuildVoiceStates
    ],
    partials: [
      Partials.Message,
      Partials.Channel,
      Partials.GuildMember
    ]
  });

const client = createClient();

const musicBot1 = createClient();
const musicBot2 = createClient();
const musicBot3 = createClient();
const musicBot4 = createClient();
const musicBot5 = createClient();

musicBot1.once("ready", () => {
  console.log("BOT1:", musicBot1.user.id, musicBot1.user.tag);
});

musicBot2.once("ready", () => {
  console.log("BOT2:", musicBot2.user.id, musicBot2.user.tag);
});

musicBot3.once("ready", () => {
  console.log("BOT3:", musicBot3.user.id, musicBot3.user.tag);
});

musicBot4.once("ready", () => {
  console.log("BOT4:", musicBot4.user.id, musicBot4.user.tag);
});

musicBot5.once("ready", () => {
  console.log("BOT5:", musicBot5.user.id, musicBot5.user.tag);
});
// Cache for Embed Message Builder draft states
client.embedCache = new Map();

// Global Error Guards for 100% Stability & Zero-Crash Operation
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ [Unhandled Rejection Guard]:', reason?.message || reason);
});

process.on('uncaughtException', (err, origin) => {
  console.error('⚠️ [Uncaught Exception Guard]:', err?.message || err);
});

client.on('error', err => {
  console.error('⚠️ [Discord Client Error]:', err.message);
});

// Load Commands & Events
loadCommands(client);
loadEvents(client);

// Start Services & Web Dashboard once logged in
client.once('ready', () => {

  initSubBotClients([
    musicBot1,
    musicBot2,
    musicBot3,
    musicBot4,
    musicBot5
  ]);

  initMultiBotManager(client, [
    musicBot1,
    musicBot2,
    musicBot3,
    musicBot4,
    musicBot5
  ]);

  startDashboardServer(client, 3000);

});


// Login to Discord
const token = process.env.DISCORD_TOKEN;
if (!token || token === 'YOUR_BOT_TOKEN_HERE') {
  console.error('❌ [Error] DISCORD_TOKEN is missing or set to default placeholder in .env file!');
  console.log('💡 [Tip] Please open the .env file and paste your Discord Bot Token.');
  process.exit(1);
}

// Register sub-bot clients immediately
initSubBotClients([
  musicBot1,
  musicBot2,
  musicBot3,
  musicBot4,
  musicBot5
]);

const botsToLogin = [
  { name: 'Main Bot', client: client, token: process.env.DISCORD_TOKEN },
  { name: 'Music Bot #1', client: musicBot1, token: process.env.MUSIC_BOT_1_TOKEN },
  { name: 'Music Bot #2', client: musicBot2, token: process.env.MUSIC_BOT_2_TOKEN },
  { name: 'Music Bot #3', client: musicBot3, token: process.env.MUSIC_BOT_3_TOKEN },
  { name: 'Music Bot #4', client: musicBot4, token: process.env.MUSIC_BOT_4_TOKEN },
  { name: 'Music Bot #5', client: musicBot5, token: process.env.MUSIC_BOT_5_TOKEN }
];

const isValidToken = (t) => typeof t === 'string' && t.length > 20 && !t.includes('xxxxxxxx') && t !== 'YOUR_BOT_TOKEN_HERE';

botsToLogin.forEach(b => {
  if (!isValidToken(b.token)) {
    console.warn(`⚠️ [${b.name}] Token is missing or invalid placeholder in .env file!`);
    return;
  }
  b.client.login(b.token).catch(err => {
    console.error(`❌ [${b.name}] Login Failed: ${err.message}`);
  });
});

// Launch Islamic & Azkar Bot System (Native src/islamic)
const { startIslamicBot } = require('./islamic');
startIslamicBot();




