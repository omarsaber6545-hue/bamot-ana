const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('قفل القناة الحالية وإيقاف كتابة الاعضاء فيها')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    try {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: false
      });

      const embed = successEmbed(
        'تم قفل القناة 🔒',
        `تم قفل هذه القناة بقرار من المشرف ${interaction.user}. لا يمكن للأعضاء الكتابة الآن.`
      );

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error locking channel:', error);
      await interaction.reply({
        embeds: [errorEmbed('خطأ', 'فشل قفل القناة، يرجى التحقق من صلاحيات البوت.')],
        ephemeral: true
      });
    }
  }
};
