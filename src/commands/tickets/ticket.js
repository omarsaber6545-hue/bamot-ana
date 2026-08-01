const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getTicketByChannel, claimTicketRecord, updateTicketStatus } = require('../../database/db');
const { successEmbed, errorEmbed, infoEmbed, warningEmbed } = require('../../utils/embeds');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('إدارة التذكرة الحالية (تذكير صاحب التذكرة، استلام، إضافة/إزالة، إغلاق)')
    .setDMPermission(false)
    .addSubcommand(sub =>
      sub.setName('ping').setDescription('إرسال تذكير في الخاص لصاحب التذكرة لمتابعة الردود')
    )
    .addSubcommand(sub =>
      sub.setName('claim').setDescription('استلام التذكرة الحالية وإسنادها إليك كإداري مسئول')
    )
    .addSubcommand(sub =>
      sub
        .setName('add')
        .setDescription('إضافة عضو لقناة التذكرة الحالية')
        .addUserOption(opt => opt.setName('target').setDescription('العضو المراد إضافته').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('remove')
        .setDescription('إزالة عضو من قناة التذكرة الحالية')
        .addUserOption(opt => opt.setName('target').setDescription('العضو المراد إزالته').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('rename')
        .setDescription('تغيير اسم قناة التذكرة الحالية')
        .addStringOption(opt => opt.setName('name').setDescription('الاسم الجديد للتذكرة').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('close').setDescription('إغلاق التذكرة الحالية')
    )
    .addSubcommand(sub =>
      sub.setName('delete').setDescription('حذف قناة التذكرة الحالية نهائياً')
    ),

  async execute(interaction) {
    const ticketRecord = getTicketByChannel(interaction.channel.id);

    if (!ticketRecord) {
      return interaction.reply({
        embeds: [errorEmbed('خطأ', 'هذا الأمر يشتغل فقط داخل قنوات التذاكر المفتوحة.')],
        ephemeral: true
      });
    }

    const subcommand = interaction.options.getSubcommand();

    // 0. Ping Ticket Opener
    if (subcommand === 'ping') {
      try {
        const openerUser = await interaction.client.users.fetch(ticketRecord.user_id);
        const iconUrl = interaction.guild.iconURL({ dynamic: true, size: 512 });

        const reminderEmbed = new EmbedBuilder()
          .setColor(config.colors.warning)
          .setAuthor({
            name: `${interaction.guild.name} • Ticket Reminder`,
            iconURL: iconUrl || undefined
          })
          .setTitle(`🔔 تذكير بشأن تذكرتك في سيرفر: ${interaction.guild.name}`)
          .setDescription(
            `أهلاً بك <@${ticketRecord.user_id}>!\n\n` +
            `يرجى التوجه لقناة تذكرتك لمتابعة الردود والدعم الفني المتاح من قِبل طاقم الإدارة.\n\n` +
            `📌 **رابط التذكرة المباشر:** <#${interaction.channel.id}>\n` +
            `• **المشرف المُذكِّر:** ${interaction.user.tag}`
          );

        if (iconUrl) reminderEmbed.setThumbnail(iconUrl);
        reminderEmbed.setTimestamp();

        let dmSuccess = true;
        try {
          await openerUser.send({ embeds: [reminderEmbed] });
        } catch (e) {
          dmSuccess = false;
        }

        const replyEmbed = successEmbed(
          'تذكير صاحب التذكرة 🔔',
          dmSuccess
            ? `تم إرسال إشعار تذكير أنيق في الخاص مع صورة السيرفر لصاحب التذكرة (<@${ticketRecord.user_id}>) بنجاح.`
            : `تعذر إرسال التذكير في الخاص (حساب العضو مغلق)، وتم عمل منشن له في القناة: <@${ticketRecord.user_id}>.`
        );

        return interaction.reply({
          content: !dmSuccess ? `🔔 تنبيه <@${ticketRecord.user_id}>! يرجى المتابعة.` : undefined,
          embeds: [replyEmbed]
        });
      } catch (e) {
        return interaction.reply({ embeds: [errorEmbed('خطأ', 'تعذر إرسال التذكير.')], ephemeral: true });
      }
    }

    // 1. Claim Ticket
    if (subcommand === 'claim') {
      if (ticketRecord.claimed_by) {
        return interaction.reply({
          embeds: [errorEmbed('تنبيه', `هذه التذكرة مستلمة بالفعل بواسطة المشرف <@${ticketRecord.claimed_by}>.`)],
          ephemeral: true
        });
      }

      claimTicketRecord(interaction.channel.id, interaction.user.id);

      const embed = successEmbed(
        'تم استلام التذكرة 🙋‍♂️',
        `قام المشرف ${interaction.user} باستلام متابعة هذه التذكرة وتقديم الدعم الفني فيها.`
      );

      return interaction.reply({ embeds: [embed] });
    }

    // 2. Add Member to Ticket
    if (subcommand === 'add') {
      const targetUser = interaction.options.getUser('target');

      try {
        await interaction.channel.permissionOverwrites.edit(targetUser.id, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true
        });

        const embed = successEmbed(
          'إضافة عضو 👤',
          `تمت إضافة العضو ${targetUser} إلى التذكرة بنجاح.`
        );

        return interaction.reply({ embeds: [embed] });
      } catch (e) {
        return interaction.reply({
          embeds: [errorEmbed('خطأ', 'تعذر إضافة العضو للتذكرة.')],
          ephemeral: true
        });
      }
    }

    // 3. Remove Member from Ticket
    if (subcommand === 'remove') {
      const targetUser = interaction.options.getUser('target');

      try {
        await interaction.channel.permissionOverwrites.delete(targetUser.id);

        const embed = successEmbed(
          'إزالة عضو ➖',
          `تمت إزالة العضو ${targetUser} من التذكرة.`
        );

        return interaction.reply({ embeds: [embed] });
      } catch (e) {
        return interaction.reply({
          embeds: [errorEmbed('خطأ', 'تعذر إزالة العضو من التذكرة.')],
          ephemeral: true
        });
      }
    }

    // 4. Rename Ticket
    if (subcommand === 'rename') {
      const newName = interaction.options.getString('name');

      try {
        await interaction.channel.setName(newName);

        const embed = successEmbed(
          'تغيير الاسم 🏷️',
          `تم تغيير اسم قناة التذكرة إلى: \`${newName}\`.`
        );

        return interaction.reply({ embeds: [embed] });
      } catch (e) {
        return interaction.reply({
          embeds: [errorEmbed('خطأ', 'تعذر تغيير اسم قناة التذكرة.')],
          ephemeral: true
        });
      }
    }

    // 5. Close Ticket
    if (subcommand === 'close') {
      try {
        updateTicketStatus(interaction.channel.id, 'CLOSED');
        await interaction.channel.permissionOverwrites.edit(ticketRecord.user_id, {
          SendMessages: false
        });

        const embed = infoEmbed(
          'تم إغلاق التذكرة 🔒',
          `تم إغلاق التذكرة بواسطة ${interaction.user}. تمت إزالة صلاحيات الكتابة عن صاحبة التذكرة.`
        );

        return interaction.reply({ embeds: [embed] });
      } catch (e) {
        return interaction.reply({
          embeds: [errorEmbed('خطأ', 'تعذر إغلاق التذكرة.')],
          ephemeral: true
        });
      }
    }

    // 6. Delete Ticket
    if (subcommand === 'delete') {
      await interaction.reply({
        embeds: [warningEmbed('حذف التذكرة 🗑️', 'سيتم حذف قناة التذكرة نهائياً خلال 5 ثوانٍ...')]
      });

      setTimeout(async () => {
        try {
          await interaction.channel.delete();
        } catch (e) {}
      }, 5000);
    }
  }
};
