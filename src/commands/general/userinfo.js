const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('عرض معلومات وتفاصيل حساب عضو')
    .setDMPermission(false)
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('العضو المراد فحص معلوماته')
        .setRequired(false)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('target') || interaction.user;
    const member = interaction.guild.members.cache.get(user.id);

    const embed = new EmbedBuilder()
      .setColor(config.colors.info)
      .setTitle(`معلومات العضو: ${user.tag} 👤`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
      .addFields(
        { name: '👤 الاسم بالحساب', value: `${user.tag}`, inline: true },
        { name: '🆔 المعرف ID', value: `\`${user.id}\``, inline: true },
        { name: '🤖 هل هو بوت؟', value: user.bot ? 'نعم 🤖' : 'لا 👤', inline: true },
        { name: '📅 تاريخ إنشاء الحساب', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F> (<t:${Math.floor(user.createdTimestamp / 1000)}:R>)`, inline: false }
      );

    if (member) {
      const roles = member.roles.cache
        .filter(r => r.id !== interaction.guild.id)
        .map(r => r.toString())
        .join(', ') || 'لا يوجد رتب';

      embed.addFields(
        { name: '📥 تاريخ الانضمام للسيرفر', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F> (<t:${Math.floor(member.joinedTimestamp / 1000)}:R>)`, inline: false },
        { name: `🏷️ الرتب (${member.roles.cache.size - 1})`, value: roles.length > 1024 ? roles.substring(0, 1020) + '...' : roles, inline: false }
      );
    }

    embed.setFooter({ text: `طُلب بواسطة ${interaction.user.tag}` }).setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
