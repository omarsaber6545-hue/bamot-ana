const { EmbedBuilder } = require('discord.js');
const { moderateMessage } = require('../services/aiService');
const { addSystemLog } = require('../database/db');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    // Ignore bot messages & system messages
    if (!message || message.author?.bot || !message.guild) return;

    // 1. AI Real-Time Moderation
    try {
      const modResult = await moderateMessage(message.content);

      if (modResult.flagged) {
        // Delete offending message
        await message.delete().catch(() => {});

        // Log action in DB
        addSystemLog(
          'AI_MOD',
          `حذف رسالة مخالفة تلقائياً من العضو @${message.author.tag} (${message.author.id}) في القناة <#${message.channel.id}> - السبب: ${modResult.reason}`
        );

        // Notify user with warning embed
        const warnEmbed = new EmbedBuilder()
          .setColor('#ED4245')
          .setTitle('🛡️ نظام حماية المشرف الذكي (AI Moderator)')
          .setDescription(
            `عذراً <@${message.author.id}>، تم حذف رسالتك تلقائياً لعدم توافقها مع قوانين السيرفر!\n\n` +
            `• ⚠️ **سبب الحذف:** ${modResult.reason}\n` +
            `• 📌 **القناة:** <#${message.channel.id}>`
          )
          .setFooter({ text: 'نظام الحماية والأمان الذكي • 3M System' })
          .setTimestamp();

        const warnMsg = await message.channel.send({ embeds: [warnEmbed] }).catch(() => {});

        // Auto clean warning embed after 8 seconds
        if (warnMsg) {
          setTimeout(() => warnMsg.delete().catch(() => {}), 8000);
        }
      }
    } catch (error) {
      console.error('Error in AI Moderator messageCreate event:', error);
    }
  }
};
