    const client = require('../index').client
    const Discord = require('discord.js')
    const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, Events, ButtonStyle, isStringSelectMenu } = require("discord.js")
    const config = ('../config.json')

    
    client.on(Events.InteractionCreate, async inter => {
    
        if (inter.isCommand()) {
            const command = client.slashcommand.get(inter.commandName)
            if (!command) return
            if (!inter.guild.members.me.permissions.has(command.help.permbot[0])) return inter.reply({ embeds: [new EmbedBuilder().setAuthor({ name: `Permission manquante | ${inter.user.username}`, iconURL: inter.member.displayAvatarURL() }).setDescription(`Le bot a besion de la permission \`${command.help.permissions[1]}\` pour effectuer la commande \`${inter.commandName}\`.`).setColor(config.color)] })
            if (!inter.member.permissions.has(command.help.permissions[0])) return inter.reply({ embeds: [new EmbedBuilder().setAuthor({ name: `Permission manquante | ${inter.user.username}`, iconURL: inter.member.displayAvatarURL() }).setDescription(`Vous ne pouvez pas faire la commande \`${inter.commandName}\` car vous n'avez pas la permission \`${command.help.permissions[1]}\`.`).setColor(config.color)] })
            if (command) {
                command.run(client, inter)
            }
        }

        if (!inter.isButton()) return;
        if (client.spamDetector) {
          await client.spamDetector.handleButtonInteraction(inter);
        }
});