const axios = require('axios')
const { models } = require('../../models/index')
const config = require('../../config.json')
const {date} = require('../../class/date.js')
const Discord = require('discord.js')
const { EmbedBuilder, ButtonBuilder, StringSelectMenuBuilder, ActionRowBuilder, AttachmentBuilder, ButtonStyle, Permissions, ApplicationCommandType, ApplicationCommandOptionType, } = require("discord.js");

module.exports.run = async (client, inter) => {
    try {
        const target = inter.options.getUser('target');
        const warnings = await models.warn.find({ user_id: target.id, guild_id: inter.guild.id });
        // await inter.deferReply();

        if (warnings.length === 0) {
            return inter.reply(`${target.username} n'a aucun avertissement dans ce serveur.`);
        }

        const options = warnings.map((warn, index) => ({
            label: `Warn #${index + 1}`,
            description: warn.reason.substring(0, 50),
            value: warn.warnid,
        }));

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('warn-info-menu')
                    .setPlaceholder('Sélectionne un warn')
                    .addOptions(options)
            );
        
            const embed = new EmbedBuilder()
                .setTitle('Commande information avertissement')
                .setDescription(`L'utilisateur \`${target.username}\` a ${warnings.length} avertissement(s) dans ce serveur.`)
                .setColor(config.color)
                .setFooter({ text: `Utilisateur : ${target}`, iconURL: inter.user.displayAvatarURL({ dynamic: true }) });

        inter.reply({ embeds : [embed], content: 'Sélectionnez un avertissement pour voir plus de détails.', components: [row] });

    } catch (error) {
        console.error(error);
        inter.reply({ content: `Une erreur est survenue : ${error} .`, ephemeral: true });
    }
}

module.exports.help = {
    name: "warn-info",
    data: {
        name: "warn-info",
        description: "Affiche les avertissements d'un utilisateur spécifique",
        options: [
            {
                name: "target",
                type: ApplicationCommandOptionType.User,
                description: "L'utilisateur dont vous voulez voir les avertissements",
                required: true
            },
        ]
    },
    permissions: ['MANAGE_MESSAGES'],
    permbot: ["MANAGE_MESSAGES"]
}

