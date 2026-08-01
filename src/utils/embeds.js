const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');

function createProgressBar(current, total, length = 16) {
  if (total <= 0) return `\`[${'░'.repeat(length)}]\` 0%`;
  const percentage = Math.min(Math.max(current / total, 0), 1);
  const filledLength = Math.round(length * percentage);
  const emptyLength = length - filledLength;
  const bar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);
  return `\`[${bar}]\` ${Math.round(percentage * 100)}%`;
}

function successEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(config.colors.success)
    .setTitle(`${config.emojis.success} ${title}`)
    .setDescription(description)
    .setTimestamp()
    .setFooter({ text: 'نظام إدارة السيرفر' });
}

function errorEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(config.colors.danger)
    .setTitle(`${config.emojis.error} ${title}`)
    .setDescription(description)
    .setTimestamp()
    .setFooter({ text: 'نظام إدارة السيرفر' });
}

function warningEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(config.colors.warning)
    .setTitle(`${config.emojis.warning} ${title}`)
    .setDescription(description)
    .setTimestamp()
    .setFooter({ text: 'نظام إدارة السيرفر' });
}

function infoEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(config.colors.info)
    .setTitle(`${config.emojis.info} ${title}`)
    .setDescription(description)
    .setTimestamp()
    .setFooter({ text: 'نظام إدارة السيرفر' });
}

module.exports = {
  createProgressBar,
  successEmbed,
  errorEmbed,
  warningEmbed,
  infoEmbed
};
