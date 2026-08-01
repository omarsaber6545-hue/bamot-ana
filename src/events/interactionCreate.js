const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, UserSelectMenuBuilder, RoleSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { getGuildSettings, createTicketRecord, updateTicketStatus, getTicketByChannel, claimTicketRecord, recordCommandExecution, isCommandEnabled, claimQuestReward } = require('../database/db');
const { errorEmbed, successEmbed, infoEmbed, warningEmbed, createProgressBar } = require('../utils/embeds');
const config = require('../config/config');
const { summonBotToChannel, dismissBotFromChannel, fiveBots } = require('../services/fiveBotOrchestrator');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    // 1. Handle Slash Commands
    if (interaction.isChatInputCommand()) {
      if (!interaction.guild) {
        return interaction.reply({
          content: '❌ **أوامر البوت تعمل حصرياً داخل السيرفرات فقط وليس في المحادثات الخاصة (DMs).**',
          ephemeral: true
        });
      }

      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;

      if (!isCommandEnabled(interaction.commandName)) {
        return interaction.reply({
          content: '❌ **هذا الأمر معطل حالياً من قِبل الإدارة عبر لوحة التحكم (Command Management Center).**',
          ephemeral: true
        });
      }

      try {
        // recordCommandExecution(
        //   interaction.commandName,
        //   interaction.user.id,
        //   interaction.user.tag,
        //   interaction.user.displayAvatarURL({ dynamic: true })
        // );

        await command.execute(interaction);
      } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error);
        const replyPayload = {
          embeds: [errorEmbed('خطأ في التنفيذ', 'حدث خطأ غير متوقع أثناء تنفيذ الأمر.')],
          ephemeral: true
        };
        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.editReply(replyPayload).catch(() => {});
          } else {
            await interaction.reply(replyPayload).catch(() => {});
          }
        } catch (e) {
          console.error(`Failed to send interaction error payload to Discord: ${e.message}`);
        }
      }
      return;
    }

    // 2. Handle Modal Submits
    if (interaction.isModalSubmit()) {
      // Music Play Query Modal
      if (interaction.customId === 'music_play_modal') {
        const query = interaction.fields.getTextInputValue('song_query');
        let voiceChannel = interaction.member.voice?.channel;
        if (!voiceChannel) {
          return interaction.reply({ embeds: [errorEmbed('خطأ في الصوت', 'يجب أن تكون متواصلاً في قناة صوتية أولاً!')], ephemeral: true });
        }

        await interaction.deferReply();
        const { searchTracks, getQueue, createGuildQueue, playSong } = require('../services/musicService');

        const tracks = await searchTracks(query);
        if (!tracks || tracks.length === 0) {
          return interaction.editReply({ embeds: [errorEmbed('لم يتم العثور على نتائج', `عذراً، لم نتمكن من العثور على نتائج لـ: \`${query}\`.`)] });
        }

        const track = { ...tracks[0], requestedBy: interaction.user.tag };
        let queue = getQueue(interaction.guild.id, voiceChannel.id);
        if (!queue) {
          try {
            queue = await createGuildQueue(
              interaction.guild.id,
              voiceChannel,
              interaction.channel
            );
          } catch (err) {
            return interaction.editReply({ embeds: [errorEmbed('جميع البوتات مشغولة', err.message || 'جميع البوتات الموسيقية مشغولة حالياً في رومات أخرى.')] });
          }
        }

        if (queue.isPlaying) {
          queue.songs.push(track);
          return interaction.editReply({
            embeds: [successEmbed('تمت الإضافة لقائمة الانتظار 🎵', `• **الأغنية:** [${track.title}](${track.url})\n• **الروم الصوتي:** <#${voiceChannel.id}>\n• **البوت المشغل:** \`${queue.activeSubBotName}\``)]
          });
        }

        await interaction.editReply({
          embeds: [infoEmbed('جاري الانضمام والتشغيل 🎧', `• **الأغنية:** [${track.title}](${track.url})\n• **الروم الصوتي:** <#${voiceChannel.id}>\n• **البوت المشغل:** \`${queue.activeSubBotName}\``)]
        });

        await playSong(interaction.guild.id, track, voiceChannel.id);
        return;
      }

      // Embed Message Builder Modal
      if (interaction.customId === 'embed_message_builder_modal') {
        const title = interaction.fields.getTextInputValue('title_input')?.trim() || null;
        const description = interaction.fields.getTextInputValue('description_input') || '';
        let image = interaction.fields.getTextInputValue('image_input')?.trim() || null;
        const colorHex = interaction.fields.getTextInputValue('color_input')?.trim() || null;
        const footer = interaction.fields.getTextInputValue('footer_input')?.trim() || null;

        let color = '#9B59B6';
        if (colorHex && /^#?([0-9A-F]{3}){1,2}$/i.test(colorHex)) {
          color = colorHex.startsWith('#') ? colorHex : `#${colorHex}`;
        }

        const previewEmbed = new EmbedBuilder()
          .setColor(color)
          .setAuthor({
            name: `${interaction.guild.name} • System Notification`,
            iconURL: interaction.guild.iconURL({ dynamic: true }) || undefined
          })
          .setDescription(
            (title ? `# ${title}\n\n` : '') +
            description +
            `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
          );

        const settings = getGuildSettings(interaction.guild.id);
        let finalImage = image;
        if (!finalImage) {
          finalImage = settings?.default_gif || config.defaultGif;
        }

        if (finalImage && finalImage.length > 5) {
          if (!finalImage.startsWith('http://') && !finalImage.startsWith('https://')) {
            finalImage = `https://${finalImage}`;
          }
          try {
            previewEmbed.setImage(finalImage);
          } catch (e) {
            console.error('❌ [Image URL Error] Could not set image URL:', finalImage, e.message);
          }
        }

        if (footer) {
          previewEmbed.setFooter({ text: `${footer} • ${interaction.guild.name}` });
        } else {
          previewEmbed.setFooter({ text: `${interaction.guild.name} • System Notification` });
        }
        previewEmbed.setTimestamp();

        const cacheKey = `${interaction.user.id}_${Date.now()}`;
        if (interaction.client.embedCache) {
          interaction.client.embedCache.set(cacheKey, previewEmbed);
        }

        const userSelect = new UserSelectMenuBuilder()
          .setCustomId(`embed_select_users_${cacheKey}`)
          .setPlaceholder('اختر الأعضاء المراد إرسال الرسالة لهم (حتى 25 عضو)...')
          .setMinValues(1)
          .setMaxValues(25);

        const roleSelect = new RoleSelectMenuBuilder()
          .setCustomId(`embed_select_roles_${cacheKey}`)
          .setPlaceholder('اختر رتبة أو عدة رتب للإرسال لأعضائها...')
          .setMinValues(1)
          .setMaxValues(25);

        const sendAllBtn = new ButtonBuilder()
          .setCustomId(`embed_send_all_${cacheKey}`)
          .setLabel('إرسال لجميع أعضاء السيرفر 🌐')
          .setStyle(ButtonStyle.Success);

        const row1 = new ActionRowBuilder().addComponents(userSelect);
        const row2 = new ActionRowBuilder().addComponents(roleSelect);
        const row3 = new ActionRowBuilder().addComponents(sendAllBtn);

        await interaction.reply({
          content: '✨ **معاينة الرسالة الخاصة التي صممتها:**\nاختر المستهدفين من القوائم أدناه لبدء الإرسال:',
          embeds: [previewEmbed],
          components: [row1, row2, row3],
          ephemeral: true
        });
        return;
      }

      // Rename Ticket Modal
      if (interaction.customId === 'ticket_rename_modal') {
        const newName = interaction.fields.getTextInputValue('ticket_new_name_input')?.trim();
        if (!newName) return interaction.reply({ content: '❌ يرجى كتابة اسم صالح.', ephemeral: true });

        try {
          await interaction.channel.setName(newName);
          await interaction.reply({
            embeds: [successEmbed('تغيير اسم التذكرة 🏷️', `تم تغيير اسم القناة إلى: \`${newName}\` بواسطة ${interaction.user}.`)]
          });
        } catch (e) {
          await interaction.reply({ embeds: [errorEmbed('خطأ', 'تعذر تغيير اسم القناة.')], ephemeral: true });
        }
        return;
      }
    }

    // 3. Handle Select Menus for DM Broadcast & Ticket Member Add
    if (interaction.isUserSelectMenu() || interaction.isRoleSelectMenu()) {
      // Ticket User Add Select Menu
      if (interaction.customId === 'ticket_user_add_select') {
        const selectedUsers = Array.from(interaction.users.values());
        if (selectedUsers.length === 0) return;

        try {
          for (const u of selectedUsers) {
            await interaction.channel.permissionOverwrites.edit(u.id, {
              ViewChannel: true,
              SendMessages: true,
              ReadMessageHistory: true
            });
          }
          const names = selectedUsers.map(u => `${u}`).join(', ');
          await interaction.reply({
            embeds: [successEmbed('إضافة عضو للتذكرة 👤', `تمت إضافة (${names}) إلى التذكرة بنجاح بواسطة ${interaction.user}.`)]
          });
        } catch (e) {
          await interaction.reply({ embeds: [errorEmbed('خطأ', 'تعذر إضافة العضو للتذكرة.')], ephemeral: true });
        }
        return;
      }

      if (interaction.isStringSelectMenu()) {
        const { customId, values, guild, member } = interaction;

        if (customId === 'music_filter_select') {
          const { getQueue, playSong } = require('../services/musicService');
          const voiceChannelId = member.voice?.channel?.id;
          const queue = getQueue(guild.id, voiceChannelId);

          if (!queue) {
            return interaction.reply({ embeds: [errorEmbed('خطأ', 'لا توجد جلسة موسيقى نشطة بالروم الصوتية.')], ephemeral: true });
          }

          const filterMode = values[0];
          queue.filter = filterMode;
          if (queue.currentSong) {
            playSong(guild.id, queue.currentSong, queue.voiceChannelId);
          }
          return interaction.reply({
            embeds: [successEmbed('تغيير فلتر الصوت 🎚️', `تم تطبيق الفلتر الصوتي **${filterMode.toUpperCase()}** في الروم الصوتي **${queue.voiceChannel.name}**.`)],
            ephemeral: true
          });
        }

        if (customId === 'music_volume_select') {
          const { getQueue } = require('../services/musicService');
          const voiceChannelId = member.voice?.channel?.id;
          const queue = getQueue(guild.id, voiceChannelId);

          if (!queue) {
            return interaction.reply({ embeds: [errorEmbed('خطأ', 'لا توجد جلسة موسيقى نشطة بالروم الصوتية.')], ephemeral: true });
          }

          const level = parseInt(values[0], 10);
          queue.volume = level;
          return interaction.reply({
            embeds: [successEmbed('تغيير مستوى الصوت 🔊', `تم ضبط مستوى الصوت إلى **${level}%** في الروم الصوتي **${queue.voiceChannel.name}**.`)],
            ephemeral: true
          });
        }
      }

      // Embed DM Select Handling
      if (
        interaction.customId.startsWith('embed_select_users_') ||
        interaction.customId.startsWith('embed_select_roles_')
      ) {
        const parts = interaction.customId.split('_');
        const cacheKey = `${parts[3]}_${parts[4]}`;
        const rawEmbedData = interaction.client.embedCache ? interaction.client.embedCache.get(cacheKey) : null;

        if (!rawEmbedData) {
          return interaction.reply({
            embeds: [errorEmbed('انتهت المهلة', 'لقد انتهت صلاحية الجلسة، يرجى تشغيل الأمر /dm من جديد.')],
            ephemeral: true
          });
        }

        const embedToSend = EmbedBuilder.from(rawEmbedData);
        await interaction.deferUpdate();

        let targetUsers = [];

        if (interaction.isUserSelectMenu()) {
          targetUsers = Array.from(interaction.users.values()).filter(u => !u.bot);
        } else if (interaction.isRoleSelectMenu()) {
          await interaction.guild.members.fetch();
          const selectedRoleIds = interaction.values;
          const members = interaction.guild.members.cache.filter(
            m => !m.user.bot && m.roles.cache.some(r => selectedRoleIds.includes(r.id))
          );
          targetUsers = Array.from(members.values()).map(m => m.user);
        }

        if (targetUsers.length === 0) {
          return interaction.followUp({
            embeds: [errorEmbed('خطأ', 'لم يتم العثور على أعضاء غير بوتات للإرسال إليهم.')],
            ephemeral: true
          });
        }

        let successCount = 0;
        let failedCount = 0;
        const total = targetUsers.length;

        await interaction.editReply({
          content:
            `📡 **جاري المعالجة والإرسال التلقائي...**\n` +
            `📊 **نسبة الإنجاز:** ${createProgressBar(0, total, 16)}\n` +
            `• 🎯 **المستهدفون:** \`${total}\` عضو | ✅ **نجاح:** \`0\` | ❌ **فشل:** \`0\`\n` +
            `──────────────────────────────`,
          embeds: [embedToSend],
          components: []
        });

        for (let i = 0; i < total; i++) {
          const targetUser = targetUsers[i];
          try {
            await targetUser.send({ embeds: [embedToSend] });
            successCount++;
          } catch (err) {
            failedCount++;
          }

          const isLast = i === total - 1;
          if (isLast || i % 2 === 0) {
            try {
              await interaction.editReply({
                content: isLast
                  ? `✨ **تم إكتمال عملية الإرسال بنجاح!** 🎉\n` +
                  `📊 **النتيجة النهائية:** ${createProgressBar(total, total, 16)}\n` +
                  `• 🎯 **إجمالي المستهدفين:** \`${total}\` عضو\n` +
                  `• ✅ **تم الإرسال بنجاح:** \`${successCount}\` عضو\n` +
                  `• ❌ **فشل الإرسال (خاص مغلق):** \`${failedCount}\` عضو\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
                  : `📡 **جاري الإرسال التلقائي...**\n` +
                  `📊 **نسبة الإنجاز:** ${createProgressBar(i + 1, total, 16)}\n` +
                  `• 🎯 **المستهدفون:** \`${total}\` عضو | ✅ **نجاح:** \`${successCount}\` | ❌ **فشل:** \`${failedCount}\`\n` +
                  `• 🔄 **جاري المراسلة:** ${targetUser}\n` +
                  `──────────────────────────────`,
                embeds: [embedToSend]
              });
            } catch (e) { }
          }

          if (total > 5) {
            await new Promise(res => setTimeout(res, 120));
          }
        }

        if (interaction.client.embedCache) {
          interaction.client.embedCache.delete(cacheKey);
        }

        return;
      }
    }

    // 4. Handle Button Interactions (Tickets & DM Broadcast)
    if (interaction.isButton()) {
      const { customId, guild, user } = interaction;

      // DM Send-All Button
      if (customId.startsWith('embed_send_all_')) {
        const parts = customId.split('_');
        const cacheKey = `${parts[3]}_${parts[4]}`;
        const rawEmbedData = interaction.client.embedCache ? interaction.client.embedCache.get(cacheKey) : null;

        if (!rawEmbedData) {
          return interaction.reply({
            embeds: [errorEmbed('انتهت المهلة', 'لقد انتهت صلاحية الجلسة، يرجى تشغيل الأمر /dm من جديد.')],
            ephemeral: true
          });
        }

        const embedToSend = EmbedBuilder.from(rawEmbedData);
        await interaction.deferUpdate();

        await interaction.guild.members.fetch();
        const allMembers = interaction.guild.members.cache.filter(m => !m.user.bot);
        const targetUsers = Array.from(allMembers.values()).map(m => m.user);

        let successCount = 0;
        let failedCount = 0;
        const total = targetUsers.length;

        for (let i = 0; i < total; i++) {
          const targetUser = targetUsers[i];
          try {
            await targetUser.send({ embeds: [embedToSend] });
            successCount++;
          } catch (err) {
            failedCount++;
          }

          const isLast = i === total - 1;
          if (isLast || i % 2 === 0) {
            try {
              await interaction.editReply({
                content: isLast
                  ? `✨ **تم إكتمال عملية الإرسال لجميع أعضاء السيرفر بنجاح!** 🎉\n` +
                  `📊 **النتيجة النهائية:** ${createProgressBar(total, total, 16)}\n` +
                  `• 🎯 **إجمالي المستهدفين:** \`${total}\` عضو\n` +
                  `• ✅ **تم الإرسال بنجاح:** \`${successCount}\` عضو\n` +
                  `• ❌ **فشل الإرسال (خاص مغلق):** \`${failedCount}\` عضو\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
                  : `📡 **جاري الإرسال التلقائي...**\n` +
                  `📊 **نسبة الإنجاز:** ${createProgressBar(i + 1, total, 16)}\n` +
                  `• 🎯 **المستهدفون:** \`${total}\` عضو | ✅ **نجاح:** \`${successCount}\` | ❌ **فشل:** \`${failedCount}\`\n` +
                  `• 🔄 **جاري المراسلة:** ${targetUser}\n` +
                  `──────────────────────────────`,
                embeds: [embedToSend]
              });
            } catch (e) { }
          }

          if (total > 5) {
            await new Promise(res => setTimeout(res, 120));
          }
        }

        if (interaction.client.embedCache) {
          interaction.client.embedCache.delete(cacheKey);
        }

        return;
      }
    }

    // 3. Handle Button Interactions
    if (interaction.isButton()) {
      const { customId, guild, user } = interaction;
      // --- Daily Quest Buttons ---
      if (interaction.customId.startsWith('claim_quest_')) {
        const questId = interaction.customId.replace('claim_quest_', '');
        const res = claimQuestReward(interaction.user.id, questId);

        if (res.success) {
          return interaction.reply({
            embeds: [
              successEmbed(
                'تم استلام مكافأة المهمة 🎁',
                `مبروك! تم استكمال المهمة **"${res.quest.title}"** بنجاح!\n` +
                `• 📈 **الخبرة المكتسبة:** \`+${res.quest.rewardXp} XP\`\n` +
                `• 🪙 **العملات المكتسبة:** \`+${res.quest.rewardCoins} Coins\``
              )
            ],
            ephemeral: true
          });
        } else {
          return interaction.reply({
            embeds: [errorEmbed('خطأ', res.error)],
            ephemeral: true
          });
        }
      }

      // --- 5 Dedicated Music Bots Buttons ---
      if (customId.startsWith('summon_bot_')) {
        const botId = customId.replace('summon_bot_', '');
        const voiceChannel = interaction.member.voice?.channel;
        if (!voiceChannel) {
          return interaction.reply({
            embeds: [errorEmbed('خطأ', 'يجب أن تكون متصلاً بروم صوتي أولاً لسحب البوت إليك!')],
            ephemeral: true
          });
        }
        const res = await summonBotToChannel(botId, voiceChannel);
        if (res.needInvite) {
          const inviteBtn = new ButtonBuilder()
            .setLabel(`إضافة البوت الفرعي #${botId} للسيرفر 🔗`)
            .setURL(res.inviteUrl)
            .setStyle(ButtonStyle.Link);
          const row = new ActionRowBuilder().addComponents(inviteBtn);
          return interaction.reply({
            embeds: [errorEmbed('البوت غير مضاف للسيرفر', res.error)],
            components: [row],
            ephemeral: true
          });
        }
        return interaction.reply({
          embeds: [res.success ? successEmbed('سحب بوت موسيقي 🔊', res.message) : errorEmbed('خطأ', res.error)]
        });
      }

      if (customId === 'dismiss_all_bots') {
        const { destroyAllGuildQueues } = require('../services/musicService');
        destroyAllGuildQueues(guild.id);
        fiveBots.forEach(b => dismissBotFromChannel(b.id, guild.id));
        return interaction.reply({
          embeds: [successEmbed('فصل وإيقاف جميع البوتات 👋', 'تم إيقاف تشغيل الموسيقى وإخراج وفصل جميع البوتات الصوتية من الرومات.')]
        });
      }

      // --- Ticket System Buttons ---
      const settings = getGuildSettings(guild.id) || {};

      // Button: Create Ticket
      if (customId === 'create_ticket') {
        await interaction.deferReply({ ephemeral: true });

        const existingChannel = guild.channels.cache.find(
          c => c.name === `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`
        );

        if (existingChannel) {
          return interaction.editReply({
            embeds: [errorEmbed('تنبيه', `لديك تذكرة مفتوحة بالفعل في القناة: ${existingChannel}`)]
          });
        }

        try {
          const permissionOverwrites = [
            {
              id: guild.roles.everyone.id,
              deny: [PermissionFlagsBits.ViewChannel]
            },
            {
              id: user.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.AttachFiles
              ]
            },
            {
              id: guild.members.me.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.EmbedLinks
              ]
            }
          ];

          if (settings.ticket_support_role) {
            permissionOverwrites.push({
              id: settings.ticket_support_role,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory
              ]
            });
          }

          const channelName = `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
          const ticketChannel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: settings.ticket_category || null,
            permissionOverwrites
          });

          createTicketRecord(guild.id, ticketChannel.id, user.id);

          // Advanced Ticket Controls Embed
          const ticketEmbed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setTitle(`🎫 تذكرة الدعم الفني | ${user.username}`)
            .setDescription(
              `أهلاً بك ${user} في تذكرتك الخاصة لدى **${guild.name}**!\n\n` +
              'يرجى توضيح مشكلتك أو استفسارك بالتفصيل، وسيقوم فريق الدعم الفني بالرد عليك في أقرب وقت.\n\n' +
              '📌 **أزرار التحكم بالتذكرة الأدنى:**\n' +
              '• 🙋‍♂️ **استلام التذكرة:** لتولي الإداري مسؤولية التذكرة.\n' +
              '• 🔒 **إغلاق التذكرة:** تعشيق القناة وإغلاق الكتابة.\n' +
              '• 🔔 **تذكير صاحب التذكرة:** إرسال تنبيه في الخاص مع صورة السيرفر.\n' +
              '• 🏷️ **تغيير الاسم:** تعديل اسم قناة التذكرة.\n' +
              '• 👤 **إضافة عضو:** منح عضو إضافي صلاحية التذكرة.\n' +
              '• 🗑️ **حذف التذكرة:** حذف القناة نهائياً.'
            )
            .setFooter({ text: `${guild.name} • Advanced Ticket System` })
            .setTimestamp();

          // Action Buttons Row 1 (Max 5 per row)
          const claimBtn = new ButtonBuilder()
            .setCustomId('claim_ticket')
            .setLabel('استلام التذكرة 🙋‍♂️')
            .setStyle(ButtonStyle.Success);

          const closeBtn = new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('إغلاق التذكرة 🔒')
            .setStyle(ButtonStyle.Secondary);

          const pingBtn = new ButtonBuilder()
            .setCustomId('ping_ticket_opener')
            .setLabel('تذكير صاحب التذكرة 🔔')
            .setStyle(ButtonStyle.Primary);

          const renameBtn = new ButtonBuilder()
            .setCustomId('rename_ticket_btn')
            .setLabel('تغيير الاسم 🏷️')
            .setStyle(ButtonStyle.Primary);

          const deleteBtn = new ButtonBuilder()
            .setCustomId('delete_ticket')
            .setLabel('حذف التذكرة 🗑️')
            .setStyle(ButtonStyle.Danger);

          // Action Buttons Row 2
          const addMemberBtn = new ButtonBuilder()
            .setCustomId('add_member_ticket_btn')
            .setLabel('إضافة عضو 👤')
            .setStyle(ButtonStyle.Secondary);

          const actionRow1 = new ActionRowBuilder().addComponents(claimBtn, closeBtn, pingBtn, renameBtn, deleteBtn);
          const actionRow2 = new ActionRowBuilder().addComponents(addMemberBtn);

          await ticketChannel.send({
            content: `${user} ${settings.ticket_support_role ? `<@&${settings.ticket_support_role}>` : ''}`,
            embeds: [ticketEmbed],
            components: [actionRow1, actionRow2]
          });

          // Send AI Auto-Responder Embed before human support arrives
          const { generateTicketResponse } = require('../services/aiService');
          const aiReplyEmbed = await generateTicketResponse('', 'General');
          await ticketChannel.send({ embeds: [aiReplyEmbed] }).catch(() => { });

          await interaction.editReply({
            embeds: [successEmbed('تم فتح التذكرة 🎫', `تم إنشاء تذكرتك بنجاح في القناة: ${ticketChannel}`)]
          });
        } catch (error) {
          console.error('Error creating ticket channel:', error);
          await interaction.editReply({
            embeds: [errorEmbed('خطأ', 'تعذر إنشاء قناة التذكرة، يرجى التأكد من صلاحيات البوت.')]
          });
        }
        return;
      }

      // Button: Ping Ticket Opener Reminder
      if (customId === 'ping_ticket_opener') {
        const ticketRecord = getTicketByChannel(interaction.channel.id);
        if (!ticketRecord) {
          return interaction.reply({ embeds: [errorEmbed('خطأ', 'هذه القناة ليست تذكرة مسجلة.')], ephemeral: true });
        }

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
              ? `تم إرسال إشعار تذكير أنيق في الخاص مع صورة السيرفر إلى <@${ticketRecord.user_id}> بنجاح.`
              : `تعذر إرسال التذكير في الخاص (الحساب مغلق)، وتم عمل منشن له في القناة: <@${ticketRecord.user_id}>.`
          );

          await interaction.reply({
            content: !dmSuccess ? `🔔 تنبيه <@${ticketRecord.user_id}>! يرجى المتابعة.` : undefined,
            embeds: [replyEmbed]
          });
        } catch (error) {
          console.error('Error sending ticket reminder:', error);
          await interaction.reply({ embeds: [errorEmbed('خطأ', 'تعذر إرسال التذكير.')], ephemeral: true });
        }
        return;
      }

      // Button: Claim Ticket
      if (customId === 'claim_ticket') {
        const ticketRecord = getTicketByChannel(interaction.channel.id);
        if (!ticketRecord) {
          return interaction.reply({ embeds: [errorEmbed('خطأ', 'هذه القناة ليست تذكرة مسجلة.')], ephemeral: true });
        }

        if (ticketRecord.claimed_by) {
          return interaction.reply({
            embeds: [errorEmbed('تنبيه', `هذه التذكرة مستلمة بالفعل بواسطة المشرف <@${ticketRecord.claimed_by}>.`)],
            ephemeral: true
          });
        }

        claimTicketRecord(interaction.channel.id, user.id);

        const claimEmbed = successEmbed(
          'تم استلام التذكرة 🙋‍♂️',
          `قام المشرف ${user} باستلام التذكرة والبدء في تقديم الدعم الفني.`
        );

        await interaction.reply({ embeds: [claimEmbed] });
        return;
      }

      // Button: Rename Ticket Modal Prompt
      if (customId === 'rename_ticket_btn') {
        const modal = new ModalBuilder()
          .setCustomId('ticket_rename_modal')
          .setTitle('تغيير اسم التذكرة');

        const nameInput = new TextInputBuilder()
          .setCustomId('ticket_new_name_input')
          .setLabel('اسم التذكرة الجديد')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('مثال: ticket-resolved')
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(nameInput));
        await interaction.showModal(modal);
        return;
      }

      // Button: Add Member to Ticket Select Menu Prompt
      if (customId === 'add_member_ticket_btn') {
        const userSelect = new UserSelectMenuBuilder()
          .setCustomId('ticket_user_add_select')
          .setPlaceholder('اختر العضو المراد إضافته لهذه التذكرة...')
          .setMinValues(1)
          .setMaxValues(5);

        const row = new ActionRowBuilder().addComponents(userSelect);
        await interaction.reply({
          content: '👤 **يرجى اختيار العضو المراد إضافته لقناة التذكرة:**',
          components: [row],
          ephemeral: true
        });
        return;
      }

      // Button: Close Ticket
      if (customId === 'close_ticket') {
        const ticketRecord = getTicketByChannel(interaction.channel.id);
        if (!ticketRecord) {
          return interaction.reply({ embeds: [errorEmbed('خطأ', 'هذه القناة ليست تذكرة مسجلة.')], ephemeral: true });
        }

        try {
          updateTicketStatus(interaction.channel.id, 'CLOSED');
          await interaction.channel.permissionOverwrites.edit(ticketRecord.user_id, {
            SendMessages: false
          });

          const reopenBtn = new ButtonBuilder()
            .setCustomId('reopen_ticket')
            .setLabel('إعادة فتح التذكرة 🔓')
            .setStyle(ButtonStyle.Success);

          const deleteBtn = new ButtonBuilder()
            .setCustomId('delete_ticket')
            .setLabel('حذف التذكرة 🗑️')
            .setStyle(ButtonStyle.Danger);

          const closedEmbed = infoEmbed(
            'تم إغلاق التذكرة 🔒',
            `تم إغلاق التذكرة بواسطة ${user}. تمت إزالة صلاحية الكتابة عن صاحبة التذكرة.`
          );

          await interaction.reply({
            embeds: [closedEmbed],
            components: [new ActionRowBuilder().addComponents(reopenBtn, deleteBtn)]
          });
        } catch (error) {
          console.error('Error closing ticket:', error);
          await interaction.reply({ embeds: [errorEmbed('خطأ', 'حدث خطأ أثناء إغلاق التذكرة.')], ephemeral: true });
        }
        return;
      }

      // Button: Reopen Ticket
      if (customId === 'reopen_ticket') {
        const ticketRecord = getTicketByChannel(interaction.channel.id);
        if (!ticketRecord) return;

        try {
          updateTicketStatus(interaction.channel.id, 'OPEN');
          await interaction.channel.permissionOverwrites.edit(ticketRecord.user_id, {
            SendMessages: true
          });

          const reopenedEmbed = successEmbed(
            'تم إعادة فتح التذكرة 🔓',
            `تمت إعادة فتح التذكرة بواسطة ${user}. تمت استعادة صلاحية الكتابة لصاحب التذكرة.`
          );

          await interaction.reply({ embeds: [reopenedEmbed] });
        } catch (error) {
          console.error('Error reopening ticket:', error);
          await interaction.reply({ embeds: [errorEmbed('خطأ', 'تعذر إعادة فتح التذكرة.')], ephemeral: true });
        }
        return;
      }

      // Button: Delete Ticket
      if (customId === 'delete_ticket') {
        try {
          await interaction.reply({
            embeds: [warningEmbed('حذف التذكرة 🗑️', 'سيتم حذف قناة التذكرة نهائيًا خلال 5 ثوانٍ...')]
          });

          setTimeout(async () => {
            try {
              await interaction.channel.delete();
            } catch (e) {
              console.error('Error deleting ticket channel:', e);
            }
          }, 5000);
        } catch (error) {
          console.error('Error initiating delete ticket:', error);
        }
        return;
      }

      // --- Interactive Music Player Buttons ---
      const { getQueue, playSong, stopQueue, destroyQueue } = require('../services/musicService');
      const { AudioPlayerStatus } = require('@discordjs/voice');

      if (customId.startsWith('music_')) {
        if (customId === 'music_play_btn') {
          const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
          const modal = new ModalBuilder()
            .setCustomId('music_play_modal')
            .setTitle('🎵 تشغيل أغنية بالروم الصوتي');

          const input = new TextInputBuilder()
            .setCustomId('song_query')
            .setLabel('ادخل اسم الأغنية أو رابط من YouTube / Spotify')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('مثال: سورة الكهف أو Imagine Dragons')
            .setRequired(true);

          modal.addComponents(new ActionRowBuilder().addComponents(input));
          return interaction.showModal(modal);
        }

        const voiceChannelId = interaction.member.voice?.channel?.id;
        const queue = getQueue(interaction.guild.id, voiceChannelId);
        if (!queue && customId !== 'music_stop') {
          return interaction.reply({ embeds: [errorEmbed('خطأ', 'لا توجد جلسة تشغيل موسيقى نشطة في هذا الروم الصوتي.')], ephemeral: true });
        }

        if (customId === 'music_pause_resume') {
          if (queue.player.state.status === AudioPlayerStatus.Paused) {
            queue.player.unpause();
            await interaction.reply({ embeds: [successEmbed('استئناف ▶️', 'تم استئناف تشغيل الأغنية.')], ephemeral: true });
          } else {
            queue.player.pause();
            await interaction.reply({ embeds: [successEmbed('إيقاف مؤقت ⏸️', 'تم إيقاف الأغنية مؤقتاً.')], ephemeral: true });
          }
          return;
        }

        if (customId === 'music_skip') {
          if (queue.songs.length > 0) {
            const nextSong = queue.songs.shift();
            playSong(interaction.guild.id, nextSong, queue.voiceChannelId);
            await interaction.reply({ embeds: [successEmbed('تخطي ⏭️', 'تم تخطي الأغنية والانتقال للتالية.')], ephemeral: true });
          } else {
            stopQueue(interaction.guild.id, queue.voiceChannelId);
            await interaction.reply({ embeds: [successEmbed('تخطي ⏭️', 'تم تخطي الأغنية. القائمة فارغة.')], ephemeral: true });
          }
          return;
        }

        if (customId === 'music_previous') {
          if (!queue || !queue.history || queue.history.length === 0) {
            return interaction.reply({ embeds: [errorEmbed('خطأ', 'لا توجد أغنية سابقة في السجل.')], ephemeral: true });
          }
          const prevTrack = queue.history.pop();
          if (queue.currentSong) queue.songs.unshift(queue.currentSong);
          playSong(interaction.guild.id, prevTrack, queue.voiceChannelId);
          return interaction.reply({ embeds: [successEmbed('الأغنية السابقة ⏮️', `جاري تشغيل: **${prevTrack.title}**`)], ephemeral: true });
        }

        if (customId === 'music_queue_btn') {
          if (!queue) {
            return interaction.reply({ embeds: [errorEmbed('خطأ', 'لا توجد قائمة انتظار نشطة.')], ephemeral: true });
          }
          const listText = queue.songs.length === 0
            ? 'لا توجد أغاني قادمة بالانتظار.'
            : queue.songs.slice(0, 10).map((s, idx) => `**#${idx + 1}.** [${s.title}](${s.url}) (\`${s.duration}\`)`).join('\n');

          const qEmbed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setTitle(`📜 قائمة الانتظار الحالية (${queue.songs.length} أغنية)`)
            .setDescription(`### 🎵 الجارية حالياً:\n[${queue.currentSong?.title || 'لا شيء'}](${queue.currentSong?.url || ''})\n\n### 🎼 القادمة:\n${listText}`)
            .setFooter({ text: `الروم: ${queue.voiceChannel.name} • البوت: ${queue.activeSubBotName}` });

          return interaction.reply({ embeds: [qEmbed], ephemeral: true });
        }

        if (customId === 'music_favorite_btn') {
          if (!queue || !queue.currentSong) {
            return interaction.reply({ embeds: [errorEmbed('خطأ', 'لا توجد أغنية جارية لحفظها بالفيفرت.')], ephemeral: true });
          }
          return interaction.reply({ embeds: [successEmbed('المفضلة ❤️', `تمت إضافة **"${queue.currentSong.title}"** إلى مفضلتك الشخصية بنجاح!`)], ephemeral: true });
        }

        if (customId === 'music_lyrics_btn') {
          if (!queue || !queue.currentSong) {
            return interaction.reply({ embeds: [errorEmbed('خطأ', 'لا توجد أغنية جارية لعرض كلماتها.')], ephemeral: true });
          }
          return interaction.reply({ embeds: [infoEmbed('🎤 كلمات الأغنية', `جاري البحث عن كلمات الأغنية **"${queue.currentSong.title}"**...`)], ephemeral: true });
        }

        if (customId === 'music_loop') {
          if (queue.loopMode === 'off') queue.loopMode = 'track';
          else if (queue.loopMode === 'track') queue.loopMode = 'queue';
          else queue.loopMode = 'off';

          await interaction.reply({
            embeds: [successEmbed('تكرار 🔁', `وضع التكرار الحالي: **${queue.loopMode.toUpperCase()}**`)],
            ephemeral: true
          });
          return;
        }

        if (customId === 'music_shuffle') {
          if (queue.songs.length === 0) {
            return interaction.reply({ embeds: [errorEmbed('خطأ', 'لا توجد أغاني في الانتظار لخلطها.')], ephemeral: true });
          }
          for (let i = queue.songs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [queue.songs[i], queue.songs[j]] = [queue.songs[j], queue.songs[i]];
          }
          await interaction.reply({ embeds: [successEmbed('خلط 🔀', 'تم خلط الأغاني القادمة بنجاح!')], ephemeral: true });
          return;
        }

        if (customId === 'music_stop') {
          destroyQueue(interaction.guild.id, queue.voiceChannelId);
          await interaction.reply({ embeds: [successEmbed('إيقاف ⏹️', 'تم إيقاف المشغل ومغادرة القناة الصوتية.')], ephemeral: true });
          return;
        }
      }
    }
  }
};
