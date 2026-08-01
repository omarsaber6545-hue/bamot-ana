const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const quranVoiceService = require('../services/quranVoiceService');
const config = require('../config');

const choices = config.quranRadioStreams.slice(0, 10).map((s, index) => ({
  name: s.name,
  value: index
}));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('voice_quran')
    .setDescription('إدارة بث القرآن الكريم المباشر 24/7 في روم الفويس')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('join')
        .setDescription('ربط البوت بروم فويس وتشغيل بث القرآن الكريم 24/7')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('روم الفويس المراد تشغيل القرآن فيها')
            .addChannelTypes(ChannelType.GuildVoice)
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('station')
            .setDescription('اختر إذاعة القرآن الكريم')
            .setRequired(false)
            .addChoices(...choices)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('leave')
        .setDescription('مغادرة روم الفويس وإيقاف بث القرآن')
    ),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'leave') {
      const left = quranVoiceService.leaveVoice(interaction.guildId);
      if (left) {
        return interaction.reply({ content: '✅ تم خروج البوت من روم الفويس وإيقاف البث المباشر.', ephemeral: true });
      } else {
        return interaction.reply({ content: '⚠️ البوت غير متصل بأي روم فويس حالياً.', ephemeral: true });
      }
    }

    if (subcommand === 'join') {
      const channel = interaction.options.getChannel('channel');
      const stationIndex = interaction.options.getInteger('station') ?? 0;
      const station = config.quranRadioStreams[stationIndex] || config.quranRadioStreams[0];

      await interaction.deferReply();

      const success = await quranVoiceService.joinAndPlayQuran(client, interaction.guildId, channel.id, stationIndex);
      if (success) {
        const embed = new EmbedBuilder()
          .setColor(config.colors.gold)
          .setTitle('🔊 تم بدء بث القرآن الكريم 24/7 المباشر بنجاح')
          .setDescription(`> 📻 **الإذاعة الشغالة:** ${station.name}\n> 🎙️ **روم الفويس:** <#${channel.id}>\n\nسيعمل البث بشكل مستمر بدون توقف على مدار الساعة.`)
          .setFooter({ text: config.footerText });

        return interaction.editReply({ embeds: [embed] });
      } else {
        return interaction.editReply({ content: `❌ تعذر الانضمام إلى <#${channel.id}>. يرجى التأكد من صلاحيات البوت (Connect & Speak).` });
      }
    }
  }
};
