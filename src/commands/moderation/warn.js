const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { addWarning, getUserWarnings, getGuildSettings } = require('../../database/db');
const { successEmbed, errorEmbed, warningEmbed, infoEmbed } = require('../../utils/embeds');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('توجيه تحذير رسمي لعضو مع إمكانية الكتم وإجراء الطرد عند 15 تحذير')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('العضو المراد تحذيره')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('سبب التحذير')
        .setRequired(true)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason');

    // Fetch guild member directly from API
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (targetUser.id === interaction.user.id) {
      return interaction.reply({
        embeds: [errorEmbed('خطأ', 'لا يمكنك تحذير نفسك!')],
        ephemeral: true
      });
    }

    try {
      // 1. Add warning to database
      addWarning(interaction.guild.id, targetUser.id, interaction.user.id, reason);

      // 2. Fetch updated warning count
      const warnings = getUserWarnings(interaction.guild.id, targetUser.id);
      const warnCount = warnings.length;

      let autoActionText = '';

      // 3. Send DM Warning Notification to target user
      try {
        let dmEmbed;

        if (warnCount >= 15) {
          dmEmbed = new EmbedBuilder()
            .setColor(config.colors.danger)
            .setTitle(`🚨 طرد تلقائي من سيرفر: ${interaction.guild.name}`)
            .setDescription(
              `لقد تم طردك أوتوماتيكياً من السيرفر لتجاوزك الحد الأقصى **15 تحذيراً** مسجلاً بحقك.\n\n` +
              `• **سبب التحذير الأخير:** ${reason}\n` +
              `• **بواسطة المشرف:** ${interaction.user.tag}\n` +
              `• **إجمالي تحذيراتك:** \`${warnCount}\` تحذير`
            )
            .setFooter({ text: `${interaction.guild.name} • Auto Protection` })
            .setTimestamp();
        } else {
          dmEmbed = new EmbedBuilder()
            .setColor(config.colors.warning)
            .setTitle(`⚠️ تحذير رسمي من إدارة: ${interaction.guild.name}`)
            .setDescription(
              `لقد تلقيت تحذيراً جديداً من إدارة السيرفر.\n\n` +
              `• **السبب:** ${reason}\n` +
              `• **بواسطة المشرف:** ${interaction.user.tag}\n` +
              `• **إجمالي تحذيراتك الحالية:** \`${warnCount}\` تحذير\n\n` +
              `📌 **نظام العقوبات بالسيرفر:**\n` +
              `• **15 تحذير:** طرد أوتوماتيكي نهائي من السيرفر (Kick) 🥾`
            )
            .setFooter({ text: `${interaction.guild.name} • Protection System` })
            .setTimestamp();
        }

        await targetUser.send({ embeds: [dmEmbed] });
      } catch (e) {
        console.log(`⚠️ User ${targetUser.tag} has DMs closed.`);
      }

      // 4. Auto-kick if warnings reached 15
      if (member && warnCount >= 15) {
        if (member.kickable) {
          try {
            await member.kick('النظام الآلي: تجاوز 15 تحذير');
            autoActionText = '\n\n🚨 **العقوبة الآلية القصوى:** وصل العضو لـ **15 تحذيراً**! تم إرسال إشعار الخاص و**طرده أوتوماتيكياً** من السيرفر 🥾.';
          } catch (e) {
            console.error('Error applying auto-kick:', e);
            autoActionText = `\n\n⚠️ **تعذر تطبيق الطرد الآلي:** ${e.message}`;
          }
        } else {
          autoActionText = '\n\n⚠️ **تنبيه:** وصل العضو لـ 15 تحذيراً، ولكن لا يمكن طرده تلقائياً لأن رتبته أعلى من البوت أو يمتلك صلاحيات إدارة.';
        }
      }

      // 5. Build Channel Reply with Interactive Mute/Skip Buttons for the Admin
      const responseEmbed = successEmbed(
        'تم توجيه التحذير بنجاح ⚠️',
        `• **المُحذَّر:** ${targetUser.tag} (${targetUser})\n` +
        `• **المشرف:** ${interaction.user}\n` +
        `• **السبب:** ${reason}\n` +
        `• **إجمالي التحذيرات:** \`${warnCount}\` تحذير` +
        autoActionText +
        (warnCount < 15 ? '\n\n❓ **هل ترغب في كتم العضو الآن؟ استخدم الأزرار أدناه:**' : '')
      );

      // Buttons (Mute 1 Hour or Skip)
      const muteBtn = new ButtonBuilder()
        .setCustomId(`warn_mute_${targetUser.id}_${Date.now()}`)
        .setLabel('إعطاء ميوت (1 ساعة) 🔇')
        .setStyle(ButtonStyle.Danger);

      const skipBtn = new ButtonBuilder()
        .setCustomId(`warn_skip_${targetUser.id}_${Date.now()}`)
        .setLabel('تجاهل بدون كتم ⏩')
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder().addComponents(muteBtn, skipBtn);

      const response = await interaction.reply({
        embeds: [responseEmbed],
        components: warnCount < 15 ? [row] : []
      });

      // 6. Interactive Button Collector for Admin
      if (warnCount < 15) {
        const collector = response.createMessageComponentCollector({
          filter: i => i.user.id === interaction.user.id,
          time: 60000
        });

        collector.on('collect', async btnInteraction => {
          if (btnInteraction.customId.startsWith('warn_mute_')) {
            if (member && member.moderatable) {
              try {
                const oneHourMs = 60 * 60 * 1000;
                await member.timeout(oneHourMs, `كتم يدوي بواسطة ${interaction.user.tag} بعد التحذير`);

                // Send DM notification for mute
                try {
                  await targetUser.send({
                    embeds: [
                      errorEmbed(
                        `🔇 كتم مؤقت في سيرفر: ${interaction.guild.name}`,
                        `لقد تم كتمك لمدة **ساعة واحدة** بواسطة المشرف ${interaction.user.tag} بعد توجيه تحذير لك.`
                      )
                    ]
                  });
                } catch (e) {}

                await btnInteraction.update({
                  content: `✅ **تم إعطاء العضو ${targetUser} ميوت (Time Out) لمدة 1 ساعة بنجاح!** 🔇`,
                  components: []
                });
              } catch (e) {
                await btnInteraction.update({
                  content: `⚠️ **تعذر كتم العضو:** ${e.message}`,
                  components: []
                });
              }
            } else {
              await btnInteraction.update({
                content: `⚠️ **تعذر كتم العضو:** رتبة العضو أعلى من البوت أو يمتلك صلاحيات إدارة.`,
                components: []
              });
            }
          } else if (btnInteraction.customId.startsWith('warn_skip_')) {
            await btnInteraction.update({
              content: `✅ **تم تسجيل التحذير فقط دون كتم.**`,
              components: []
            });
          }
        });

        collector.on('end', async (collected, reason) => {
          if (reason === 'time' && collected.size === 0) {
            try {
              await interaction.editReply({ components: [] });
            } catch (e) {}
          }
        });
      }

      // 7. Log to Guild Log Channel if configured
      const settings = getGuildSettings(interaction.guild.id);
      if (settings && settings.log_channel) {
        try {
          const logChannel = interaction.guild.channels.cache.get(settings.log_channel);
          if (logChannel) {
            const logEmbed = new EmbedBuilder()
              .setColor(config.colors.warning)
              .setTitle('⚠️ توجيه تحذير رسمي (Warning Issued)')
              .setDescription(
                `• **العضو:** ${targetUser.tag} (\`${targetUser.id}\`)\n` +
                `• **المشرف:** ${interaction.user.tag}\n` +
                `• **السبب:** ${reason}\n` +
                `• **العدد الإجمالي:** \`${warnCount}\` تحذير` +
                (warnCount >= 15 ? '\n• **الإجراء الآلي:** طرد تلقائي لتجاوز 15 تحذيراً 🥾' : '')
              )
              .setTimestamp();

            await logChannel.send({ embeds: [logEmbed] });
          }
        } catch (e) {
          console.error('Error sending log:', e);
        }
      }
    } catch (error) {
      console.error('Error issuing warning:', error);
      await interaction.reply({
        embeds: [errorEmbed('فشل العملية', 'حدث خطأ أثناء تنفيذ التحذير.')],
        ephemeral: true
      });
    }
  }
};
