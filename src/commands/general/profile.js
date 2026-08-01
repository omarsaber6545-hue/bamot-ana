const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserProfile } = require('../../database/db');
const { createProgressBar } = require('../../utils/embeds');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('عرض بطاقة الحساب الشخصية الفاخرة والإنجازات والمستوى والحيوان الأليف')
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

    const progressBar = createProgressBar(xpInCurrentLevel, xpNeededForNextLevel, 12);
    const badgesText = profile.achievements.map(a => `🏅 \`${a}\``).join('  ') || 'لا توجد أوسمة بعد';

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setAuthor({
        name: `البطاقة الشخصية | ${targetUser.username}`,
        iconURL: targetUser.displayAvatarURL({ dynamic: true })
      })
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
      .setTitle(`✨ ${targetUser.username}`)
      .setDescription(
        `💬 *"${profile.bio}"*\n\n` +
        `⭐ **المستوى (Level):** \`Level ${profile.level}\`\n` +
        `📊 **الخبرة (XP):** \`${profile.xp}\` XP\n` +
        `🪙 **العملات (Coins):** \`${profile.coins}\` عملة\n` +
        `🐾 **الحيوان الأليف:** ${profile.pet ? `${profile.pet.name} (${profile.pet.type})` : 'لا يوجد'}\n\n` +
        `### 📈 تقدم المستوى الحالي:\n` +
        `${progressBar} \`${xpInCurrentLevel} / ${xpNeededForNextLevel} XP\`\n\n` +
        `### 🏅 الأوسمة والإنجازات المكتسبة:\n` +
        `${badgesText}`
      )
      .setFooter({ text: `${interaction.guild.name} • Member Profile Card` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
