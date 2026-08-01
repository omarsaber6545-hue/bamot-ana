const { SlashCommandBuilder } = require('discord.js');
const { getQueue, createGuildQueue, searchTracks, playSong } = require('../../services/musicService');
const { successEmbed, errorEmbed, infoEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('syncplay')
    .setDescription('تشغيل متزامن للأغنية في وقت واحد على بوتين أو أكثر بالروم الصوتي 🎧')
    .setDMPermission(false)
    .addStringOption(option =>
      option
        .setName('query')
        .setDescription('اسم الأغنية أو رابط من YouTube / Spotify')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('bots')
        .setDescription('عدد البوتات المراد سحبها وتشغيل الموسيقى عليها بنفس الوقت (من 2 إلى 5)')
        .setRequired(false)
        .setMinValue(2)
        .setMaxValue(5)
    ),

  async execute(interaction) {
    let voiceChannel = interaction.member.voice?.channel;
    if (!voiceChannel) {
      const fetchedMember = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
      voiceChannel = fetchedMember?.voice?.channel;
    }

    if (!voiceChannel) {
      return interaction.reply({
        embeds: [errorEmbed('خطأ في الصوت', 'يجب أن تكون متواصلاً في قناة صوتية أولاً لتشغيل الموسيقى!')],
        ephemeral: true
      });
    }

    const permissions = voiceChannel.permissionsFor(interaction.client.user);
    if (!permissions.has('Connect') || !permissions.has('Speak')) {
      return interaction.reply({
        embeds: [errorEmbed('خطأ في الصلاحيات', 'لا يمتلك البوت صلاحية الانضمام (Connect) أو التحدث (Speak) في قناتك الصوتية.')],
        ephemeral: true
      });
    }

    await interaction.deferReply();
    const query = interaction.options.getString('query');
    const botCount = interaction.options.getInteger('bots') || 2;

    // Search for track
    const tracks = await searchTracks(query);
    if (!tracks || tracks.length === 0) {
      return interaction.editReply({
        embeds: [errorEmbed('لم يتم العثور على نتائج', `عذراً، لم نتمكن من العثور على نتائج لـ: \`${query}\`.`)]
      });
    }

    const track = {
      ...tracks[0],
      requestedBy: interaction.user.tag
    };

    let queue = getQueue(interaction.guild.id, voiceChannel.id);
    if (!queue) {
      try {
        queue = await createGuildQueue(
          interaction.guild.id,
          voiceChannel,
          interaction.channel,
          botCount
        );
      } catch (err) {
        return interaction.editReply({
          embeds: [
            errorEmbed(
              'جميع البوتات مشغولة',
              err.message || 'جميع البوتات الموسيقية مشغولة حالياً في رومات أخرى.'
            )
          ]
        });
      }
    }

    if (queue.isPlaying) {
      queue.songs.push(track);
      return interaction.editReply({
        embeds: [
          successEmbed(
            'تمت الإضافة لقائمة الانتظار المتزامنة 🎵',
            `• **الأغنية:** [${track.title}](${track.url})\n• **الروم الصوتي:** <#${voiceChannel.id}>\n• **البوتات المشغلة:** \`${queue.activeSubBotName}\`\n• **الترتيب بالقائمة:** \`#${queue.songs.length}\``
          )
        ]
      });
    }

    await interaction.editReply({
      embeds: [
        infoEmbed(
          'جاري الانضمام والتشغيل المتزامن 🎧',
          `• **الأغنية:** [${track.title}](${track.url})\n• **الروم الصوتي:** <#${voiceChannel.id}>\n• **البوتات المشغلة:** \`${queue.activeSubBotName}\``
        )
      ]
    });

    await playSong(interaction.guild.id, track, voiceChannel.id);
  }
};
