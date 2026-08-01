const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../database.json');

// Default initial data structure
const initialData = {
  guild_settings: {},
  warnings: [],
  tickets: [],
  user_playlists: {},
  user_profiles: {},
  command_configs: {},
  stats: {
    total_commands: 0,
    commands_today: 0,
    commands_week: 0,
    commands_month: 0,
    commands_breakdown: {},
    active_members: {},
    logs: [],
    security_events: []
  }
};

// Ensure database file exists
function loadDb() {
  try {
    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2), 'utf8');
      return initialData;
    }
    const content = fs.readFileSync(dbPath, 'utf8');
    const data = JSON.parse(content);
    if (!data.user_playlists) data.user_playlists = {};
    if (!data.user_profiles) data.user_profiles = {};
    if (!data.command_configs) data.command_configs = {};
    if (!data.stats) {
      data.stats = {
        total_commands: 0,
        commands_today: 0,
        commands_week: 0,
        commands_month: 0,
        commands_breakdown: {},
        active_members: {},
        logs: [],
        security_events: []
      };
    }
    return data;
  } catch (error) {
    console.error('⚠️ [Database Error] Failed to read database file, resetting fallback:', error);
    return initialData;
  }
}

function saveDb(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('❌ [Database Error] Failed to save database:', error);
  }
}

console.log('✅ [Database] Pure JS JSON database initialized.');

// --- Helper Functions ---

// Guild Settings Helpers
function getGuildSettings(guildId) {
  const data = loadDb();
  return data.guild_settings[guildId] || null;
}

function updateGuildSettings(guildId, settingsData) {
  const data = loadDb();
  const current = data.guild_settings[guildId] || {
    guild_id: guildId,
    log_channel: null,
    welcome_channel: null,
    welcome_role: null,
    ticket_category: null,
    ticket_support_role: null,
    default_gif: null
  };

  data.guild_settings[guildId] = {
    ...current,
    ...settingsData
  };

  saveDb(data);
  return data.guild_settings[guildId];
}

// Warning Helpers
function addWarning(guildId, userId, moderatorId, reason) {
  const data = loadDb();
  const newWarning = {
    id: Date.now(),
    guild_id: guildId,
    user_id: userId,
    moderator_id: moderatorId,
    reason: reason,
    created_at: new Date().toISOString()
  };

  data.warnings.push(newWarning);
  addSystemLog('WARN', `تم إعطاء تحذير للعضو <${userId}> بواسطة المشرف <${moderatorId}> | السبب: ${reason}`);
  saveDb(data);
  return newWarning;
}

function getUserWarnings(guildId, userId) {
  const data = loadDb();
  return data.warnings.filter(w => w.guild_id === guildId && w.user_id === userId);
}

function clearUserWarnings(guildId, userId) {
  const data = loadDb();
  data.warnings = data.warnings.filter(w => !(w.guild_id === guildId && w.user_id === userId));
  saveDb(data);
}

// Ticket Helpers
function createTicketRecord(guildId, channelId, userId) {
  const data = loadDb();
  const newTicket = {
    id: Date.now(),
    guild_id: guildId,
    channel_id: channelId,
    user_id: userId,
    status: 'OPEN',
    claimed_by: null,
    created_at: new Date().toISOString()
  };

  data.tickets.push(newTicket);
  addSystemLog('TICKET', `تم فتح تذكرة جديدة بواسطة <${userId}>`);
  saveDb(data);
  return newTicket;
}

function getTicketByChannel(channelId) {
  const data = loadDb();
  return data.tickets.find(t => t.channel_id === channelId) || null;
}

function updateTicketStatus(channelId, status) {
  const data = loadDb();
  const ticket = data.tickets.find(t => t.channel_id === channelId);
  if (ticket) {
    ticket.status = status;
    saveDb(data);
  }
}

function claimTicketRecord(channelId, staffId) {
  const data = loadDb();
  const ticket = data.tickets.find(t => t.channel_id === channelId);
  if (ticket) {
    ticket.claimed_by = staffId;
    saveDb(data);
  }
  return ticket;
}

// User Personal Playlists Helpers
function saveUserPlaylist(userId, name, url, title) {
  const data = loadDb();
  if (!data.user_playlists[userId]) {
    data.user_playlists[userId] = [];
  }

  const existingIndex = data.user_playlists[userId].findIndex(p => p.name.toLowerCase() === name.toLowerCase());
  const item = {
    name: name,
    url: url,
    title: title || name,
    created_at: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    data.user_playlists[userId][existingIndex] = item;
  } else {
    data.user_playlists[userId].push(item);
  }

  saveDb(data);
  return item;
}

function getUserPlaylists(userId) {
  const data = loadDb();
  return data.user_playlists[userId] || [];
}

function getUserPlaylist(userId, name) {
  const playlists = getUserPlaylists(userId);
  return playlists.find(p => p.name.toLowerCase() === name.toLowerCase()) || null;
}

function deleteUserPlaylist(userId, name) {
  const data = loadDb();
  if (data.user_playlists[userId]) {
    data.user_playlists[userId] = data.user_playlists[userId].filter(p => p.name.toLowerCase() !== name.toLowerCase());
    saveDb(data);
  }
}

// --- Gamification Helpers (Profiles, XP, Levels, Quests, Achievements, Pets) ---

function getUserProfile(userId, username, avatar) {
  const data = loadDb();
  if (!data.user_profiles[userId]) {
    data.user_profiles[userId] = {
      userId,
      username: username || 'Member',
      avatar: avatar || '',
      level: 1,
      xp: 0,
      coins: 250,
      bio: 'عضو مميز في السيرفر ✨',
      achievements: ['welcome_badge'],
      pet: { name: 'فليكس 🦊', type: '🦊 الثعلب السايبر', level: 1, happiness: 100 },
      quests: [
        { id: 1, title: 'تشغيل 3 أغاني 🎵', rewardXp: 150, rewardCoins: 100, completed: false },
        { id: 2, title: 'إرسال 10 رسائل 💬', rewardXp: 200, rewardCoins: 150, completed: false },
        { id: 3, title: 'فتح أو متابعة تذكرة 🎫', rewardXp: 300, rewardCoins: 250, completed: false }
      ]
    };
    saveDb(data);
  }
  return data.user_profiles[userId];
}

function addXp(userId, xpAmount, username, avatar) {
  const data = loadDb();
  const profile = getUserProfile(userId, username, avatar);

  profile.xp += xpAmount;
  const newLevel = Math.floor(0.1 * Math.sqrt(profile.xp)) + 1;
  let leveledUp = false;

  if (newLevel > profile.level) {
    profile.level = newLevel;
    profile.coins += newLevel * 100;
    leveledUp = true;
    addSystemLog('LEVEL', `انتقل العضو <@${userId}> إلى المستوى الجديد 🎉 [Level ${newLevel}]`);
  }

  saveDb(data);
  return { profile, leveledUp, newLevel };
}

function unlockAchievement(userId, achievementId, title) {
  const data = loadDb();
  const profile = getUserProfile(userId);

  if (!profile.achievements.includes(achievementId)) {
    profile.achievements.push(achievementId);
    profile.xp += 250;
    profile.coins += 200;
    addSystemLog('ACHIEVEMENT', `إنجاز جديد فتح للعضو <@${userId}>: ${title}`);
    saveDb(data);
    return true;
  }
  return false;
}

function claimQuestReward(userId, questId) {
  const data = loadDb();
  const profile = getUserProfile(userId);
  const quest = profile.quests.find(q => q.id === Number(questId));

  if (quest && !quest.completed) {
    quest.completed = true;
    profile.xp += quest.rewardXp;
    profile.coins += quest.rewardCoins;
    saveDb(data);
    return { success: true, quest };
  }
  return { success: false, error: 'المهمة مكتملة بالفعل أو غير موجودة.' };
}

function updatePetStatus(userId, petName, action) {
  const data = loadDb();
  const profile = getUserProfile(userId);

  if (!profile.pet) {
    profile.pet = { name: petName || 'فليكس 🦊', type: '🦊 الثعلب السايبر', level: 1, happiness: 100 };
  }

  if (action === 'feed') {
    profile.pet.happiness = Math.min(100, profile.pet.happiness + 20);
    profile.pet.level += 1;
    profile.xp += 100;
  }

  saveDb(data);
  return profile.pet;
}

// --- Command Management Center Helpers ---
function getCommandConfigs() {
  const data = loadDb();
  return data.command_configs || {};
}

function updateCommandConfig(commandName, configData) {
  const data = loadDb();
  const current = data.command_configs[commandName] || {
    name: commandName,
    enabled: true,
    cooldown: 3,
    category: 'General',
    restrictions: [],
    aliases: []
  };

  data.command_configs[commandName] = {
    ...current,
    ...configData
  };

  addSystemLog('CONFIG', `تم تحديث إعدادات الأمر /${commandName} من لوحة التحكم`);
  saveDb(data);
  return data.command_configs[commandName];
}

function isCommandEnabled(commandName) {
  const configs = getCommandConfigs();
  if (configs[commandName] && configs[commandName].enabled === false) {
    return false;
  }
  return true;
}

// --- Statistics & Logs Helpers ---
function recordCommandExecution(commandName, userId, username, avatar) {
  const data = loadDb();

  data.stats.total_commands = (data.stats.total_commands || 0) + 1;
  data.stats.commands_today = (data.stats.commands_today || 0) + 1;
  data.stats.commands_week = (data.stats.commands_week || 0) + 1;
  data.stats.commands_month = (data.stats.commands_month || 0) + 1;

  if (!data.stats.commands_breakdown[commandName]) {
    data.stats.commands_breakdown[commandName] = 0;
  }
  data.stats.commands_breakdown[commandName]++;

  if (!data.stats.active_members[userId]) {
    data.stats.active_members[userId] = {
      userId,
      username,
      avatar,
      count: 0,
      lastActive: new Date().toISOString()
    };
  }
  data.stats.active_members[userId].count++;
  data.stats.active_members[userId].username = username;
  data.stats.active_members[userId].avatar = avatar;
  data.stats.active_members[userId].lastActive = new Date().toISOString();

  // Give XP to member on command execution
  addXp(userId, 35, username, avatar);

  // Add Log Entry
  addSystemLog('COMMAND', `تشغيل الأمر /${commandName} بواسطة @${username}`);
  saveDb(data);
}

function addSystemLog(type, message) {
  const data = loadDb();
  if (!data.stats.logs) data.stats.logs = [];

  const logEntry = {
    id: Date.now(),
    timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    type: type,
    message: message
  };

  data.stats.logs.unshift(logEntry);
  if (data.stats.logs.length > 150) {
    data.stats.logs = data.stats.logs.slice(0, 150);
  }
  saveDb(data);
}

function getBotStatsData() {
  const data = loadDb();
  return data;
}

module.exports = {
  getGuildSettings,
  updateGuildSettings,
  addWarning,
  getUserWarnings,
  clearUserWarnings,
  createTicketRecord,
  getTicketByChannel,
  updateTicketStatus,
  claimTicketRecord,
  saveUserPlaylist,
  getUserPlaylists,
  getUserPlaylist,
  deleteUserPlaylist,
  getUserProfile,
  addXp,
  unlockAchievement,
  claimQuestReward,
  updatePetStatus,
  getCommandConfigs,
  updateCommandConfig,
  isCommandEnabled,
  recordCommandExecution,
  addSystemLog,
  getBotStatsData
};
