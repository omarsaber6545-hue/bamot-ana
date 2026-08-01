const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder } = require('discord.js');
const { updateGuildSettings } = require('../../database/db');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-setup')
    .setDescription('إنشاء وإرسال لوحة فتح التذاكر والدعم الفني')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('القناة التي سيتم إرسال لوحة التذاكر فيها')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addChannelOption(option =>
      option
        .setName('category')
        .setDescription('كتالوج/قسم التذاكر الذي ستُنشأ فيه القنوات')
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(false)
    )
    .addRoleOption(option =>
      option
        .setName('support_role')
        .setDescription('رتبة فريق الدعم الفني المشرف على التذاكر')
        .setRequired(false)
    ),

  async execute(interaction) {
    const targetChannel = interaction.options.getChannel('channel');
    const category = interaction.options.getChannel('category');
    const supportRole = interaction.options.getRole('support_role');

    try {
      // Save settings to DB
      updateGuildSettings(interaction.guild.id, {
        ticket_category: category ? category.id : null,
        ticket_support_role: supportRole ? supportRole.id : null
      });

      const panelEmbed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle(`${config.emojis.ticket} لوحة الدعم الفني والتذاكر`)
        .setDescription(
          'مرحباً بك في مركز الدعم الفني الخاص بالسيرفر!\n\n' +
          'إذا كنت بحاجة إلى الاستفسار، تقديم شكوى، أو طلب مساعدة من طاقم الإدارة، يرجى الضغط على الزر أدناه لفتح تذكرة خاصة بك.\n\n' +
          '📌 **ملاحظة:** يرجى التزام الأدب وعدم فتح تذاكر دون سبب.'
        )
        .setFooter({ text: `${interaction.guild.name} • نظام التذاكر` })
        .setTimestamp();

      const button = new ButtonBuilder()
        .setCustomId('create_ticket')
        .setLabel('فتح تذكرة جديدة 🎫')
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder().addComponents(button);

      await targetChannel.send({ embeds: [panelEmbed], components: [row] });

      await interaction.reply({
        embeds: [successEmbed('تم إرسال لوحة التذاكر 🎫', `تم إرسال اللوحة بنجاح في القناة ${targetChannel}.`)],
        ephemeral: true
      });
    } catch (error) {
      console.error('Error setting up tickets:', error);
      await interaction.reply({
        embeds: [errorEmbed('خطأ', 'حدث خطأ أثناء إرسال لوحة التذاكر.')],
        ephemeral: true
      });
    }
  }
};
