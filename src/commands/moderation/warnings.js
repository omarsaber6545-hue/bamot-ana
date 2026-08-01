const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getUserWarnings, clearUserWarnings } = require('../../database/db');
const { infoEmbed, successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('عرض أو مسح التحذيرات المسجلة بحق عضو')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(subcommand =>
      subcommand
        .setName('show')
        .setDescription('عرض تحذيرات العضو')
        .addUserOption(option =>
          option
            .setName('target')
            .setDescription('العضو المراد فحص تحذيراته')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('clear')
        .setDescription('مسح كافة تحذيرات العضو')
        .addUserOption(option =>
          option
            .setName('target')
            .setDescription('العضو المراد مسح تحذيراته')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser('target');

    if (subcommand === 'show') {
      const warnings = getUserWarnings(interaction.guild.id, targetUser.id);

      if (!warnings || warnings.length === 0) {
        return interaction.reply({
          embeds: [infoEmbed('سجل التحذيرات 📋', `لا يوجد أي تحذيرات مسجلة بحق العضو ${targetUser.tag}.`)]
        });
      }

      const warningList = warnings
        .map((w, index) => `${index + 1}. **السبب:** ${w.reason} | **المشرف:** <@${w.moderator_id}> | <t:${Math.floor(new Date(w.created_at).getTime() / 1000)}:R>`)
        .join('\n');

      const embed = infoEmbed(
        `سجل تحذيرات العضو: ${targetUser.tag} ⚠️`,
        `• **إجمالي التحذيرات:** \`${warnings.length}\` تحذير\n` +
        `• **نظام العقوبات الآلية:** \`[أزرار كتم تفاعلية 🔇 | 15 تحذيراً = طرد أوتوماتيكي 🥾]\`\n\n` +
        `**تفاصيل التحذيرات:**\n${warningList}`
      );

      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === 'clear') {
      clearUserWarnings(interaction.guild.id, targetUser.id);
      return interaction.reply({
        embeds: [successEmbed('مسح التحذيرات 🧹', `تم مسح جميع التحذيرات الخاصة بالعضو ${targetUser.tag} بنجاح.`)]
      });
    }
  }
};
