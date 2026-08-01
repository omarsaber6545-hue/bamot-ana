const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserProfile } = require('../../database/db');
const { createProgressBar } = require('../../utils/embeds');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('عرض مستوى الرتبة الحالية والخبرة وشريط التقدم التفاعلي (Level & Rank)')
    .setDMPermission(false)
    .addUserOption(opt => opt.setName('user').setDescription('العضو المستهدف (اختياري)')),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const profile = getUserProfile(
      targetUser.id,
      targetUser.tag,
      targetUser.displayAvatarURL({ dynamic: true })
    );

    const nextLevelXp = Math.pow(profile.level * 10, 2);
    const currentLevelBaseXp = Math.pow((profile.level - 1) * 10, 2);
    const xpInCurrentLevel = profile.xp - currentLevelBaseXp;
    const xpNeededForNextLevel = Math.max(1, nextLevelXp - currentLevelBaseXp);

    const progressBar = createProgressBar(xpInCurrentLevel, xpNeededForNextLevel, 14);

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setAuthor({
        name: `بطاقة المستوى والرتبة | ${targetUser.username}`,
        iconURL: targetUser.displayAvatarURL({ dynamic: true })
      })
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .setTitle(`⭐ Level ${profile.level}`)
      .setDescription(
        `• 📊 **إجمالي الخبرة:** \`${profile.xp}\` XP\n` +
        `• 🪙 **رصيد العملات:** \`${profile.coins}\` عملة\n` +
        `• 🏆 **الرتبة المكتسبة:** \`المستوى ${profile.level}\`\n\n` +
        `### 📈 شريط التفاعل والتقدم للمستوى التالي:\n` +
        `${progressBar} \`${Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100)}%\`\n\n` +
        `🎯 يتبقى لك \`${Math.max(0, xpNeededForNextLevel - xpInCurrentLevel)}\` XP للوصول إلى **Level ${profile.level + 1}**!`
      )
      .setFooter({ text: `${interaction.guild.name} • Leveling System` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
