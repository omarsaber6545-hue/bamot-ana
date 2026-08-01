const { EmbedBuilder, ChannelType } = require('discord.js');
const config = require('../config');
const db = require('../database');

module.exports = {
  name: 'guildCreate',
  async execute(guild, client) {
    console.log(`[IslamicBot] ➕ Joined new guild: ${guild.name} (${guild.id})`);
    
    // Register guild in DB
    db.getGuild(guild.id);

    // Send Welcome & Setup Prompt message in system channel or first writable text channel
    const systemChannel = guild.systemChannel || guild.channels.cache.find(c => c.type === ChannelType.GuildText && c.permissionsFor(guild.members.me).has('SendMessages'));

    if (systemChannel) {
      const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle('🕌 مرحباً بكم! شرفنا بالانضمام لسيرفركم المبارك')
        .setDescription(`شكراً لإضافة بوت الأذكار والقرآن الكريم! لتهيئة البوت واختيار روم الفويس لبث القرآن 24/7 بدون توقف، يرجى تشغيل الأمر التالي:`)
        .addFields(
          { name: '⚙️ أمر الإعداد الرئيسي', value: '`/setup` - حدد من خلاله قناة التنبيهات وروم الفويس المباشر 24/7.' },
          { name: '🔊 تشغيل القرآن في روم الفويس فوراً', value: '`/voice_quran join channel:#اسم-الروم`' }
        )
        .setFooter({ text: config.footerText })
        .setTimestamp();

      systemChannel.send({ embeds: [embed] }).catch(() => null);
    }
  }
};
