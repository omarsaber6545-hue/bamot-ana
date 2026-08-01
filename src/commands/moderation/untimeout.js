const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('إزالة الكتم عن عضو')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('العضو المراد فك الكتم عنه')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('السبب')
        .setRequired(false)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'إلغاء كتم يدوي';
    const member = interaction.guild.members.cache.get(targetUser.id);

    if (!member) {
      return interaction.reply({
        embeds: [errorEmbed('خطأ', 'هذا العضو غير موجود في السيرفر حاليًا.')],
        ephemeral: true
      });
    }

    if (!member.isCommunicationDisabled()) {
      return interaction.reply({
        embeds: [errorEmbed('تنبيه', 'هذا العضو ليس مكتمًا بالأصل.')],
        ephemeral: true
      });
    }

    try {
      await member.timeout(null, `${reason} | بواسطة ${interaction.user.tag}`);

      const embed = successEmbed(
        'تم فك الكتم بنجاح 🔊',
        `• **العضو:** ${targetUser.tag} (\`${targetUser.id}\`)\n• **المشرف المسؤول:** ${interaction.user}\n• **السبب:** ${reason}`
      );

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error removing timeout:', error);
      await interaction.reply({
        embeds: [errorEmbed('فشل العملية', 'حدث خطأ أثناء إلغاء كتم العضو.')],
        ephemeral: true
      });
    }
  }
};
