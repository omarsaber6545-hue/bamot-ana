const { SlashCommandBuilder } = require('discord.js');
const { getQueue, createGuildQueue, searchTracks, playSong } = require('../../services/musicService');
const { successEmbed, errorEmbed, infoEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('تشغيل أغنية أو قائمة من يوتيوب أو سبوتيفاي بالروم الصوتي مع لوحة التحكم الأوتوماتيكية')
    .setDMPermission(false)
    .addStringOption(option =>
      option
        .setName('query')
        .setDescription('اسم الأغنية أو رابط من YouTube / Spotify')
        .setRequired(true)
    ),

  async execute(interaction) {
    console.log("1");

    let voiceChannel = interaction.member.voice?.channel;
    console.log("2");

    if (!voiceChannel) {
      console.log("3");
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
    console.log("4");
    if (!permissions.has('Connect') || !permissions.has('Speak')) {
      return interaction.reply({
        embeds: [errorEmbed('خطأ في الصلاحيات', 'لا يمتلك البوت صلاحية الانضمام (Connect) أو التحدث (Speak) في قناتك الصوتية.')],
        ephemeral: true
      });
    }

    await interaction.deferReply();
    console.log("5");

    const query = interaction.options.getString('query');
    console.log("6");

    const tracks = await searchTracks(query);
    console.log("7");

    if (!tracks || tracks.length === 0) {
      return interaction.editReply({
        embeds: [errorEmbed('لم يتم العثور على نتائج', `عذراً، لم نتمكن من العثور على نتائج لـ: \`${query}\`.`)]
      });
    }

    const track = {
      ...tracks[0],
      requestedBy: interaction.user.tag
    };
    console.log("8");

    let queue = getQueue(interaction.guild.id, voiceChannel.id);
    console.log("9");

    if (!queue) {
      console.log("10");
      try {
        queue = await createGuildQueue(
          interaction.guild.id,
          voiceChannel,
          interaction.channel
        );
        console.log("11");
      } catch (err) {
        console.error(err);
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

    console.log("12");

    if (queue.isPlaying) {
      console.log("13");
      queue.songs.push(track);
      return interaction.editReply({
        embeds: [
          successEmbed(
            'تمت الإضافة لقائمة الانتظار 🎵',
            `• **الأغنية:** [${track.title}](${track.url})\n• **الروم الصوتي:** <#${voiceChannel.id}>\n• **البوت المشغل:** \`${queue.activeSubBotName}\`\n• **الترتيب بالقائمة:** \`#${queue.songs.length}\``
          )
        ]
      });
    }

    console.log("14");

    await interaction.editReply({
      embeds: [
        infoEmbed(
          'جاري الانضمام والتشغيل 🎧',
          `• **الأغنية:** [${track.title}](${track.url})\n• **الروم الصوتي:** <#${voiceChannel.id}>\n• **البوت المشغل:** \`${queue.activeSubBotName}\``
        )
      ]
    });

    console.log("15");

    await playSong(interaction.guild.id, track, voiceChannel.id);

    console.log("16");
  }
};
