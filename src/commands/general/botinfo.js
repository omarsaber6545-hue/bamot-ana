const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config/config');
const os = require('os');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('عرض معلومات واستجابة البوت (Bot Stats)')
    .setDMPermission(false),

  async execute(interaction) {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const uptimeString = `${days} يوم, ${hours} ساعة, ${minutes} دقيقة, ${seconds} ثانية`;
    const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const ping = interaction.client.ws.ping;

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('معلومات وإحصائيات البوت 🤖')
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .addFields(
        { name: '🤖 اسم البوت', value: `${interaction.client.user.tag}`, inline: true },
        { name: '📡 السرعة (Ping)', value: `\`${ping}ms\``, inline: true },
        { name: '🌐 عدد السيرفرات', value: `\`${interaction.client.guilds.cache.size}\` سيرفر`, inline: true },
        { name: '👥 إجمالي المستخدمين', value: `\`${interaction.client.users.cache.size}\` مستخدم`, inline: true },
        { name: '💾 استهلاك الذاكرة', value: `\`${memoryUsage} MB\``, inline: true },
        { name: '⚙️ بيئة التشغيل', value: `Node.js \`${process.version}\``, inline: true },
        { name: '⏱️ مدة التشغيل (Uptime)', value: `\`${uptimeString}\``, inline: false }
      )
      .setFooter({ text: 'نظام إدارة وتأمين السيرفرات' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
