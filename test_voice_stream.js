const youtubedl = require('youtube-dl-exec');
const { createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');

async function testStream() {
  const url = 'https://youtube.com/watch?v=CCRxEbi75iE';
  console.log('Testing yt-dlp stream extraction for:', url);

  try {
    const output = await youtubedl(url, {
      getUrl: true,
      format: 'bestaudio/best',
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: ['referer:youtube.com', 'user-agent:googlebot']
    });

    const directAudioUrl = output.trim().split('\n')[0];
    console.log('✅ Direct Audio Stream URL extracted! URL starts with:', directAudioUrl.substring(0, 60));

    const player = createAudioPlayer();
    player.on(AudioPlayerStatus.Idle, () => console.log('⚠️ Player went IDLE'));
    player.on('error', err => console.error('❌ Player Error:', err));

    const resource = createAudioResource(directAudioUrl);
    player.play(resource);
    console.log('Started player.play() with direct stream URL!');
  } catch (e) {
    console.error('Catch Error:', e);
  }
}

testStream();
