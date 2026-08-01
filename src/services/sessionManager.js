const { fiveBots, dismissBotFromChannel } = require('./fiveBotOrchestrator');
const { addSystemLog } = require('../database/db');

// O(1) Centralized Music Session Table (Key: `${guildId}_${voiceChannelId}`)
const sessions = new Map();

/**
 * Checks if an active music session exists for a specific voice channel ID
 */
function hasSession(guildId, voiceChannelId) {
  if (!voiceChannelId) return false;
  return sessions.has(`${guildId}_${voiceChannelId}`);
}

/**
 * Gets an existing session by Voice Channel ID (strictly primary lookup)
 */
function getSession(guildId, voiceChannelId) {
  if (!voiceChannelId) return null;
  const key = `${guildId}_${voiceChannelId}`;
  return sessions.get(key) || null;
}

/**
 * Resolves or creates a Centralized Multi-Bot Session for a voice channel
 */
function getOrCreateSession(guildId, voiceChannel, textChannel) {
  if (!voiceChannel || !voiceChannel.id) {
    return { session: null, isNew: false, error: 'القناة الصوتية غير صالحة.' };
  }

  const sessionKey = `${guildId}_${voiceChannel.id}`;

  // 1. Return existing session bound to this voice channel
  if (sessions.has(sessionKey)) {
    const existing = sessions.get(sessionKey);
    // Clear any pending inactivity timeout if user interacts again
    if (existing.inactivityTimer) {
      clearTimeout(existing.inactivityTimer);
      existing.inactivityTimer = null;
    }
    return { session: existing, isNew: false };
  }

  console.table(
    fiveBots.map(b => ({
      id: b.id,
      status: b.status,
      voice: b.voiceChannelId
    }))
  );

  // 2. Find if a Worker Bot is already inside this voice channel
  let assignedBot = fiveBots.find(b => b.client && b.client.user && b.voiceChannelId === voiceChannel.id);

  // 3. Find the first available free Worker Bot (not connected to any channel)
  if (!assignedBot) {
    assignedBot = fiveBots.find(b => b.client && b.client.user && !b.voiceChannelId);
  }

  // 4. Return error if ALL Worker Bots are busy in other channels
  if (!assignedBot || (assignedBot.voiceChannelId && assignedBot.voiceChannelId !== voiceChannel.id)) {
    return {
      session: null,
      isNew: false,
      error: '❌ جميع بوتات الموسيقى الفرعية مشغولة حالياً في رومات صوتية أخرى.'
    };
  }

  // Bind Worker Bot to Voice Channel
  assignedBot.status = 'IN_VOICE';
  assignedBot.voiceChannel = voiceChannel.name;
  assignedBot.voiceChannelId = voiceChannel.id;

  const sessionData = {
    key: sessionKey,
    guildId,
    voiceChannelId: voiceChannel.id,
    voiceChannel,
    textChannel,
    musicBotId: assignedBot.id,
    musicBotName: assignedBot.user ? `@${assignedBot.user.username}` : assignedBot.name,
    bot: assignedBot,
    playerId: `player_${guildId}_${voiceChannel.id}`,
    queueId: `queue_${guildId}_${voiceChannel.id}`,
    currentSong: null,
    songs: [],
    history: [],
    volume: 100,
    loopMode: 'off', // 'off' | 'track' | 'queue'
    autoplay: false,
    filter: 'none',
    equalizer: 'flat',
    isPlaying: false,
    inactivityTimer: null,
    startedAt: new Date().toISOString()
  };

  sessions.set(sessionKey, sessionData);
  addSystemLog('ROUTING', `[Centralized Router] تم ربط البوت الفرعي #${assignedBot.id} بالجلسة الصوتية <#${voiceChannel.id}>`);

  return { session: sessionData, isNew: true };
}

/**
 * Schedule inactivity auto-cleanup when queue becomes empty
 */
function scheduleInactivityTimeout(guildId, voiceChannelId, timeoutMs = 30000) {
  const session = getSession(guildId, voiceChannelId);
  if (!session) return;

  if (session.inactivityTimer) {
    clearTimeout(session.inactivityTimer);
  }

  session.inactivityTimer = setTimeout(() => {
    destroySession(guildId, voiceChannelId);
  }, timeoutMs);
}

/**
 * Deletes and frees a music session
 */
function destroySession(guildId, voiceChannelId) {
  const sessionKey = `${guildId}_${voiceChannelId}`;
  const session = sessions.get(sessionKey);

  if (session) {
    if (session.inactivityTimer) {
      clearTimeout(session.inactivityTimer);
    }
    if (session.bot) {
      dismissBotFromChannel(session.bot.id, guildId);
    }
    sessions.delete(sessionKey);
    addSystemLog('ROUTING', `[Centralized Router] تم إغلاق وتحرير الجلسة والبوت الفرعي في الروم <#${voiceChannelId}>`);
  }
}

/**
 * Returns all active session table data for Dashboard & Telemetry
 */
function getAllSessions() {
  return Array.from(sessions.values()).map(s => ({
    key: s.key,
    guildId: s.guildId,
    voiceChannelId: s.voiceChannelId,
    voiceChannelName: s.voiceChannel ? s.voiceChannel.name : 'Unknown',
    musicBotId: s.musicBotId,
    musicBotName: s.musicBotName,
    currentSong: s.currentSong ? s.currentSong.title : 'لا توجد أغنية جارية',
    queueLength: s.songs.length,
    volume: s.volume,
    loopMode: s.loopMode,
    autoplay: s.autoplay,
    startedAt: s.startedAt
  }));
}

module.exports = {
  hasSession,
  getSession,
  getOrCreateSession,
  scheduleInactivityTimeout,
  destroySession,
  getAllSessions
};
