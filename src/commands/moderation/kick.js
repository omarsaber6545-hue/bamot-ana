const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('طرد عضو من السيرفر')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('العضو المرادطرده')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('سبب الطرد')
        .setRequired(false)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
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
        embeds: [errorEmbed('خطأ في العملية', 'لا يمكنك طرد نفسك!')],
        ephemeral: true
      });
    }

    if (!member.kickable) {
      return interaction.reply({
        embeds: [errorEmbed('خطأ في الصلاحيات', 'لا يمكنني طرد هذا العضو (قد تكون رتبته أعلى من رتبة البوت).')],
        ephemeral: true
      });
    }

    try {
      await member.kick(`${reason} | بواسطة ${interaction.user.tag}`);

      const embed = successEmbed(
        'تم طرد العضو بنجاح 🥾',
        `• **العضو المطروود:** ${targetUser.tag} (\`${targetUser.id}\`)\n• **المشرف المسؤول:** ${interaction.user}\n• **السبب:** ${reason}`
      );

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error kicking user:', error);
      await interaction.reply({
        embeds: [errorEmbed('فشل في تنفيذ الطرد', 'حدث خطأ أثناء محاولة طرد العضو.')],
        ephemeral: true
      });
    }
  }
};
