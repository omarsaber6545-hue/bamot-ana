const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const config = require('../config');

module.exports = async (client) => {
  client.commands = new Map();
  const commandsArray = [];
  const commandsPath = path.join(__dirname, '../commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
      commandsArray.push(command.data.toJSON());
      console.log(`[IslamicBot] 🟢 Loaded command: /${command.data.name}`);
    }
  }

  if (config.token && config.clientId) {
    const rest = new REST({ version: '10' }).setToken(config.token);

    try {
      console.log(`[IslamicBot] ⏳ Registering ${commandsArray.length} slash commands...`);
      if (config.guildId) {
        await rest.put(
          Routes.applicationGuildCommands(config.clientId, config.guildId),
          { body: commandsArray }
        );
        console.log(`[IslamicBot] 🟢 Registered commands for test guild: ${config.guildId}`);
      } else {
        await rest.put(
          Routes.applicationCommands(config.clientId),
          { body: commandsArray }
        );
        console.log('[IslamicBot] 🟢 Registered global slash commands successfully.');
      }
    } catch (err) {
      console.error('[IslamicBot] ❌ Failed to register slash commands:', err.message);
    }
  }
};
