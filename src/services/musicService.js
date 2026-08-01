const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, entersState, StreamType } = require('@discordjs/voice');
const ytSearch = require('yt-search');
const youtubedl = require('youtube-dl-exec');
const ffmpegPath = require('ffmpeg-static');
const { spawn } = require('child_process');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config/config');
const { getOrCreateSession, getSession, destroySession } = require('./sessionManager');
const {
  summonBotToChannel,
  summonMultipleBotsToChannel,
  getBotsInChannel,
  dismissBotFromChannel
} = require('./fiveBotOrchestrator');
// In-memory Music Queue Map (Keyed by `${guildId}_${voiceChannelId}`)
const queues = new Map();

function getQueue(guildId, voiceChannelId) {
  if (!voiceChannelId) return null;

  const key = `${guildId}_${voiceChannelId}`;
  return queues.get(key) || null;
}
async function createGuildQueue(guildId, voiceChannel, textChannel, botCount = 1) {
  const queueKey = `${guildId}_${voiceChannel.id}`;
  const player = createAudioPlayer();

  if (botCount > 1) {
    await summonMultipleBotsToChannel(voiceChannel, botCount);
  }

  const { session, error } = getOrCreateSession(guildId, voiceChannel, textChannel);
  if (!session) {
    throw new Error(error || 'جميع بوتات الموسيقى مشغولة حالياً.');
  }

  const activeSubBot = session.bot;

  const result = await summonBotToChannel(
    session.bot.id,
    voiceChannel
  );
  if (!result.success) {
    throw new Error(result.error);
  }

  const connection = result.bot.connection;
  await entersState(connection, VoiceConnectionStatus.Ready, 30000);

  // Subscribe primary bot connection and ALL other sub-bots in the channel to the player
  const channelBots = getBotsInChannel(voiceChannel.id);
  if (channelBots.length === 0) {
    connection.subscribe(player);
  } else {
    channelBots.forEach(b => {
      if (b.connection) {
        try {
          b.connection.subscribe(player);
        } catch (e) { }
      }
    });
  }

  function getBotDisplayName(bot) {
    if (!bot) return '🎵 3M Music Bot';
    return (
      bot.client?.user?.tag ||
      bot.user?.tag ||
      (bot.user?.username ? `@${bot.user.username}` : null) ||
      bot.name ||
      `🎵 Music Bot #${bot.id}`
    );
  }

  const botDisplayName = channelBots.length > 1
    ? channelBots.map(b => b.client?.user?.username || b.name).join(' & ')
    : getBotDisplayName(activeSubBot);

  const queueConstruct = {
    key: queueKey,
    guildId,
    voiceChannel,
    voiceChannelId: voiceChannel.id,
    textChannel,
    connection,
    player,
    activeSubBot,
    activeSubBotName: botDisplayName,
    songs: session.songs,
    history: session.history,
    currentSong: null,
    loopMode: session.loopMode, // 'off' | 'track' | 'queue'
    autoplay: session.autoplay,
    volume: session.volume,
    filter: session.filter,
    equalizer: session.equalizer,
    isPlaying: false
  };

  console.log("QUEUE BOT NAME:", queueConstruct.activeSubBotName);

  queues.set(queueKey, queueConstruct);

  // Setup Player Listeners
  player.on(AudioPlayerStatus.Idle, async () => {
    const queue = queues.get(queueKey);
    if (!queue) return;

    if (queue.currentSong) {
      queue.history.push(queue.currentSong);
    }

    if (queue.loopMode === 'track' && queue.currentSong) {
      playSong(guildId, queue.currentSong, voiceChannel.id);
      return;
    }

    if (queue.loopMode === 'queue' && queue.currentSong) {
      queue.songs.push(queue.currentSong);
    }

    if (queue.songs.length > 0) {
      const nextSong = queue.songs.shift();
      playSong(guildId, nextSong, voiceChannel.id);
    } else if (queue.autoplay && queue.currentSong) {
      try {
        const r = await ytSearch(`${queue.currentSong.title} audio`);
        if (r.videos && r.videos.length > 1) {
          const autoTrack = {
            title: r.videos[1].title,
            url: r.videos[1].url,
            duration: r.videos[1].timestamp || 'غير معروف',
            thumbnail: r.videos[1].thumbnail,
            requestedBy: 'التشغيل التلقائي (Autoplay) 🤖',
            source: 'YouTube ▶️'
          };
          playSong(guildId, autoTrack, voiceChannel.id);
          return;
        }
      } catch (e) {
        console.error('Autoplay search error:', e);
      }
      stopQueue(guildId, voiceChannel.id);
    } else {
      stopQueue(guildId, voiceChannel.id);
    }
  });

  player.on('error', error => {
    console.error(`❌ [Audio Player Error] Voice Channel ${voiceChannel.id}:`, error);
    const queue = queues.get(queueKey);
    if (queue && queue.songs.length > 0) {
      const nextSong = queue.songs.shift();
      playSong(guildId, nextSong, voiceChannel.id);
    } else {
      stopQueue(guildId, voiceChannel.id);
    }
  });

  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5000)
      ]);
    } catch (error) {
      destroyQueue(guildId, voiceChannel.id);
    }
  });

  return queueConstruct;
}

// Track Search Handler
async function searchTracks(searchQuery) {
  let sourceLabel = 'YouTube ▶️';

  // 1. Spotify URL Parsing
  if (searchQuery.includes('spotify.com')) {
    sourceLabel = 'Spotify 🎵';
    let urlToFetch = searchQuery;
    if (!urlToFetch.startsWith('http://') && !urlToFetch.startsWith('https://')) {
      urlToFetch = `https://${urlToFetch}`;
    }
    try {
      const res = await fetch(urlToFetch, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      const html = await res.text();
      const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
      const descriptionMatch = html.match(/<meta property="og:description" content="([^"]+)"/);

      if (titleMatch && titleMatch[1]) {
        const songTitle = titleMatch[1];
        const artist = descriptionMatch ? descriptionMatch[1].split('·')[0].trim() : '';
        searchQuery = `${songTitle} ${artist}`.trim();
      }
    } catch (e) {
      console.error('Spotify metadata resolution error:', e);
    }
  }

  // 2. YouTube Search via yt-search
  try {
    const r = await ytSearch(searchQuery);
    if (r.videos && r.videos.length > 0) {
      const topVideo = r.videos[0];
      return [{
        title: topVideo.title,
        url: topVideo.url,
        duration: topVideo.timestamp || 'غير معروف',
        thumbnail: topVideo.thumbnail,
        source: sourceLabel
      }];
    }
  } catch (e) {
    console.error('yt-search error:', e);
  }

  return [];
}

const play = require('play-dl');
const ytdl = require('@distube/ytdl-core');

async function getAudioStreamUrl(songUrl) {
  // Method 1: Try youtube-dl-exec
  try {
    const rawAudioUrl = await youtubedl(songUrl, {
      getUrl: true,
      format: 'bestaudio/best',
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: ['referer:youtube.com', 'user-agent:googlebot']
    });
    const directUrl = rawAudioUrl.trim().split('\n')[0];
    if (directUrl && directUrl.startsWith('http')) {
      console.log('✅ Stream extracted via youtube-dl-exec');
      return directUrl;
    }
  } catch (e) {
    console.warn('⚠️ youtubedl failed, trying play-dl fallback:', e.message);
  }

  // Method 2: Try play-dl
  try {
    const stream = await play.stream(songUrl);
    if (stream && stream.url) {
      console.log('✅ Stream extracted via play-dl');
      return stream.url;
    }
  } catch (e) {
    console.warn('⚠️ play-dl failed, trying ytdl-core fallback:', e.message);
  }

  // Method 3: Try @distube/ytdl-core
  try {
    const info = await ytdl.getInfo(songUrl);
    const format = ytdl.chooseFormat(info.formats, { filter: 'audioonly', quality: 'highestaudio' });
    if (format && format.url) {
      console.log('✅ Stream extracted via ytdl-core');
      return format.url;
    }
  } catch (e) {
    console.warn('⚠️ ytdl-core failed:', e.message);
  }

  throw new Error('تعذر استخراج رابط الصوت من YouTube (تأكد من سيرفر الهوستينج أو حاول مرة أخرى)');
}

async function playSong(guildId, song, voiceChannelId) {
  const queue = getQueue(guildId, voiceChannelId);
  if (!queue) return;

  queue.currentSong = song;
  queue.isPlaying = true;

  try {
    const directUrl = await getAudioStreamUrl(song.url);
    console.log("DIRECT URL:", directUrl);
    const ffmpegArgs = [
      '-reconnect', '1',
      '-reconnect_streamed', '1',
      '-reconnect_delay_max', '5',
      '-i', directUrl,
      '-analyzeduration', '0',
      '-loglevel', '0'
    ];

    // Filter handling
    if (queue.filter === 'bassboost') {
      ffmpegArgs.push('-af', 'equalizer=f=60:width_type=h:width=50:g=10');
    } else if (queue.filter === 'nightcore') {
      ffmpegArgs.push('-af', 'asetrate=48000*1.25,aresample=48000');
    } else if (queue.filter === 'vaporwave') {
      ffmpegArgs.push('-af', 'asetrate=48000*0.8,aresample=48000');
    }

    ffmpegArgs.push('-f', 's16le', '-ar', '48000', '-ac', '2', 'pipe:1');

    let activeFfmpegPath = ffmpegPath;
    const ffmpegProcess = spawn(activeFfmpegPath, ffmpegArgs);

    ffmpegProcess.stderr.on("data", data => {
      console.log("FFMPEG ERROR:", data.toString());
    });

    ffmpegProcess.on("close", code => {
      console.log("FFMPEG EXIT:", code);
    });

    const resource = createAudioResource(ffmpegProcess.stdout, {
      inputType: StreamType.Raw,
      inlineVolume: true
    });
    resource.volume?.setVolume(queue.volume / 100);

    console.log("PLAYER STARTED");
    queue.player.play(resource);
    sendMusicControlPanel(queue, song);
  } catch (error) {
    console.error('Error streaming song:', error);
    if (queue.textChannel) {
      queue.textChannel.send({ content: `❌ **تعذر تشغيل الأغنية:** ${error.message || song.title}` });
    }
    if (queue.songs.length > 0) {
      const nextSong = queue.songs.shift();
      playSong(guildId, nextSong, voiceChannelId);
    } else {
      stopQueue(guildId, voiceChannelId);
    }
  }
}

function sendMusicControlPanel(queue, song) {
  if (!queue.textChannel) return;

  const { StringSelectMenuBuilder } = require('discord.js');

  const embed = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle(`🎵 جاري التشغيل في ${queue.voiceChannel.name} عبر ${queue.activeSubBotName} (${song.source})`)
    .setDescription(
      `### [${song.title}](${song.url})\n\n` +
      `• ⏱️ **المدة:** \`${song.duration}\`\n` +
      `• 👤 **طُلب بواسطة:** ${song.requestedBy}\n` +
      `• 🔊 **الروم الصوتي:** <#${queue.voiceChannel.id}>\n` +
      `• 🤖 **البوت المشغل بالروم:** \`${queue.activeSubBotName}\`\n` +
      `• 🎚️ **الفلتر:** \`${queue.filter.toUpperCase()}\` | 🎛️ **EQ:** \`${queue.equalizer.toUpperCase()}\` | 🔊 **الصوت:** \`${queue.volume}%\`\n` +
      `• 🔁 **وضع التكرار:** \`${queue.loopMode.toUpperCase()}\` | 🤖 **التشغيل التلقائي:** \`${queue.autoplay ? 'تفعيل' : 'إيقاف'}\``
    )
    .setThumbnail(song.thumbnail || queue.guildId)
    .setFooter({ text: `مشغل الموسيقى الذكي • ${queue.songs.length} أغنية في الانتظار` })
    .setTimestamp();

  // Row 1: Primary Playback Controls
  const playModalBtn = new ButtonBuilder().setCustomId('music_play_btn').setLabel('تشغيل أظنية ▶️').setStyle(ButtonStyle.Success);
  const pauseBtn = new ButtonBuilder().setCustomId('music_pause_resume').setLabel(queue.player.state.status === AudioPlayerStatus.Paused ? 'استئناف ▶️' : 'إيقاف ⏸️').setStyle(ButtonStyle.Primary);
  const skipBtn = new ButtonBuilder().setCustomId('music_skip').setLabel('تخطي ⏭️').setStyle(ButtonStyle.Secondary);
  const prevBtn = new ButtonBuilder().setCustomId('music_previous').setLabel('السابقة ⏮️').setStyle(ButtonStyle.Secondary);
  const stopBtn = new ButtonBuilder().setCustomId('music_stop').setLabel('إيقاف ⏹️').setStyle(ButtonStyle.Danger);

  const row1 = new ActionRowBuilder().addComponents(playModalBtn, pauseBtn, skipBtn, prevBtn, stopBtn);

  // Row 2: Secondary Queue & Features Controls
  const shuffleBtn = new ButtonBuilder().setCustomId('music_shuffle').setLabel('خلط 🔀').setStyle(ButtonStyle.Secondary);
  const loopBtn = new ButtonBuilder().setCustomId('music_loop').setLabel(`تكرار (${queue.loopMode}) 🔁`).setStyle(ButtonStyle.Secondary);
  const queueBtn = new ButtonBuilder().setCustomId('music_queue_btn').setLabel('القائمة 📜').setStyle(ButtonStyle.Secondary);
  const favBtn = new ButtonBuilder().setCustomId('music_favorite_btn').setLabel('المفضلة ❤️').setStyle(ButtonStyle.Secondary);
  const lyricsBtn = new ButtonBuilder().setCustomId('music_lyrics_btn').setLabel('كلمات 🎤').setStyle(ButtonStyle.Secondary);

  const row2 = new ActionRowBuilder().addComponents(shuffleBtn, loopBtn, queueBtn, favBtn, lyricsBtn);

  // Row 3: Audio Filter Select Menu
  const filterMenu = new StringSelectMenuBuilder()
    .setCustomId('music_filter_select')
    .setPlaceholder('🎚️ اختر فلتر الصوت...')
    .addOptions([
      { label: 'إيقاف الفلاتر (Clean / Normal)', value: 'none', emoji: '⚙️' },
      { label: '🔊 مضخم الصوت (Bassboost)', value: 'bassboost', description: 'تضخيم البيس والترددات المنخفضة' },
      { label: '⚡ تسريع حاد (Nightcore)', value: 'nightcore', description: 'تسريع الصوت ونغمة حادة' },
      { label: '🌊 تبطيل ريترو (Vaporwave)', value: 'vaporwave', description: 'تبطيل السرعة بطابع كلاسيكي' }
    ]);
  const row3 = new ActionRowBuilder().addComponents(filterMenu);

  // Row 4: Equalizer Presets Select Menu
  const eqMenu = new StringSelectMenuBuilder()
    .setCustomId('music_equalizer_select')
    .setPlaceholder('🎛️ اختر نمط المعادل الصوتي (Equalizer)...')
    .addOptions([
      { label: '⚖️ متوازن (Flat)', value: 'flat', description: 'الصوت الأصلي المتوازن' },
      { label: '🥁 بيس قوي (Bass Boost)', value: 'bass', description: 'رفع طبقات الإيقاع والبيس' },
      { label: '🎸 صوت حاد وصافي (Treble Boost)', value: 'treble', description: 'تصفية وحيوية الترددات العالية' },
      { label: '🎉 حفلة واستيريو (Party)', value: 'party', description: 'توزيع النغمات على قنوات الاستيريو' }
    ]);
  const row4 = new ActionRowBuilder().addComponents(eqMenu);

  // Row 5: Volume Select Menu
  const volumeMenu = new StringSelectMenuBuilder()
    .setCustomId('music_volume_select')
    .setPlaceholder('🔊 اختر مستوى الصوت...')
    .addOptions([
      { label: 'مستوى الصوت: 25%', value: '25', emoji: '🔈' },
      { label: 'مستوى الصوت: 50%', value: '50', emoji: '🔉' },
      { label: 'مستوى الصوت: 75%', value: '75', emoji: '🔊' },
      { label: 'مستوى الصوت: 100% (أقصى شدة)', value: '100', emoji: '📢' }
    ]);
  const row5 = new ActionRowBuilder().addComponents(volumeMenu);

  queue.textChannel.send({ embeds: [embed], components: [row1, row2, row3, row4, row5] }).catch(() => { });
}

function stopQueue(guildId, voiceChannelId) {
  const queue = getQueue(guildId, voiceChannelId);
  if (!queue) return;

  queue.songs = [];
  queue.isPlaying = false;
  queue.currentSong = null;
  try {
    queue.player.stop();
  } catch (e) { }

  const { scheduleInactivityTimeout } = require('./sessionManager');
  scheduleInactivityTimeout(guildId, voiceChannelId, 30000);
}

function destroyQueue(guildId, voiceChannelId) {
  const queue = getQueue(guildId, voiceChannelId);
  if (!queue) return;

  stopQueue(guildId, voiceChannelId);
  try {
    queue.connection.destroy();
  } catch (e) { }

  queues.delete(queue.key);
  destroySession(guildId, voiceChannelId);
}

function destroyAllGuildQueues(guildId) {
  for (const [key, queue] of queues.entries()) {
    if (queue.guildId === guildId) {
      destroyQueue(guildId, queue.voiceChannelId);
    }
  }
}

module.exports = {
  getQueue,
  createGuildQueue,
  searchTracks,
  playSong,
  stopQueue,
  destroyQueue,
  destroyAllGuildQueues
};
