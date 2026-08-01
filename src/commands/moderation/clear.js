const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('حذف وتطهير عدد محدد من الرسائل في القناة الحالية')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('عدد الرسائل المراد مسحها (من 1 إلى 100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');

    try {
      const deleted = await interaction.channel.bulkDelete(amount, true);

      const embed = successEmbed(
        'تطهير الشات 🧹',
        `تم حذف \`${deleted.size}\` رسالة بنجاح بواسطة ${interaction.user}.`
      );

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error('Error clearing messages:', error);
      await interaction.reply({
        embeds: [errorEmbed('خطأ في العملية', 'تعذر مسح الرسائل. ملاحظة: لا يمكن مسح الرسائل التي مضى عليها أكثر من 14 يوماً دفعة واحدة.')],
        ephemeral: true
      });
    }
  }
};
