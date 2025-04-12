const axios = require('axios')
const { models } = require('../../models/index')
const config = require('../../config.json')
const {date} = require('../../class/date.js')
const Discord = require('discord.js')
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, AttachmentBuilder, ButtonStyle, Permissions, ApplicationCommandType, ApplicationCommandOptionType, } = require("discord.js");

module.exports.run = async (client, inter) => {
    try {
        await inter.deferReply();
        const target = inter.options.getUser('cible')
        const reason = inter.options.getString('raison')
        const moderator = inter.user

        const warnings = await models.warn.find({ guild_id: inter.guild.id, user_id: target.id });
        const warnid = warnings.length + 1; 

        const warning = new models.warn({
            warnid: warnid,
            guild_id: inter.guild.id,
            user_id: target.id,
            reason: reason,
            date: new Date(),
            moderator: moderator.id,
        })              
        await warning.save()

        const embed = new EmbedBuilder()
            .setTitle('Avertissement')
            // .setDescription(`L'utilisateur : \`${target.username}\`\nModérateur : \`${moderator.username}\`\nPour la raison suivante : \`${reason}\``)
            .addFields(
                { name: 'Utilisateur', value: `${target}`, inline: false  },
                { name: 'Date', value: `${date(warning.date)}`, inline: false  },
                { name: 'Avertissement n°', value: `${warning.warnid}`, inline: false  },
                { name: 'Modérateur', value: `${moderator}`, inline: false   },
                { name: 'Raison', value: `${reason}`, inline: false   },
            )
            .setColor(config.color)
            .setFooter({ text: `Avertissement n°${warning.warnid}`, iconURL: inter.user.displayAvatarURL({ dynamic: true }) })

        await inter.editReply({ embeds: [embed] });

    } catch (error) {
        console.error(error);
        inter.editReply({ content: `Une erreur est survenue : ${error} .`, ephemeral: true });
    }
}
module.exports.help = {
    name: "warn",
    data: {
        name: "warn",
        description: "Avertit un utilisateur spécifique",
        options: [
            {
                name: "cible",
                type: ApplicationCommandOptionType.User,
                description: "L'utilisateur à avertir",
                required: true
            },
            {
                name: "raison",
                type: ApplicationCommandOptionType.String,
                description: "La raison de l'avertissement",
                required: true
            }
        ]
    },
    permissions: ['MANAGE_MESSAGE', 'Gérer les messages'],
    permbot: ["MANAGE_CHANNEL", "Gérer les salons"]
}