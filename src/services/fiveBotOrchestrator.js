const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const { addSystemLog } = require('../database/db');

// Multi-Bot Sub-Clients Registry
const subBotsData = [
  { id: 1, name: '🎵 3M Music Bot #1', envKey: 'MUSIC_BOT_1_TOKEN', client: null, status: 'OFFLINE', voiceChannel: null, voiceChannelId: null, currentSong: null, ping: 14 },
  { id: 2, name: '🎵 3M Music Bot #2', envKey: 'MUSIC_BOT_2_TOKEN', client: null, status: 'OFFLINE', voiceChannel: null, voiceChannelId: null, currentSong: null, ping: 16 },
  { id: 3, name: '🎵 3M Music Bot #3', envKey: 'MUSIC_BOT_3_TOKEN', client: null, status: 'OFFLINE', voiceChannel: null, voiceChannelId: null, currentSong: null, ping: 18 },
  { id: 4, name: '🎵 3M Music Bot #4', envKey: 'MUSIC_BOT_4_TOKEN', client: null, status: 'OFFLINE', voiceChannel: null, voiceChannelId: null, currentSong: null, ping: 15 },
  { id: 5, name: '🎵 3M Music Bot #5', envKey: 'MUSIC_BOT_5_TOKEN', client: null, status: 'OFFLINE', voiceChannel: null, voiceChannelId: null, currentSong: null, ping: 17 }
];

// Initialize sub-bot clients
function initSubBotClients(clients = []) {
  if (Array.isArray(clients) && clients.length > 0) {
    clients.forEach((subClient, index) => {
      if (subBotsData[index] && subClient) {
        subBotsData[index].client = subClient;

        if (subClient.user) {
          subBotsData[index].user = subClient.user;
          subBotsData[index].status = 'ONLINE';
          console.log(`🤖 [Sub-Bot #${subBotsData[index].id}] Linked active client ${subClient.user.tag}`);
        } else {
          subBotsData[index].status = 'OFFLINE';
          subClient.once('ready', () => {
            subBotsData[index].user = subClient.user;
            subBotsData[index].status = 'ONLINE';
            console.log(`🤖 [Sub-Bot #${subBotsData[index].id}] Linked active client ${subClient.user.tag}`);
          });
        }
      }
    });
    return;
  }

  subBotsData.forEach(bot => {
    const token = process.env[bot.envKey];
    if (!token || token === 'YOUR_BOT_TOKEN_HERE') return;

    try {
      const subClient = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildVoiceStates,
          GatewayIntentBits.GuildMessages
        ]
      });

      subClient.once('ready', () => {
        bot.status = 'ONLINE';
        bot.client = subClient;
        bot.user = subClient.user;
        console.log(`🤖 [Sub-Bot #${bot.id}] Logged in as ${subClient.user.tag}`);
      });

      subClient.on('error', err => console.error(`[Sub-Bot #${bot.id} Error]:`, err.message));

      subClient.login(token).catch(err => {
        console.warn(`⚠️ [Sub-Bot #${bot.id} Login Failed]:`, err.message);
      });
    } catch (e) {
      console.error(`Failed to init sub-bot #${bot.id}:`, e);
    }
  });
}
/**
 * Summons a specific music sub-bot (1-5) to the user's voice channel
 */
async function summonBotToChannel(botId, voiceChannel) {
  let bot = subBotsData.find(b => b.id === Number(botId));
  console.log("SUMMON BOT DEBUG:", {
    requestedId: botId,
    foundId: bot?.id,
    hasClient: !!bot?.client,
    clientUserTag: bot?.client?.user?.tag,
    status: bot?.status
  });

  if (!bot) return { success: false, error: 'رقم البوت غير صحيح (اختر من 1 إلى 5)' };

  // If requested bot is already busy in another voice channel, pick the next available online bot!
  let reassigned = false;
  if (bot.voiceChannelId && bot.voiceChannelId !== voiceChannel.id) {
    const freeBot = subBotsData.find(b => b.client && b.client.user && !b.voiceChannelId);
    if (freeBot) {
      bot = freeBot;
      reassigned = true;
    }
  }

  // 1. Check if sub-bot client is online
  if (!bot.client || !bot.client.user) {
    const fallbackBot = subBotsData.find(b => b.client && b.client.user && !b.voiceChannelId);
    if (fallbackBot) {
      bot = fallbackBot;
    } else {
      return {
        success: false,
        error: `❌ **البوت الفرعي رقم #${bot.id} غير متصل حالياً (Token غير صالح أو غير مهيأ في .env).**`
      };
    }
  }

  const subBotUser = bot.client.user;
  const guild = voiceChannel.guild;

  // 2. Check if sub-bot is a member of this Discord Guild
  let guildMember = null;
  try {
    guildMember = await guild.members.fetch(subBotUser.id).catch(() => null);
  } catch (e) { }

  if (!guildMember) {
    const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${subBotUser.id}&permissions=8&scope=bot%20applications.commands`;
    return {
      success: false,
      needInvite: true,
      inviteUrl: inviteUrl,
      error:
        `❌ **البوت الفرعي #${bot.id} (${subBotUser.username}) غير مضاف في هذا السيرفر!**\n\n` +
        `🔗 **يرجى إضافة البوت للسيرفر أولاً عبر الرابط التالي:**\n` +
        `[اضغط هنا لإضافة البوت #${bot.id} بالسيرفر](${inviteUrl})`
    };
  }

  // 3. Connect the SUB-BOT client to the Voice Channel
  try {
    const subGuild = bot.client.guilds.cache.get(guild.id);
    const adapterCreator = subGuild ? subGuild.voiceAdapterCreator : guild.voiceAdapterCreator;

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: guild.id,
      adapterCreator: adapterCreator,
      group: `sub_bot_${bot.id}`,
      selfDeaf: true,
      selfMute: false
    });

    bot.status = 'IN_VOICE';
    bot.voiceChannel = voiceChannel.name;
    bot.voiceChannelId = voiceChannel.id;
    bot.connection = connection;

    addSystemLog('5BOTS', `تم سحب ودخول البوت الفرعي #${bot.id} (@${subBotUser.username}) إلى الروم <#${voiceChannel.id}>`);

    const msg = reassigned
      ? `⚠️ البوت المطلوب كان مشغولاً في روم آخر! تم التوجيه المباشر وسحب البوت المتاح **@${subBotUser.username}** (#${bot.id}) إلى **${voiceChannel.name}** 🔊`
      : `تم سحب ودخول البوت الفرعي **@${subBotUser.username}** (#${bot.id}) بنجاح إلى الروم الصوتي **${voiceChannel.name}** 🔊`;

    return {
      success: true,
      bot,
      message: msg
    };
  } catch (error) {
    console.error(`Error joining voice with sub-bot #${botId}:`, error);
    return {
      success: false,
      error: `❌ تعذر إدخال البوت الفرعي #${bot.id} للروم الصوتي: ${error.message}`
    };
  }
}

/**
 * Dismisses a specific music sub-bot (1-5) from its voice channel
 */
function dismissBotFromChannel(botId, guildId) {
  const bot = subBotsData.find(b => b.id === Number(botId));
  if (!bot) return { success: false, error: 'رقم البوت غير صحيح' };

  if (bot.connection) {
    try {
      bot.connection.destroy();
    } catch (e) { }
  }

  if (guildId) {
    try {
      const conn = getVoiceConnection(guildId, `sub_bot_${bot.id}`);
      if (conn) conn.destroy();
    } catch (e) { }

    if (bot.client) {
      try {
        const subGuild = bot.client.guilds.cache.get(guildId);
        if (subGuild && subGuild.members.me.voice.channel) {
          subGuild.members.me.voice.disconnect();
        }
      } catch (e) { }
    }
  }

  bot.status = bot.client ? 'ONLINE' : 'OFFLINE';
  bot.voiceChannel = null;
  bot.voiceChannelId = null;
  bot.connection = null;
  bot.currentSong = null;

  addSystemLog('5BOTS', `تم فصل وإخراج البوت الفرعي #${bot.id} من الروم الصوتي`);
  return {
    success: true,
    bot,
    message: `تم إخراج وفصل البوت الفرعي **${bot.user ? bot.user.username : bot.name}** من الروم الصوتي 👋`
  };
}

/**
 * Returns status list of all 5 bots
 */
function getFiveBotsStatus() {
  return subBotsData.map(b => ({
    id: b.id,
    name: b.user ? `@${b.user.username}` : b.name,
    botId: b.user ? b.user.id : null,
    status: b.status,
    voiceChannel: b.voiceChannel || 'غير متصل (خامل)',
    currentSong: b.currentSong || 'لا توجد أغنية جارية',
    ping: `${b.ping} ms`
  }));
}

/**
 * Returns all active sub-bots connected to a specific voice channel
 */
function getBotsInChannel(voiceChannelId) {
  if (!voiceChannelId) return [];
  return subBotsData.filter(b => b.client && b.client.user && b.voiceChannelId === voiceChannelId);
}

/**
 * Summons multiple sub-bots (up to count) to the target voice channel for synchronized playback
 */
async function summonMultipleBotsToChannel(voiceChannel, count = 2) {
  const currentBots = getBotsInChannel(voiceChannel.id);
  const neededCount = Math.max(0, count - currentBots.length);

  const results = [...currentBots];

  if (neededCount > 0) {
    const freeBots = subBotsData.filter(
      b => b.client && b.client.user && !b.voiceChannelId
    );

    for (let i = 0; i < Math.min(neededCount, freeBots.length); i++) {
      const res = await summonBotToChannel(freeBots[i].id, voiceChannel);
      if (res.success && res.bot) {
        results.push(res.bot);
      }
    }
  }

  return results;
}

module.exports = {
  fiveBots: subBotsData,
  initSubBotClients,
  summonBotToChannel,
  summonMultipleBotsToChannel,
  getBotsInChannel,
  dismissBotFromChannel,
  getFiveBotsStatus
};
