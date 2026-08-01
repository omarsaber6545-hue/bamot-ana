const { EmbedBuilder } = require('discord.js');
const { getGuildSettings } = require('../database/db');
const config = require('../config/config');

module.exports = {
  name: 'messageUpdate',
  async execute(oldMessage, newMessage) {
    if (!oldMessage.guild || oldMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return; // Ignore embed updates or non-text edits

    const settings = getGuildSettings(oldMessage.guild.id);
    if (!settings || !settings.log_channel) return;

    try {
      const logChannel = oldMessage.guild.channels.cache.get(settings.log_channel);
      if (logChannel) {
        const oldContent = oldMessage.content ? (oldMessage.content.length > 500 ? oldMessage.content.substring(0, 496) + '...' : oldMessage.content) : '*[محتوى فارغ]*';
        const newContent = newMessage.content ? (newMessage.content.length > 500 ? newMessage.content.substring(0, 496) + '...' : newMessage.content) : '*[محتوى فارغ]*';

        const embed = new EmbedBuilder()
          .setColor(config.colors.info)
          .setTitle('✏️ تعديل رسالة (Message Edited)')
          .setDescription(
            `• **صاحب الرسالة:** ${oldMessage.author.tag} (${oldMessage.author})\n` +
            `• **القناة:** ${oldMessage.channel}\n` +
            `• **رابط الرسالة:** [الانتقال للرسالة](${newMessage.url})\n\n` +
            `**قبل التعديل:**\n${oldContent}\n\n` +
            `**بعد التعديل:**\n${newContent}`
          )
          .setTimestamp();

        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('❌ [Log Error] Failed to log edited message:', error);
    }
  }
};
