const axios = require('axios')
const { models } = require('../../models/index')
const config = require('../../config.json')
const {date} = require('../../class/date.js')
const Discord = require('discord.js')
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, AttachmentBuilder, ButtonStyle, Permissions, ApplicationCommandType, ApplicationCommandOptionType, } = require("discord.js");
const { set } = require('mongoose')

module.exports.run = async (client, inter) => {
    try {

    let amount = await inter.options.getString('nombre')
    const count = amount


    const delay = (ms) => new Promise((time) => setTimeout(time, ms));

    const purgeMessages = async (inter, amount) => {
        /**
         * @function purgeMessages
         * @param {Object} inter - L'interaction en cours.
         * @param {Amount} amount - Le nombre de message voulant être supprimer.
         * @returns {Promise} Discord.EmbedBuilder
         * usage  : 
         *          >>> const purgeEmbed = await purgeMessages(inter, amount)
         *          >>> inter.reply({embed = [purgeEmbed])
         */
        if (amount <= 0) { 
            return new Discord.EmbedBuilder().setColor(config.color).setDescription(`🗑 Je n'ai aucun message à effacer.`);
        }

        else if (amount >= 301) { 
            return new Discord.EmbedBuilder().setColor(config.color).setDescription(`🗑 J'ai trop de message à supprimer.`);
        }

        const splitMax = 100
        const split = Math.ceil(amount / splitMax)

        for (let i = 0; i < split; i++) {
            const splited = Math.min(amount, splitMax)
            await inter.channel.bulkDelete(splited, true)
            amount -= splited

            if (amount > 0) await delay(1000);
        }

        return new Discord.EmbedBuilder().setColor(config.color).setDescription(`🗑 J'ai retiré **${(count-amount)}** messages`);
    }

    const purgeEmbed = await purgeMessages(inter, amount)

    const row = new Discord.ActionRowBuilder().addComponents(
            new Discord.ButtonBuilder()
            .setCustomId('purge')
            .setLabel(`${date()}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled()
            )

    inter.reply({ embeds: [purgeEmbed], components: [row], ephemeral: true }) 

    const channell = client.channels.cache.get(config.logsChannelId)

    const embed = new Discord.EmbedBuilder()
        .setAuthor({name : 'Log - ' + inter.member.user.username, iconURL : inter.member.user.displayAvatarURL({ dynamic: true, size: 512 })})
        .setThumbnail(inter.member.user.displayAvatarURL({ dynamic: true, size: 512 }))
        .setDescription(`**${inter.member.user.username}** a supprimé **${amount}** messages dans le salon <#${inter.channel.id}>`)
        .setColor("#FF0000")
        .setTimestamp()

    channell.send({ embeds: [embed] })


} catch (error) {
    console.error(error);
    inter.channel.send({ content: `Une erreur est survenue : ${error} .`, ephemeral: true });
  }
}


module.exports.help = {
    name: "clear",
    data: {
        name: "clear",
        description: "Supprimé des messages",
        options: [
            {
                name: "nombre",
                type: ApplicationCommandOptionType.String,
                description: "Mettre le nombre à supprimer",
                required: true
            }
        ],
    },
    permissions: ['MANAGE_MESSAGE', 'Gérer les messages'],
    permbot: ["MANAGE_MESSAGE", "Gérer les messages"],
}