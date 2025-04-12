const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, AttachmentBuilder, ButtonStyle, Permissions, ApplicationCommandType, ApplicationCommandOptionType, } = require("discord.js");
const client = require('../../index.js').client;
const Discord = require('discord.js');
const { models } = require('../../models/index.js');
const axios = require('axios');
const {date} = require('../../class/date.js')

module.exports.run = async (client, inter) => {
    try {

    await inter.deferReply();
    const target = inter.options.getUser('utilisateur');
    if (!target) {
        return inter.reply({ content: 'Veuillez mentionner un utilisateur à kick.', ephemeral: true });
    }

    const reason = inter.options.getString('raison') || 'Non spécifié';

    const kickEmbed = new EmbedBuilder()
        .setTitle('Utilisateur kick')
        .setDescription(`${target} a été kick pour la raison: ${reason}`)
        .setColor('#ff0000');

    const formrow = new ActionRowBuilder()
        .addComponents(form);

    await target.send({
        content: 'Vous avez été kick.',
    });

    await inter.guild.members.kick(target, { reason });

    inter.editReply({
        content: `L'utilisateur ${target} a été kick.`,
        embeds: [kickEmbed]
    });
} catch (error) {
    console.error(error);
    inter.editReply({ content: `Une erreur est survenue : ${error} .`, ephemeral: true });
  }
};
module.exports.help = {
    name: "kick",
    data: {
        name: "kick",
        description: "kick un utilisateur",
        options: [
            {
                name: "utilisateur",
                description: "L'utilisateur à kick",
                type: ApplicationCommandOptionType.User,
                required: true,
            },
            {
                name: "raison",
                description: "La raison du kick",
                type: ApplicationCommandOptionType.String,
                required: false,
            },
        ],
    },
    permissions: ['MANAGE_MESSAGE', 'Gérer les messages'],
    permbot: ['MANAGE_MESSAGE', 'Gérer les messages'],
};
