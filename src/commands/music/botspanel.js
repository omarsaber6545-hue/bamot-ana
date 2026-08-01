const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { getFiveBotsStatus } = require('../../services/fiveBotOrchestrator');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('botspanel')
    .setDescription('لوحة التحكم التفاعلية الشاملة للموسيقى والبوتات الخمسة بالأزرار')
    .setDMPermission(false),

  async execute(interaction) {
    const list = getFiveBotsStatus();

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('🎛️ لوحة التحكم التفاعلية الشاملة للموسيقى (Music Master Control Panel)')
      .setDescription(
        'يمكنك التحكم التام في تشغيل الموسيقى، الفلاتر، ومستوى الصوت، وسحب البوتات الخمسة المخصصة مباشرة من هذه الرسالة التفاعلية:\n\n' +
        list.map(b => {
          const badge = b.status === 'IN_VOICE' || b.status === 'CONNECTED' ? '🟢 متصل بالروم' : '⚪ غير متصل (خامل)';
          return `### ${b.name} (${badge})\n` +
            `• 🔊 **الروم الصوتي:** \`${b.voiceChannel}\` | 🎵 **الأغنية:** \`${b.currentSong}\``;
        }).join('\n\n')
      )
      .setFooter({ text: `${interaction.guild.name} • 5 Dedicated Music Bots Master Panel` })
      .setTimestamp();

    // Row 1: Summon Sub-Bots Buttons
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('summon_bot_1').setLabel('سحب بوت #1 🔊').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('summon_bot_2').setLabel('سحب بوت #2 🔊').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('summon_bot_3').setLabel('سحب بوت #3 🔊').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('summon_bot_4').setLabel('سحب بوت #4 🔊').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('summon_bot_5').setLabel('سحب بوت #5 🔊').setStyle(ButtonStyle.Primary)
    );

    // Row 2: Playback Controls Buttons
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('music_pause_resume').setLabel('إيقاف / استئناف ⏯️').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('music_skip').setLabel('تخطي ⏭️').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('music_loop').setLabel('تكرار 🔁').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('music_shuffle').setLabel('خلط 🔀').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('dismiss_all_bots').setLabel('فصل وإيقاف الجميع ⏹️').setStyle(ButtonStyle.Danger)
    );

    // Row 3: Audio Filter Select Menu
    const filterMenu = new StringSelectMenuBuilder()
      .setCustomId('music_filter_select')
      .setPlaceholder('🎚️ اختر فلتر الصوت المطلوبة...')
      .addOptions([
        { label: 'إيقاف الفلاتر (Clean / Normal)', value: 'none', emoji: '⚙️' },
        { label: '🔊 مضخم الصوت (Bassboost)', value: 'bassboost', description: 'تضخيم البيس والترددات المنخفضة' },
        { label: '⚡ تسريع حاد (Nightcore)', value: 'nightcore', description: 'تسريع الصوت ونغمة حادة' },
        { label: '🌊 تبطيل ريترو (Vaporwave)', value: 'vaporwave', description: 'تبطيل السرعة بطابع كلاسيكي' }
      ]);

    const row3 = new ActionRowBuilder().addComponents(filterMenu);

    // Row 4: Volume Control Select Menu
    const volumeMenu = new StringSelectMenuBuilder()
      .setCustomId('music_volume_select')
      .setPlaceholder('🔊 اختر مستوى الصوت المطلوبة...')
      .addOptions([
        { label: 'مستوى الصوت: 25%', value: '25', emoji: '🔈' },
        { label: 'مستوى الصوت: 50%', value: '50', emoji: '🔉' },
        { label: 'مستوى الصوت: 75%', value: '75', emoji: '🔊' },
        { label: 'مستوى الصوت: 100% (أقصى شدة)', value: '100', emoji: '📢' }
      ]);

    const row4 = new ActionRowBuilder().addComponents(volumeMenu);

    await interaction.reply({ embeds: [embed], components: [row1, row2, row3, row4] });
  }
};
