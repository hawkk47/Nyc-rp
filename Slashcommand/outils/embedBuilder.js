const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, AttachmentBuilder, ButtonStyle, Permissions, ApplicationCommandType, ApplicationCommandOptionType, } = require("discord.js");

module.exports.run = async (client, inter) => {
  try {

    await inter.deferReply();

  const title = inter.options.getString('title');
  const description = inter.options.getString('description');
  const color = inter.options.getString('color') || '#7289da';
  const thumbnail = inter.options.getString('thumbnail');
  const image = inter.options.getString('image');
  const footer = inter.options.getString('footer');

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color);

  if (thumbnail) {
    embed.setThumbnail(thumbnail);
  }

  if (image) {
    embed.setImage(image);
  }

  if (footer) {
    embed.setFooter({text : footer});
  }

  await inter.editReply({ embeds: [embed] });
} catch (error) {
  console.error(error);
  inter.editReply({ content: `Une erreur est survenue : ${error} .`, ephemeral: true });
}
};

module.exports.help = {
  name: 'embedbuilder',
  data: {
    name: 'embedbuilder',
    description: 'Créer un embed personnalisé.',
    options: [
      {
        name: 'title',
        type: ApplicationCommandOptionType.String,
        description: 'Le titre de l\'embed.',
        required: true,
      },
      {
        name: 'description',
        type: ApplicationCommandOptionType.String,
        description: 'La description de l\'embed.',
        required: true,
      },
      {
        name: 'color',
        type: ApplicationCommandOptionType.String,
        description: 'La couleur de l\'embed (format hexadécimal, ex : #7289da).',
        required: false,
      },
      {
        name: 'thumbnail',
        type: ApplicationCommandOptionType.String,
        description: 'L\'URL de l\'image miniature.',
        required: false,
      },
      {
        name: 'image',
        type: ApplicationCommandOptionType.String,
        description: 'L\'URL de l\'image.',
        required: false,
      },
      {
        name: 'footer',
        type: ApplicationCommandOptionType.String,
        description: 'Le texte de pied de page.',
        required: false,
      },
    ],
  },
  permissions: ['KICK_MEMBERS', 'kick des membres'],
  permbot: ["KICK_MEMBERS", "kick des membres"],
};
