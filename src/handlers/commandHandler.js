const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');

function loadCommands(client) {
  client.commands = new Collection();
  const commandsPath = path.join(__dirname, '../commands');
  const commandFolders = fs.readdirSync(commandsPath);

  let loadedCount = 0;

  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;

    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);
      const command = require(filePath);

      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        loadedCount++;
      } else {
        console.warn(`[Warning] Command at ${filePath} is missing required "data" or "execute" property.`);
      }
    }
  }

  console.log(`✅ [CommandHandler] Loaded ${loadedCount} slash commands successfully.`);
}

module.exports = { loadCommands };
