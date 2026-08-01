const { spawn } = require("child_process");
const ffmpeg = require("ffmpeg-static");
const prism = require('prism-media');
const { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource, 
  AudioPlayerStatus, 
  VoiceConnectionStatus, 
  entersState, 
  StreamType 
} = require('@discordjs/voice');
const config = require('../config');
const db = require('../database');

class QuranVoiceService {
  constructor() {
    this.guildSessions = new Map();
  }

  async joinAndPlayQuran(client, guildId, voiceChannelId, streamIndex = 0) {
    try {
      const channel = await client.channels.fetch(voiceChannelId).catch(() => null);
      if (!channel || !channel.isVoiceBased()) {
        console.error(`[QuranVoice] ❌ Invalid voice channel ID: ${voiceChannelId} in guild ${guildId}`);
        return false;
      }

      // Check bot permissions
      const permissions = channel.permissionsFor(client.user);
      if (!permissions.has('Connect') || !permissions.has('Speak')) {
        console.warn(`[QuranVoice] ⚠️ Missing Connect/Speak permissions in channel ${voiceChannelId}`);
        return false;
      }

      console.log(`[QuranVoice] 🎙️ Connecting to voice channel ${channel.name} (${voiceChannelId})...`);

      const connection = joinVoiceChannel({
        channelId: voiceChannelId,
        guildId: guildId,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: true,
        selfMute: false
      });

      const player = createAudioPlayer();
      const selectedStream = config.quranRadioStreams[streamIndex] || config.quranRadioStreams[0];

      const playStream = () => {
        try {
          console.log(`[QuranVoice] 📻 Streaming 24/7 Quran Radio (${selectedStream.name})`);

          const ffmpegProcess = spawn(ffmpeg, [
            "-reconnect", "1",
            "-reconnect_streamed", "1",
            "-reconnect_delay_max", "5",
            "-i", selectedStream.url,
            "-f", "s16le",
            "-ar", "48000",
            "-ac", "2",
            "pipe:1"
          ]);

          ffmpegProcess.stderr.on("data", data => {
            console.log("[FFMPEG]", data.toString());
          });

          ffmpegProcess.on("error", err => {
            console.error("[FFMPEG ERROR]", err);
          });

          const resource = createAudioResource(ffmpegProcess.stdout, {
            inputType: StreamType.Raw
          });

          player.play(resource);

        } catch (err) {
          console.error(err);
          setTimeout(playStream, 5000);
        }
      };


      connection.subscribe(player);

      // Auto-reconnect loop on Idle or Error
      player.on(AudioPlayerStatus.Idle, () => {
        console.warn(`[QuranVoice] ⚠️ Radio stream went idle. Resuming 24/7 playback in 3s...`);
        setTimeout(playStream, 3000);
      });

      player.on('error', (err) => {
        console.error(`[QuranVoice] ⚠️ Audio Player Error in ${guildId}:`, err.message);
        setTimeout(playStream, 4000);
      });

      connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          console.warn(`[QuranVoice] ⚠️ Disconnected from voice in ${guildId}. Attempting auto-reconnect...`);
          await Promise.race([
            entersState(connection, VoiceConnectionStatus.Signalling, 5000),
            entersState(connection, VoiceConnectionStatus.Connecting, 5000)
          ]);
        } catch (error) {
          console.error(`[QuranVoice] ❌ Reconnect failed. Re-joining channel in 5s...`);
          connection.destroy();
          this.guildSessions.delete(guildId);
          setTimeout(() => this.joinAndPlayQuran(client, guildId, voiceChannelId, streamIndex), 5000);
        }
      });

      playStream();
      this.guildSessions.set(guildId, { connection, player, voiceChannelId, streamIndex });
      
      // Save voice channel in database
      db.updateGuild(guildId, { voice_channel_id: voiceChannelId });
      return true;
    } catch (err) {
      console.error(`[QuranVoice] ❌ Fatal error connecting to voice channel in ${guildId}:`, err.message);
      return false;
    }
  }

  leaveVoice(guildId) {
    const session = this.guildSessions.get(guildId);
    if (session && session.connection) {
      try {
        session.player.stop();
        session.connection.destroy();
      } catch (e) {}
      this.guildSessions.delete(guildId);
      db.updateGuild(guildId, { voice_channel_id: null });
      return true;
    }
    return false;
  }

  async joinAllSavedVoiceChannels(client) {
    const activeGuilds = db.getAllActiveGuilds();
    if (!activeGuilds || activeGuilds.length === 0) return;

    for (const g of activeGuilds) {
      if (g.voice_channel_id) {
        console.log(`[QuranVoice] 🔄 Restoring 24/7 Quran Voice in guild ${g.guild_id} (Channel: ${g.voice_channel_id})...`);
        await this.joinAndPlayQuran(client, g.guild_id, g.voice_channel_id).catch(() => null);
      }
    }
  }
}

module.exports = new QuranVoiceService();
