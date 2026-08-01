const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getBotStatsData } = require('../../database/db');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('عرض إحصائيات البوت الكاملة والأعضاء الأكثر نشاطاً في السيرفر')
    .setDMPermission(false),

  async execute(interaction) {
    const rawStats = getBotStatsData();
    const ping = Math.round(interaction.client.ws.ping);

    const totalSeconds = process.uptime();
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const uptimeFormatted = `${days > 0 ? days + ' أيام ' : ''}${hours} ساعات ${minutes} دقائق ${seconds} ثوانٍ`;

    // Sort active members
    const activeMembers = Object.values(rawStats.active_members || {})
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topMembersText = activeMembers.length > 0
      ? activeMembers.map((m, i) => `**${i + 1}.** ${m.username} — \`${m.count}\` أمر`).join('\n')
      : 'لا توجد تفاعلات مسجلة بعد.';

    // Command breakdown top 5
    const breakdown = rawStats.commands_breakdown || {};
    const topCommands = Object.keys(breakdown)
      .sort((a, b) => breakdown[b] - breakdown[a])
      .slice(0, 5)
      .map(k => `• \`/${k}\`: **${breakdown[k]}** استخدام`)
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`📊 إحصائيات البوت الكاملة | ${interaction.client.user.username}`)
      .setDescription(
        `• ⚡ **سرعة الاستجابة (Ping):** \`${ping} ms\`\n` +
        `• ⏱️ **مدة التشغيل (Uptime):** \`${uptimeFormatted}\`\n` +
        `• 🌐 **السيرفرات المخدمة:** \`${interaction.client.guilds.cache.size}\` سيرفر\n` +
        `• 👥 **الأعضاء المخدمين:** \`${interaction.client.users.cache.size}\` عضو\n` +
        `• 📊 **إجمالي الأوامر المنفذة:** \`${rawStats.total_commands || 0}\` أمر\n\n` +
        `### 🏆 أكثر الأعضاء نشاطاً واستخداماً:\n${topMembersText}\n\n` +
        `### 🔝 الأكثر طلبًا من الأوامر:\n${topCommands || 'لا توجد بيانات'}`
      )
      .setFooter({ text: `${interaction.guild.name} • System Analytics` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
