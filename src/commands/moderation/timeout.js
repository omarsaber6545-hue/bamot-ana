const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('كتم عضو لفترة زمنية محددة (Time Out)')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('العضو المراد كتمه')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('duration')
        .setDescription('مدة الكتم بالدقائق')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(40320) // 28 days max
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('سبب الكتم')
        .setRequired(false)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const minutes = interaction.options.getInteger('duration');
    const reason = interaction.options.getString('reason') || 'لم يتم تحديد سبب';
    const member = interaction.guild.members.cache.get(targetUser.id);

    if (!member) {
      return interaction.reply({
        embeds: [errorEmbed('خطأ', 'هذا العضو غير موجود في السيرفر حاليًا.')],
        ephemeral: true
      });
    }

    if (targetUser.id === interaction.user.id) {
      return interaction.reply({
        embeds: [errorEmbed('خطأ في العملية', 'لا يمكنك كتم نفسك!')],
        ephemeral: true
      });
    }

    if (!member.moderatable) {
      return interaction.reply({
        embeds: [errorEmbed('خطأ في الصلاحيات', 'لا يمكنني كتم هذا العضو (قد تكون رتبته أعلى من رتبة البوت).')],
        ephemeral: true
      });
    }

    try {
      const durationMs = minutes * 60 * 1000;
      await member.timeout(durationMs, `${reason} | بواسطة ${interaction.user.tag}`);

      const embed = successEmbed(
        'تم كتم العضو بنجاح 🔇',
        `• **العضو المكتم:** ${targetUser.tag} (\`${targetUser.id}\`)\n• **مدة الكتم:** ${minutes} دقيقة\n• **المشرف المسؤول:** ${interaction.user}\n• **السبب:** ${reason}`
      );

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error timing out user:', error);
      await interaction.reply({
        embeds: [errorEmbed('فشل في الكتم', 'حدث خطأ أثناء محاولة كتم العضو.')],
        ephemeral: true
      });
    }
  }
};
