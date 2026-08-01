const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('حظر عضو من السيرفر')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('العضو المراد حظره')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('سبب الحظر')
        .setRequired(false)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'لم يتم تحديد سبب';
    const member = interaction.guild.members.cache.get(targetUser.id);

    if (targetUser.id === interaction.user.id) {
      return interaction.reply({
        embeds: [errorEmbed('خطأ في العملية', 'لا يمكنك حظر نفسك!')],
        ephemeral: true
      });
    }

    if (member && !member.bannable) {
      return interaction.reply({
        embeds: [errorEmbed('خطأ في الصلاحيات', 'لا يمكنني حظر هذا العضو (قد تكون رتبته أعلى من رتبة البوت).')],
        ephemeral: true
      });
    }

    try {
      await interaction.guild.members.ban(targetUser.id, { reason: `${reason} | بواسطة ${interaction.user.tag}` });

      const embed = successEmbed(
        'تم حظر العضو بنجاح 🔨',
        `• **العضو المحظور:** ${targetUser.tag} (\`${targetUser.id}\`)\n• **المشرف المسؤول:** ${interaction.user}\n• **السبب:** ${reason}`
      );

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error banning user:', error);
      await interaction.reply({
        embeds: [errorEmbed('فشل في تنفيذ الحظر', 'حدث خطأ أثناء محاولة حظر العضو.')],
        ephemeral: true
      });
    }
  }
};
