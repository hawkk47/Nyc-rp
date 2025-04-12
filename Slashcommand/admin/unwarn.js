const axios = require('axios')
const { models } = require('../../models/index')
const config = require('../../config.json')
const Discord = require('discord.js')
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, AttachmentBuilder, ButtonStyle, Permissions, ApplicationCommandType, ApplicationCommandOptionType, } = require("discord.js");

module.exports.run = async (client, inter) => {
    try {
        await inter.deferReply();
        const warnid = inter.options.getInteger('id')

        const warning = await models.warn.findOne({ warnid: warnid, guild_id: inter.guild.id });
        if (!warning) {
            return inter.editReply({ content: `Aucun avertissement avec l'ID \`${warnid}\` n'a été trouvé.`, ephemeral: true });
        }

        await models.warn.deleteOne({ warnid: warnid, guild_id: inter.guild.id });

        const target = await client.users.fetch(warning.user_id);

        const embed = new EmbedBuilder()
            .setTitle('Retrait d\'un avertissement')
            .setDescription(`L'avertissement n°\`${warnid}\` de l'utilisateur \`${target.username}\` a été retiré.\n\nModérateur : \`${inter.user.username}\``)
            .setColor(config.color)
            .setFooter({ text: `ID de l'utilisateur : ${target.id}`, iconURL: inter.user.displayAvatarURL({ dynamic: true }) })

        await inter.editReply({ embeds: [embed] });

    } catch (error) {
        console.error(error);
        inter.editReply({ content: `Une erreur est survenue : ${error} .`, ephemeral: true });
    }
}
module.exports.help = {
    name: "unwarn",
    data: {
        name: "unwarn",
        description: "Retire un avertissement d'un utilisateur spécifique",
        options: [
            {
                name: "id",
                type: ApplicationCommandOptionType.Integer,
                description: "L'ID de l'avertissement à retirer",
                required: true
            },
        ]
    },
    permissions: ['MANAGE_MESSAGES', 'Gérer les messages'],
    permbot: ["MANAGE_CHANNEL", "Gérer les salons"]
}