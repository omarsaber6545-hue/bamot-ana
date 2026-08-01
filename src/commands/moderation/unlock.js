const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('فتح القناة الحالية والسماح للأعضاء بالكتابة')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    try {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: null
      });

      const embed = successEmbed(
        'تم فتح القناة 🔓',
        `تم إعادة فتح القناة بواسطة ${interaction.user}. يمكن للأعضاء الكتابة الآن.`
      );

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error unlocking channel:', error);
      await interaction.reply({
        embeds: [errorEmbed('خطأ', 'فشل فتح القناة، يرجى التحقق من صلاحيات البوت.')],
        ephemeral: true
      });
    }
  }
};
