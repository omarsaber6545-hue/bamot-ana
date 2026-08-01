const { EmbedBuilder } = require('discord.js');
const { getGuildSettings } = require('../database/db');
const config = require('../config/config');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const { guild } = member;
    const settings = getGuildSettings(guild.id);
    if (!settings) return;

    // 1. Assign Auto-Role if configured
    if (settings.welcome_role) {
      try {
        const role = guild.roles.cache.get(settings.welcome_role);
        if (role) {
          await member.roles.add(role);
          console.log(`✅ [Auto-Role] Assigned role ${role.name} to new member ${member.user.tag}`);
        }
      } catch (error) {
        console.error(`❌ [Auto-Role Error] Failed to assign role to ${member.user.tag}:`, error);
      }
    }

    // 2. Send Welcome Embed if welcome channel is configured
    if (settings.welcome_channel) {
      try {
        const channel = guild.channels.cache.get(settings.welcome_channel);
        if (channel) {
          const welcomeEmbed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setTitle(`👋 أهلاً ومرحباً بك في سيرفر ${guild.name}!`)
            .setDescription(
              `مرحباً بك يا ${member}!\n\n` +
              `ويسعدنا جداً انضمامك لعائلتنا 🌟\n` +
              `أنت العضو رقم **#${guild.memberCount}** في السيرفر.\n\n` +
              `نتمنى لك وقتاً ممتعاً ومفيداً معنا!`
            )
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setFooter({ text: `${guild.name} • انضمام عضو جديد` })
            .setTimestamp();

          await channel.send({ content: `أهلاً بك ${member}! 🎉`, embeds: [welcomeEmbed] });
        }
      } catch (error) {
        console.error(`❌ [Welcome Error] Failed to send welcome embed:`, error);
      }
    }

    // 3. Log to audit log channel if configured
    if (settings.log_channel) {
      try {
        const logChannel = guild.channels.cache.get(settings.log_channel);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('📥 انضمام عضو جديد (Member Joined)')
            .setDescription(`• **العضو:** ${member.user.tag} (${member})\n• **المعرف ID:** \`${member.id}\`\n• **تاريخ إنشاء الحساب:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`)
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp();

          await logChannel.send({ embeds: [logEmbed] });
        }
      } catch (error) {
        console.error('❌ [Log Error] Failed to log member join:', error);
      }
    }
  }
};
