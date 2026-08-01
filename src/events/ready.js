const { REST, Routes } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`🤖 [Ready] Logged in as ${client.user.tag}!`);

    // Set bot status / activity
    client.user.setActivity('/help | إدارة السيرفرات', { type: 3 }); // Watching

    // Register Slash Commands automatically
    const commandsData = [];
    client.commands.forEach(cmd => {
      if (cmd.data) commandsData.push(cmd.data.toJSON());
    });

    const token = process.env.DISCORD_TOKEN;
    const clientId = process.env.CLIENT_ID || client.user.id;

    if (!token || token === 'YOUR_BOT_TOKEN_HERE') {
      console.warn('⚠️ [Warning] DISCORD_TOKEN is missing in .env file! Commands were not registered.');
      return;
    }

    const rest = new REST({ version: '10' }).setToken(token);

    try {
      console.log(`⏳ [Slash Commands] Registering ${commandsData.length} global slash commands...`);
      await rest.put(Routes.applicationCommands(clientId), { body: commandsData });
      console.log(`✅ [Slash Commands] Successfully registered ${commandsData.length} global commands.`);
    } catch (error) {
      console.error('❌ [Slash Commands Error] Failed to register slash commands:', error);
    }
  }
};
