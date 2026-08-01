const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { updateGuildSettings, getGuildSettings } = require('../../database/db');
const { successEmbed, errorEmbed, infoEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-logs')
    .setDescription('إعداد قناة سجلات السيرفر (Server Audit Logs)')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('القناة المراد تخصيصها للسجلات واللوج')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  async execute(interaction) {
    const logChannel = interaction.options.getChannel('channel');

    try {
      updateGuildSettings(interaction.guild.id, {
        log_channel: logChannel.id
      });

      await interaction.reply({
        embeds: [
          successEmbed(
            'نظام السجلات واللوجات 📜',
            `تم تعيين القناة ${logChannel} كقناة رسمية لتسجيل أحداث السيرفر (حذف/تعديل الرسائل، انضمام/مغادرة الأعضاء، والحظر).`
          )
        ]
      });
    } catch (error) {
      console.error('Error setting up logs:', error);
      await interaction.reply({
        embeds: [errorEmbed('خطأ', 'حدث خطأ أثناء حفظ قناة السجلات.')],
        ephemeral: true
      });
    }
  }
};
