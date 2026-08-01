const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('عرض معلومات السيرفر الإحصائية بالتفصيل')
    .setDMPermission(false),

  async execute(interaction) {
    const { guild } = interaction;
    const owner = await guild.fetchOwner();

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`معلومات سيرفر: ${guild.name} 📊`)
      .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
      .addFields(
        { name: '👑 مالك السيرفر', value: `${owner.user.tag} (\`${owner.id}\`)`, inline: true },
        { name: '🆔 معرف السيرفر', value: `\`${guild.id}\``, inline: true },
        { name: '👥 عدد الأعضاء', value: `\`${guild.memberCount}\` عضو`, inline: true },
        { name: '💬 القنوات النصية', value: `\`${guild.channels.cache.filter(c => c.type === 0).size}\` قناة`, inline: true },
        { name: '🔊 القنوات الصوتية', value: `\`${guild.channels.cache.filter(c => c.type === 2).size}\` قناة`, inline: true },
        { name: '🏷️ عدد الرتب', value: `\`${guild.roles.cache.size}\` رتبة`, inline: true },
        { name: '📅 تاريخ الإنشاء', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F> (<t:${Math.floor(guild.createdTimestamp / 1000)}:R>)`, inline: false }
      )
      .setFooter({ text: `طُلب بواسطة ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
