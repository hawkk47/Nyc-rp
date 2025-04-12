const { Client, GatewayIntentBits } = require('discord.js');
const config = require('./config.json'); // Assurez-vous que le fichier config contient votre token et clientId

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const { token, clientId } = config; // Récupérez le token et le clientId depuis votre fichier config

client.once('ready', async () => {
    try {
        console.log(`Connecté en tant que ${client.user.tag}. Purge des commandes slash en cours...`);

        console.log('Suppression des commandes globales...');
        const globalCommands = await client.application.commands.fetch();
        for (const command of globalCommands.values()) {
            await client.application.commands.delete(command.id);
            console.log(`Commande globale supprimée : ${command.name}`);
        }

        console.log('Suppression des commandes par serveur...');
        const guilds = client.guilds.cache;
        for (const guild of guilds.values()) {
            const guildCommands = await guild.commands.fetch();
            for (const command of guildCommands.values()) {
                await guild.commands.delete(command.id);
                console.log(`Commande supprimée dans le serveur ${guild.name} : ${command.name}`);
            }
        }

        console.log('Toutes les commandes slash ont été purgées avec succès.');
    } catch (error) {
        console.error('Erreur lors de la purge des commandes slash :', error);
    } finally {
        client.destroy();
    }
});

// Connexion du bot
client.login(token);
