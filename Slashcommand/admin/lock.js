const axios = require('axios')
const { models } = require('../../models/index')
const config = require('../../config.json')
const {date} = require('../../class/date.js')
const Discord = require('discord.js')
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, AttachmentBuilder, ButtonStyle, Permissions, ApplicationCommandType, ApplicationCommandOptionType, } = require("discord.js");

module.exports.run = async (client, inter) => {
try {
    let type = inter.options.getString('type')

    await inter.deferReply();

    if (type === "on") {
        inter.channel.permissionOverwrites.create(inter.guild.roles.everyone, { SendMessages: false });

        const embed = new Discord.EmbedBuilder()
            .setDescription(`🔒 **Le channel ${inter.channel} est verrouillé !**`)
            .setColor('#ff0000');
            

            const row = new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setLabel(`${date()}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setCustomId('purge')
                    .setDisabled()
            );

    inter.editReply({ embeds: [embed], components : [row] })
    }
    if (type === "off") {
        inter.channel.permissionOverwrites.create(inter.guild.roles.everyone, { SendMessages: true });

        const embed1 = new Discord.EmbedBuilder()
            .setDescription(`🔓 **Le channel ${inter.channel} est déverrouillé !**`)
            .setColor('#008000');

            const row2 = new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setLabel(`${date()}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setCustomId('purge')
                    .setDisabled()
            );

    inter.editReply({ embeds: [embed1], components : [row2] })
    }
} catch (error) {
    console.error(error);
    inter.editReply({ content: `Une erreur est survenue : ${error} .`, ephemeral: true });
  }
}
module.exports.help = {
    name: "lock",
    data: {
        name: "lock",
        description: "Permet de vérouiller/déverrouiller un channel",
        options: [
            {
                name: "type",
                type: ApplicationCommandOptionType.String,
                choices: [
                    {
                        name: "Activer",
                        value: "on"
                    },
                    {
                        name: "Désactiver",
                        value: "off"
                    }
                ],
                description: "Activé ou desactivé le vérouillage",
                required: true
            },
        ]
    },
    permissions: ['MANAGE_CHANNEL', 'Gérer les channels'],
    permbot: ["MANAGE_CHANNEL", "Gérer les salons"]
}
