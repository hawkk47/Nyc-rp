const Discord = require('discord.js')
const fs = require('fs')
const Logs = require('./log.js')



class Bot extends Discord.Client {
    constructor(options) {
        super(options);
        //---------------------DataBase--------------------------------------
        this.mangodb = require('../models/index.js').models
        //---------------------Logs------------------------------------------
        this.logs = new Logs(this);
        //---------------------Bot-------------------------------------------
        this.events = new Discord.Collection()
        this.slashcommand = new Discord.Collection()
        this.dataslash = new Discord.Collection()
        this.permissions = new Discord.Collection()
        this.permbot = new Discord.Collection()
    }

    initialize() {
        /**
         * Il permet le chargement des events et slashcommands.
         * @function initialise
         * @returns undifined
         */
        fs.readdirSync('./events/')
            .filter(file => file.endsWith('.js'))
            .forEach(file => {
                try {
                    const event = require(`../events/${file}`);
                    this.events.set(event.name, event);
                    console
                    console.log(`[EVENTS HANDLER] Chargement de l'événement ${file}`);
                } catch (err) {
                    console.log(`[EVENTS HANDLER] Le chargement de l'événement ${file} a échoué : ${err}`);
                }
            });

        fs.readdirSync('./Slashcommand/').forEach(dir => {
            const dirPath = `./Slashcommand/${dir}`;
            fs.readdir(dirPath, (err, files) => {
              if (err) {
                console.log(`[SLASHCOMMAND HANDLER] Erreur en lisant le dossier '${dirPath}' : ${err}`);
                return;
              }
              const jsFiles = files.filter(file => file.endsWith('.js'));
              if (jsFiles.length <= 0) {
                console.log(`[SLASHCOMMAND HANDLER] Aucune commande trouvée dans le dossier '${dirPath}'`);
                return;
              }
              jsFiles.forEach(file => {
                try {
                    const slashcommand = require(`.${dirPath}/${file}`);
                    this.slashcommand.set(slashcommand.help.name, slashcommand);
                    this.dataslash.set(slashcommand.help.data, slashcommand);
                    console.log(`[SLASHCOMMAND HANDLER] Chargement de la commande '${slashcommand.help.name}'`);
                } catch (err) {
                    console.log(`erreur en lisant le dossier '${dirPath}' : ${err}`);
                }
                  });
                });
              });
    }

    async sendFromLogs(Name, Interaction, Options) {
        /**
         * @property: voir _MessageSendByLogs(...)
         *
         * @Usage:
         *        >>> const logMessage = await client.logs.raid(interaction, {content: "message", embed: [], ...})
         *        >>> if (result === undefined) {
         *        >>>     // Erreur provenant de Name
         *        >>> } else if (result === null) {
         *        >>>     // Erreur il n'a pas trouver le salon. Peux-être est-il supprimer ?
         *        >>> }
         *        >>> // la suite du code ... logMessage --> Object de la class : Discord.Message
         */
        const propertyObject = await this._MessageSendByLogs(Name, Interaction, Options)
        return propertyObject
    }

    async _MessageSendByLogs(Name, InteractionOrMessage, Options) {
    /**
     * Envoie un message dans un salon de log
     * @Fonction _MessageSendByLogs
     * @param {Object} InteractionOrMessage - Discord.Interaction || Discord.Message
     * @param {Array} Options - tout les parametres lors d'un envois de message
     * @param {String} Name - Recherle salon dans " name " de la base de donnée
     * @returns { Promise( - return (undefined || null || Discord.Message) - )}
     *
     * @notes:
     * Name peux être modifier via ./class/log.js
     */
    if(!InteractionOrMessage) throw new SyntaxError("Vous devez spécifier un message ou une interaction");
    if(!Options) throw new SyntaxError("Vous devez spécifier les options");
    if(!Name) throw new SyntaxError("Vous devez spécifier quel est le nom de l'errreur. Voir ./class/log.js");

    let logName = Name.toLowerCase()

    setTimeout(async () => {
            let log = await this.mangodb.logs.find({ guild_id: InteractionOrMessage.guild.id, name: logName });

            try {
                if (log.length !== 0) {

                    // array "inutile" sert uniquement de visuel.
                    // ['raid', 'member', 'config', 'moderation', 'ticket', 'music', 'usages', 'errors'];

                    const messageObject = await this.guilds.cache.get(log[0].guild_id)?.channels.cache.get(log[0].channel_id)?.send(Options);

                    if (Array.isArray(messageObject) && messageObject.some(i => i !== undefined)) {
                        return Promise.resolve(null)
                    } else {
                        return Promise.resolve(messageObject);
                    }
                } else {
                    const messageObject = await this.guilds.cache.get(InteractionOrMessage.guild.id)?.channels.cache.get(InteractionOrMessage.channel.id)?.send({content: "Uh-Oh on dirait que je ne suis pas configurée."});
                    return Promise.resolve(undefined)
                }
            } catch {
                const messageObject = await this.guilds.cache.get(InteractionOrMessage.guild.id)?.channels.cache.get(InteractionOrMessage.channel.id)?.send({content: "Uh-Oh on dirait que je ne suis pas configurée."});
                return Promise.resolve(undefined)
            }
        }, 4000);
    }
}


module.exports = Bot;