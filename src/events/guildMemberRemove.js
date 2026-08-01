const { EmbedBuilder } = require('discord.js');
const { getGuildSettings } = require('../database/db');
const config = require('../config/config');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    const { guild } = member;
    const settings = getGuildSettings(guild.id);
    if (!settings || !settings.log_channel) return;

    try {
      const logChannel = guild.channels.cache.get(settings.log_channel);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor(config.colors.danger)
          .setTitle('📤 مغادرة عضو (Member Left)')
          .setDescription(`• **العضو:** ${member.user.tag}\n• **المعرف ID:** \`${member.id}\`\n• **عدد الأعضاء الحالي:** \`${guild.memberCount}\` عضو`)
          .setThumbnail(member.user.displayAvatarURL())
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] });
      }
    } catch (error) {
      console.error('❌ [Log Error] Failed to log member leave:', error);
    }
  }
};
