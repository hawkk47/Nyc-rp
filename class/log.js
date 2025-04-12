class Logs {
    constructor(client) {
        this.client = client
        // Je difini mes types de log ici : `client.logs.raid`, `client.logs.member`, etc...
        this.logTypes = ['raid', 'member', 'config', 'moderation', 'ticket', 'music', 'usages', 'errors']

        // Je reduit ma list logType pour concacté en un object qui contiendra toutes les fonctions.
        const functionLog = this.logTypes.reduce((acc, logType) => {
            // acc est une array qui fait réference à l'accumulateur de la fonction `.reduce` de mes logTypes en object.
            // Il contiendra les propriétés de fonction pour crée chaque logType de manière asynchrone.
            // Celui-ci appelera la fonction `sendFromLogs` de la class `Bot`.
            acc[logType] = async (interaction, content) => { await this.client.sendFromLogs(logType, interaction, content) }
            // On renvois l'array pour accumuler les logTypes.
            return acc
        }, {})

        // On n'oublie pas d'assigner les fonctions[*] dans notre class Logs.
        Object.assign(this, functionLog)
    }
}
module.exports = Logs;



/*   OLD LOGS :

class Logs {
    constructor(client) {
        this.client = client;
    }

    raid(interaction, content) {
        this.client.sendFromLogs("raid", interaction, content);
    }

    member(interaction, content) {
        this.client.sendFromLogs("member", interaction, content);
    }

    config(interaction, content) {
        this.client.sendFromLogs("config", interaction, content);
    }

    moderation(interaction, content) {
        this.client.sendFromLogs("moderation", interaction, content);
    }

    ticket(interaction, content) {
        this.client.sendFromLogs("ticket", interaction, content);
    }

    music(interaction, content) {
        this.client.sendFromLogs("music", interaction, content);
    }

    usages(interaction, content) {
        this.client.sendFromLogs("usages", interaction, content);
    }

    errors(interaction, content) {
        this.client.sendFromLogs("errors", interaction, content);
    }
}
*/