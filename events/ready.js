// /events/ready.js

const { ActivityType } = require('discord.js');
const client = require('../index').client;
const SpamDetector = require('./antiSpam'); // Adaptez le nom si nécessaire

client.on('ready', async () => {
    console.log(`-------------------------------`);
    console.log(`Connecté en tant que ${client.user.tag}`);
    console.log(`Aucune erreur suite à la connexion`);
    console.log(`-------------------------------`);
    client.user.setStatus('dnd');

    setInterval(() => {
        const statuses = [
            {
                name: "Le meilleur serveur DarkRP",
                type: ActivityType.Streaming,
                url: "https://discord.gg/Eb6PFATn"
            },
            {
                name: "NewYork City RP",
                type: ActivityType.Streaming,
                url: "https://discord.gg/Eb6PFATn"
            },
            {
                name: `${client.guilds.cache.reduce((a, guild) => a + guild.memberCount, 0)} utilisateurs`,
                type: ActivityType.Streaming,
                url: "https://discord.gg/Eb6PFATn"
            }
        ];

        const status = statuses[Math.floor(Math.random() * statuses.length)];
        client.user.setActivity(status.name, { type: status.type, url: status.url });
    }, 3000);

    // Déploiement des commandes slash (si applicable)
    client.application.commands.set(client.slashcommand.map(x => x.help).map(x => x.data));

    // Initialisation du système anti-spam et stockage global dans client.spamDetector
    client.spamDetector = new SpamDetector(client);
});