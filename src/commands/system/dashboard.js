const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getBotStatsData } = require('../../database/db');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dashboard')
    .setDescription('رابط فتح لوحة تحكم وإحصائيات البوت الحية على الويب (Web Dashboard)')
    .setDMPermission(false),

  async execute(interaction) {
    const rawStats = getBotStatsData();
    const ping = Math.round(interaction.client.ws.ping);

    const totalSeconds = process.uptime();
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const uptimeFormatted = `${days > 0 ? days + 'd ' : ''}${hours}h ${minutes}m`;

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setAuthor({
        name: `${interaction.guild.name} • Web Dashboard`,
        iconURL: interaction.guild.iconURL({ dynamic: true }) || undefined
      })
      .setTitle('🌐 لوحة تحكم وإحصائيات البوت المباشرة على الويب')
      .setDescription(
        'يمكنك الآن متابعة وقراءة كافة إحصائيات البوت الحية، سرعة الاستجابة، السجلات، والأعضاء الأكثر نشاطاً عبر متصفح الإنترنت!\n\n' +
        `• ⚡ **سرعة الاستجابة (Ping):** \`${ping} ms\`\n` +
        `• ⏱️ **مدة التشغيل (Uptime):** \`${uptimeFormatted}\`\n` +
        `• 📊 **إجمالي الأوامر المنفذة:** \`${rawStats.total_commands || 0}\` أمر\n\n` +
        '🔗 **رابط اللوحة المباشر:** [http://localhost:3000](http://localhost:3000)'
      )
      .setFooter({ text: `${interaction.guild.name} • Live Web Dashboard` })
      .setTimestamp();

    const linkBtn = new ButtonBuilder()
      .setLabel('فتح لوحة التحكم على الويب 🌐')
      .setURL('http://localhost:3000')
      .setStyle(ButtonStyle.Link);

    const row = new ActionRowBuilder().addComponents(linkBtn);

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
