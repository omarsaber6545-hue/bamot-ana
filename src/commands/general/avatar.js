const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('عرض وتحميل صورة الحساب الشخصية أو صورة السيرفر')
    .setDMPermission(false)
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('العضو المراد عرض صورته')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option
        .setName('server')
        .setDescription('عرض صورة السيرفر بدلاً من صورة الحساب')
        .setRequired(false)
    ),

  async execute(interaction) {
    const showServer = interaction.options.getBoolean('server');

    if (showServer) {
      const iconUrl = interaction.guild.iconURL({ dynamic: true, size: 1024 });

      if (!iconUrl) {
        return interaction.reply({ content: '❌ لا توجد صورة مخصصة لهذا السيرفر.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle(`صورة سيرفر: ${interaction.guild.name} 🖼️`)
        .setImage(iconUrl)
        .setFooter({ text: `طُلب بواسطة ${interaction.user.tag}` })
        .setTimestamp();

      const button = new ButtonBuilder()
        .setLabel('تحميل الصورة 🖼️')
        .setStyle(ButtonStyle.Link)
        .setURL(iconUrl);

      return interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(button)] });
    }

    const user = interaction.options.getUser('target') || interaction.user;
    const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 1024 });

    const embed = new EmbedBuilder()
      .setColor(config.colors.info)
      .setTitle(`صورة العضو: ${user.tag} 🖼️`)
      .setImage(avatarUrl)
      .setFooter({ text: `طُلب بواسطة ${interaction.user.tag}` })
      .setTimestamp();

    const button = new ButtonBuilder()
      .setLabel('تحميل الصورة 🖼️')
      .setStyle(ButtonStyle.Link)
      .setURL(avatarUrl);

    await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(button)] });
  }
};
