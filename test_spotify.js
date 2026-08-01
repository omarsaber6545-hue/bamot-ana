const ffmpeg = require('@ffmpeg-installer/ffmpeg');
process.env.FFMPEG_PATH = ffmpeg.path;

const ytSearch = require('yt-search');
const ytdl = require('@distube/ytdl-core');
const { createAudioResource } = require('@discordjs/voice');

async function testSpotifyUrl(url) {
  try {
    let searchQuery = url;

    if (url.includes('spotify.com')) {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
      const html = await res.text();
      const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
      const descriptionMatch = html.match(/<meta property="og:description" content="([^"]+)"/);

      if (titleMatch && titleMatch[1]) {
        const songTitle = titleMatch[1];
        const artist = descriptionMatch ? descriptionMatch[1].split('·')[0].trim() : '';
        searchQuery = `${songTitle} ${artist}`.trim();
        console.log('✅ Spotify Metadata Extracted:', searchQuery);
      }
    }

    const r = await ytSearch(searchQuery);
    const videos = r.videos;
    if (videos && videos.length > 0) {
      console.log('✅ YouTube Track Found via yt-search:', videos[0].title, videos[0].url);
      const stream = ytdl(videos[0].url, { filter: 'audioonly', highWaterMark: 1 << 25, quality: 'highestaudio' });
      const resource = createAudioResource(stream);
      console.log('✅ Discord AudioResource created successfully! Exists:', !!resource);
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

testSpotifyUrl('https://open.spotify.com/track/2HtFhMMHqwdobOT1DQC0Iu?si=98893390b8e44e7d');
