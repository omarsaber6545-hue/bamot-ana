const { EmbedBuilder } = require('discord.js');
const { getGuildSettings } = require('../database/db');
const config = require('../config/config');

module.exports = {
  name: 'messageDelete',
  async execute(message) {
    if (!message.guild || message.author?.bot) return;

    const settings = getGuildSettings(message.guild.id);
    if (!settings || !settings.log_channel) return;

    try {
      const logChannel = message.guild.channels.cache.get(settings.log_channel);
      if (logChannel) {
        const content = message.content ? (message.content.length > 1024 ? message.content.substring(0, 1020) + '...' : message.content) : '*[لا يقتصر على نص/رسالة وسائط]*';

        const embed = new EmbedBuilder()
          .setColor(config.colors.warning)
          .setTitle('🗑️ حذف رسالة (Message Deleted)')
          .setDescription(
            `• **صاحب الرسالة:** ${message.author.tag} (${message.author})\n` +
            `• **القناة:** ${message.channel}\n\n` +
            `**محتوى الرسالة المحذوفة:**\n${content}`
          )
          .setTimestamp();

        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('❌ [Log Error] Failed to log deleted message:', error);
    }
  }
};
