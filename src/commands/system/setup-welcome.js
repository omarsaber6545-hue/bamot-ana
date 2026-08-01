const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { updateGuildSettings, getGuildSettings } = require('../../database/db');
const { successEmbed, errorEmbed, infoEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-welcome')
    .setDescription('إعداد وتكفير نظام الترحيب والرتب التلقائية للأعضاء الجدد')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('قناة إرسال رسائل الترحيب')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addRoleOption(option =>
      option
        .setName('role')
        .setDescription('الرتبة التلقائية التي تُمنح للعضو فور انضمامه (Auto Role)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const welcomeChannel = interaction.options.getChannel('channel');
    const autoRole = interaction.options.getRole('role');

    if (!welcomeChannel && !autoRole) {
      const currentSettings = getGuildSettings(interaction.guild.id);
      const chText = currentSettings?.welcome_channel ? `<#${currentSettings.welcome_channel}>` : 'غير محددة';
      const roleText = currentSettings?.welcome_role ? `<@&${currentSettings.welcome_role}>` : 'غير محددة';

      return interaction.reply({
        embeds: [
          infoEmbed(
            'إعدادات الترحيب الحالية 👋',
            `• **قناة الترحيب:** ${chText}\n• **الرتبة التلقائية:** ${roleText}\n\nلتعديل الإعدادات، يرجى تمرير خيارات \`channel\` أو \`role\`.`
          )
        ],
        ephemeral: true
      });
    }

    try {
      const updateData = {};
      if (welcomeChannel) updateData.welcome_channel = welcomeChannel.id;
      if (autoRole) updateData.welcome_role = autoRole.id;

      updateGuildSettings(interaction.guild.id, updateData);

      let msg = 'تم حفظ الإعدادات بنجاح:\n';
      if (welcomeChannel) msg += `• **قناة الترحيب:** ${welcomeChannel}\n`;
      if (autoRole) msg += `• **الرتبة التلقائية:** ${autoRole}\n`;

      await interaction.reply({
        embeds: [successEmbed('نظام الترحيب 👋', msg)]
      });
    } catch (error) {
      console.error('Error in setup-welcome:', error);
      await interaction.reply({
        embeds: [errorEmbed('خطأ', 'حدث خطأ أثناء حفظ إعدادات الترحيب.')],
        ephemeral: true
      });
    }
  }
};
