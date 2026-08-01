const fs = require('fs');
const path = require('path');

function loadEvents(client) {
  const eventsPath = path.join(__dirname, '../events');
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

  let loadedCount = 0;

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
    loadedCount++;
  }

  console.log(`✅ [EventHandler] Loaded ${loadedCount} events successfully.`);
}

module.exports = { loadEvents };
