module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (err) {
      console.error(`[IslamicBot] ❌ Error executing command /${interaction.commandName}:`, err);
      const content = '⚠️ حدث خطأ أثناء تنفيذ الأمر. يرجى المحاولة لاحقاً.';
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content, ephemeral: true }).catch(() => null);
      } else {
        await interaction.reply({ content, ephemeral: true }).catch(() => null);
      }
    }
  }
};
