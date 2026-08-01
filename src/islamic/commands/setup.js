const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const db = require('../database');
const config = require('../config');
const quranVoiceService = require('../services/quranVoiceService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('إعداد قنوات الأذكار ومواقيت الصلاة وروم الفويس المباشر للقرآن الكريم 24/7')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option.setName('prayer_channel')
        .setDescription('قناة إشعارات وتنبيهات أوقات الصلاة والتنبيه قبلها بـ 30 دقيقة')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addChannelOption(option =>
      option.setName('azkar_channel')
        .setDescription('قناة إرسال الأذكار والآيات والأحاديث الدورية كل 5 دقائق')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addChannelOption(option =>
      option.setName('voice_quran_channel')
        .setDescription('روم الفويس للبث المباشر للقرآن الكريم 24/7 بدون توقف')
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(false)
    )
    .addRoleOption(option =>
      option.setName('role_mention')
        .setDescription('الرول التي يتم عمل منشن لها عند دخول وقت الصلاة والتنبيه')
        .setRequired(false)
    ),

  async execute(interaction, client) {
    const prayerChannel = interaction.options.getChannel('prayer_channel');
    const azkarChannel = interaction.options.getChannel('azkar_channel');
    const voiceQuranChannel = interaction.options.getChannel('voice_quran_channel');
    const roleMention = interaction.options.getRole('role_mention');

    const updates = {};
    if (prayerChannel) updates.prayer_channel_id = prayerChannel.id;
    if (azkarChannel) updates.azkar_channel_id = azkarChannel.id;
    if (voiceQuranChannel) updates.voice_channel_id = voiceQuranChannel.id;
    if (roleMention) updates.role_id = roleMention.id;

    if (Object.keys(updates).length === 0) {
      const current = db.getGuild(interaction.guildId);
      const embed = new EmbedBuilder()
        .setColor(config.colors.info)
        .setTitle('⚙️ إعدادات البوت الإسلامي الحالية')
        .addFields(
          { name: '🕌 قناة الصلاة', value: current.prayer_channel_id ? `<#${current.prayer_channel_id}>` : 'غير محددة', inline: true },
          { name: '📿 قناة الأذكار', value: current.azkar_channel_id ? `<#${current.azkar_channel_id}>` : 'غير محددة', inline: true },
          { name: '🔊 روم فويس القرآن 24/7', value: current.voice_channel_id ? `<#${current.voice_channel_id}>` : 'غير محددة', inline: true },
          { name: '🏷️ رول المنشن', value: current.role_id ? `<@&${current.role_id}>` : 'بدون منشن', inline: true }
        )
        .setFooter({ text: 'استخدم /setup مع تحديد الخيارات لضبط القنوات' });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    db.updateGuild(interaction.guildId, updates);

    // If voice channel was set, start 24/7 Quran Voice streaming immediately!
    let voiceStatusMsg = '';
    if (voiceQuranChannel) {
      const success = await quranVoiceService.joinAndPlayQuran(client, interaction.guildId, voiceQuranChannel.id);
      voiceStatusMsg = success 
        ? `\n✅ **تم دخول روم الفويس (${voiceQuranChannel.name}) وبدء بث القرآن الكريم 24/7 بنجاح!**`
        : `\n⚠️ **تعذر دخول روم الفويس (${voiceQuranChannel.name})، يرجى التأكد من صلاحيات البوت (Connect & Speak).**`;
    }

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('✅ تم تحديث إعدادات البوت الإسلامي بنجاح')
      .setDescription(`تم حفظ التفضيلات بنجاح للسيرفر.${voiceStatusMsg}`)
      .addFields(
        { name: '🕌 قناة الصلاة', value: prayerChannel ? `<#${prayerChannel.id}>` : 'لم تتغير', inline: true },
        { name: '📿 قناة الأذكار', value: azkarChannel ? `<#${azkarChannel.id}>` : 'لم تتغير', inline: true },
        { name: '🔊 روم الفويس 24/7', value: voiceQuranChannel ? `<#${voiceQuranChannel.id}>` : 'لم تتغير', inline: true }
      )
      .setFooter({ text: config.footerText });

    return interaction.reply({ embeds: [embed] });
  }
};
