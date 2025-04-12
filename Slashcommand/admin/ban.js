const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, AttachmentBuilder, ButtonStyle, Permissions, ApplicationCommandType, ApplicationCommandOptionType, } = require("discord.js");
const client = require('../../index.js').client;
const Discord = require('discord.js');
const { models } = require('../../models/index.js');
const axios = require('axios');
const {date} = require('../../class/date.js')
const config = require('../../config.json');

module.exports.run = async (client, inter) => {
    try{
    const target = inter.options.getUser('utilisateur');
    const reason = inter.options.getString('raison');

    await inter.deferReply();

    const banEmbed = new EmbedBuilder()
        .setTitle('Utilisateur banni')
        .setDescription(`${target} a été banni pour la raison: \`${reason || 'non spécifié'}\``)
        .setColor(config.color);

    const time = new ButtonBuilder()
        .setCustomId('purge')
        .setLabel(`${date()}`)
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🕒')
        .setDisabled(true)

    const envoie = new ButtonBuilder()
        .setCustomId('where')
        .setLabel(`envoyé depuis ${inter.guild.name}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)

    const formrow = new ActionRowBuilder()
        .addComponents(time)
        .addComponents(envoie);

setTimeout(async () => {
        await inter.guild.members.ban(target, { reason });
    }   , 2000);

    await target.send({
        content: 'Vous avez été banni.',
        embeds: [banEmbed],
        components: [formrow],
    });
    
    inter.editReply({
        content: `L'utilisateur ${target} a été banni.`,
        embeds: [banEmbed],
    });

} catch (error) {
    console.error(error);
    inter.editReply({ content: `Une erreur est survenue : ${error} .`, ephemeral: true });
  }
};

module.exports.help = {
    name: "ban",
    data: {
        name: "ban",
        description: "Bannir un utilisateur et envoyer un formulaire pour contester la décision",
        options: [
            {
                name: "utilisateur",
                description: "L'utilisateur à bannir",
                type: ApplicationCommandOptionType.User,
                required: true,
            },
            {
                name: "raison",
                description: "La raison du bannissement",
                type: ApplicationCommandOptionType.String,
                required: false,
            },
        ],
    },
    permissions: ['BAN_MEMBER', 'Bannir des membres'],
    permbot: ["ADMINISTRATOR", "admin"],
};
