const fs = require('fs');
const path = require('path');

const dbFilePath = path.join(__dirname, '../../data/islamic_db.json');

class IslamicDatabase {
  constructor() {
    this.data = { guilds: {} };
    this.init();
  }

  init() {
    try {
      const dir = path.dirname(dbFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (fs.existsSync(dbFilePath)) {
        const raw = fs.readFileSync(dbFilePath, 'utf8');
        this.data = JSON.parse(raw);
      } else {
        this.save();
      }
    } catch (err) {
      console.error('❌ [IslamicDB Error]:', err);
      this.data = { guilds: {} };
    }
  }

  save() {
    try {
      fs.writeFileSync(dbFilePath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('❌ [IslamicDB Save Error]:', err);
    }
  }

  getGuild(guildId) {
    if (!this.data.guilds[guildId]) {
      this.data.guilds[guildId] = {
        guild_id: guildId,
        channel_id: null,
        prayer_channel_id: null,
        azkar_channel_id: null,
        daily_channel_id: null,
        voice_channel_id: null,
        role_id: null,
        city: 'Cairo',
        country: 'Egypt',
        timezone: 'Africa/Cairo',
        is_active: 1
      };
      this.save();
    }
    return this.data.guilds[guildId];
  }

  updateGuild(guildId, updates) {
    const current = this.getGuild(guildId);
    this.data.guilds[guildId] = { ...current, ...updates };
    this.save();
    return this.data.guilds[guildId];
  }

  getAllActiveGuilds() {
    return Object.values(this.data.guilds).filter(g => g.is_active !== 0);
  }
}

module.exports = new IslamicDatabase();
