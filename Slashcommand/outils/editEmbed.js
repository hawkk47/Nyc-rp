const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, AttachmentBuilder, ButtonStyle, Permissions, ApplicationCommandType, ApplicationCommandOptionType, } = require("discord.js");

module.exports.run = async (client, inter) => {
  const messageId = inter.options.getString('messageid');
  const title = inter.options.getString('title');
  const description = inter.options.getString('description');
  const color = inter.options.getString('color');
  const thumbnail = inter.options.getString('thumbnail');
  const image = inter.options.getString('image');
  const footer = inter.options.getString('footer');

  await inter.deferReply();

  try {
    const message = await inter.channel.messages.fetch(messageId);

    if (!message.embeds.length) {
      return inter.editReply({ content: 'Il n\'y a pas d\'embed dans le message spécifié.', ephemeral: true });
    }

    const embed = new EmbedBuilder(message.embeds[0]);

    if (title) {
      embed.setTitle(title);
    }

    if (description) {
      embed.setDescription(description);
    }

    if (color) {
      embed.setColor(color);
    }

    if (thumbnail) {
      embed.setThumbnail(thumbnail);
    }

    if (image) {
      embed.setImage(image);
    }

    if (footer) {
      embed.setFooter(footer, inter.user.displayAvatarURL());
    }

    await message.edit({ embeds: [embed] });
    await inter.editReply({ content: 'L\'embed a été édité avec succès !', ephemeral: true });
  } catch (error) {
    console.error(error);
    inter.editReply({ content: `Une erreur est survenue : ${error} .`, ephemeral: true });
  }
}
module.exports.help = {
  name: 'editembed',
  data: {
    name: 'editembed',
    description: 'Modifier un embed existant.',
    options: [
      {
        name: 'messageid',
        type: ApplicationCommandOptionType.String,
        description: 'L\'ID du message contenant l\'embed.',
        required: true,
      },
      {
        name: 'title',
        type: ApplicationCommandOptionType.String,
        description: 'Le nouveau titre de l\'embed.',
        required: false,
      },
      {
        name: 'description',
        type: ApplicationCommandOptionType.String,
        description: 'La nouvelle description de l\'embed.',
        required: false,
      },
      {
        name: 'color',
        type: ApplicationCommandOptionType.String,
        description: 'La nouvelle couleur de l\'embed (format hexadécimal, ex : #7289da).',
        required: false,
      },
      {
        name: 'thumbnail',
        type: ApplicationCommandOptionType.String,
        description: 'L\'URL de la nouvelle image miniature.',
        required: false,
      },
      {
        name: 'image',
        type: ApplicationCommandOptionType.String,
        description: 'L\'URL de la nouvelle image.',
        required: false,
      },
      {
        name: 'footer',
        type: ApplicationCommandOptionType.String,
        description: 'Le nouveau texte du pied de page.',
        required: false,
      },
    ],
  },
  permissions: ['MANAGE_MESSAGE', 'Gérer les messages'],
  permbot: ["MANAGE_MESSAGE", "Gérer les messages"],
};