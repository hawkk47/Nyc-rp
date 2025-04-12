const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports.run = async (client, inter) => {
    try {
        // Vérifier si l'utilisateur a les permissions nécessaires
        if (!inter.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return inter.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("❌ Permission refusée")
                        .setDescription("Vous n'avez pas la permission de gérer les channels.")
                        .setColor("#ff0000")
                ],
                ephemeral: true
            });
        }

        // Confirmer la commande pour éviter les erreurs accidentelles
        await inter.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("⚠️ Confirmation requise")
                    .setDescription("Êtes-vous sûr de vouloir **supprimer tous les messages** de ce channel ? Cette action est irréversible.")
                    .setColor("#ffcc00")
            ],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            label: "Confirmer",
                            style: 4, // ButtonStyle.Danger
                            custom_id: "confirm_nuke"
                        },
                        {
                            type: 2,
                            label: "Annuler",
                            style: 2, // ButtonStyle.Secondary
                            custom_id: "cancel_nuke"
                        }
                    ]
                }
            ],
            ephemeral: true
        });

        // Collecteur pour gérer la confirmation
        const filter = i => i.user.id === inter.user.id;
        const collector = inter.channel.createMessageComponentCollector({ filter, time: 15000 });

        collector.on("collect", async (i) => {
            if (i.customId === "confirm_nuke") {
                const channel = inter.channel;

                // Récupérer toutes les autorisations du channel
                const permissions = channel.permissionOverwrites.cache.map(overwrite => ({
                    id: overwrite.id,
                    allow: overwrite.allow.bitfield,
                    deny: overwrite.deny.bitfield,
                    type: overwrite.type
                }));

                // Cloner le channel avec les mêmes paramètres
                const clonedChannel = await channel.clone({
                    name: channel.name,
                    topic: channel.topic,
                    nsfw: channel.nsfw,
                    bitrate: channel.bitrate,
                    userLimit: channel.userLimit,
                    rateLimitPerUser: channel.rateLimitPerUser,
                    type: channel.type,
                    reason: `Channel nuked by ${inter.user.tag}`
                });

                // Appliquer les mêmes permissions
                await clonedChannel.permissionOverwrites.set(permissions);

                // Supprimer l'ancien channel
                await channel.delete();

                // Envoyer un message dans le nouveau channel
                await clonedChannel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("💣 Channel Nuked")
                            .setDescription("Tous les messages de ce channel ont été supprimés avec succès.")
                            .setColor("#ff0000")
                    ]
                });

                collector.stop();
            } else if (i.customId === "cancel_nuke") {
                await i.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("❌ Nuke annulé")
                            .setDescription("La suppression de tous les messages a été annulée.")
                            .setColor("#00ff00")
                    ],
                    ephemeral: true
                });

                collector.stop();
            }
        });

        collector.on("end", async (collected) => {
            if (collected.size === 0) {
                await inter.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("⏳ Temps expiré")
                            .setDescription("La confirmation du nuke n'a pas été reçue à temps.")
                            .setColor("#ffcc00")
                    ],
                    components: [],
                });
            }
        });
    } catch (error) {
        console.error(error);
        await inter.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("❌ Erreur")
                    .setDescription(`Une erreur est survenue : \`${error.message}\``)
                    .setColor("#ff0000")
            ],
            ephemeral: true
        });
    }
};

module.exports.help = {
    name: "nuke",
    data: {
        name: "nuke",
        description: "Supprime tous les messages d'un channel en le recréant."
    },
    permissions: ['MANAGE_CHANNELS', "Gerer les salons"], // L'utilisateur doit avoir la permission de gérer les channels
    permbot: ['MANAGE_CHANNELS', 'Gerer les salons'], // Le bot doit avoir la permission de gérer les channels
};
