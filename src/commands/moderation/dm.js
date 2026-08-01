const { SlashCommandBuilder, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dm')
    .setDescription('فتح لوحة تصاميم الرسائل الخاصة (Embed Message Builder)')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    // Create Modal Popup (Embed Message Builder)
    const modal = new ModalBuilder()
      .setCustomId('embed_message_builder_modal')
      .setTitle('Embed Message Builder');

    // Field 1: Title
    const titleInput = new TextInputBuilder()
      .setCustomId('title_input')
      .setLabel('Title')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('عنوان الإمبيد (اختياري)')
      .setRequired(false);

    // Field 2: Description *
    const descriptionInput = new TextInputBuilder()
      .setCustomId('description_input')
      .setLabel('Description *')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('اكتب محتوى الرسالة الخاصة هنا...')
      .setRequired(true);

    // Field 3: Image URL
    const imageInput = new TextInputBuilder()
      .setCustomId('image_input')
      .setLabel('Image URL')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('https://example.com/image.png (اختياري)')
      .setRequired(false);

    // Field 4: Color hex
    const colorInput = new TextInputBuilder()
      .setCustomId('color_input')
      .setLabel('Color hex')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('#ff0000 (red)')
      .setRequired(false);

    // Field 5: Footer
    const footerInput = new TextInputBuilder()
      .setCustomId('footer_input')
      .setLabel('Footer')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('نص الهامش السفلي (اختياري)')
      .setRequired(false);

    // Wrap inputs in ActionRows
    const row1 = new ActionRowBuilder().addComponents(titleInput);
    const row2 = new ActionRowBuilder().addComponents(descriptionInput);
    const row3 = new ActionRowBuilder().addComponents(imageInput);
    const row4 = new ActionRowBuilder().addComponents(colorInput);
    const row5 = new ActionRowBuilder().addComponents(footerInput);

    modal.addComponents(row1, row2, row3, row4, row5);

    // Show modal popup
    await interaction.showModal(modal);
  }
};
