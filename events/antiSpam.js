// /events/antiSpam.js

const {
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    Events,
    ButtonStyle,
    PermissionsBitField,
    WebhookClient,
  } = require('discord.js');
  const config = require('../config.json');
  const { log } = require('util');
  
  // Configuration des paramètres
  const WEBHOOK_AVATAR = config.webhookAvatar || 'https://cdn-icons-png.flaticon.com/128/6056/6056215.png';
  const spamThreshold = config.spamThreshold || 5;
  const timeWindow = config.timeWindow || 5000;
  const muteDuration = config.muteDuration || 60000;
  
  // ID du canal de log avancé
  const advancedLogChannelId = config.staffChannelId ;
  // ID du canal de log admin (si défini dans config, sinon on utilisera advancedLogChannelId)
  const adminLogChannelId = config.staffChannelId || advancedLogChannelId;
  
  // ID du rôle "générique" utilisé pour verrouiller/déverrouiller le canal
  const genericRoleId = "901236111014252544";
  
  class SpamDetector {
    /**
     * @param {Client} client - Le client Discord
     */
    constructor(client) {
      this.client = client;
  
      // Utilisation de Map pour gérer les logs et rapports par canal
      this.messageLog = new Map();      // Map<channelId, Array<number>>
      this.attackReport = new Map();    // Map<channelId, { count: number, messages: Array }>
      this.webhookClients = new Map();  // Map<channelId, WebhookClient>
  
      this.setupListeners();
    }
  
    /**
     * Envoie un message de log général dans le canal avancé.
     * @param {string} messageContent - Le contenu textuel du log
     * @param {EmbedBuilder|null} embed - (Optionnel) Un embed à joindre
     */
    async logAdvanced(messageContent, embed = null) {
      try {
        const logChannel = await this.client.channels.fetch(advancedLogChannelId);
        if (logChannel) {
          await logChannel.send({ content: messageContent, embeds: embed ? [embed] : [] });
        } else {
          console.error(`Canal de log avancé introuvable (ID: ${advancedLogChannelId}).`);
        }
      } catch (error) {
        console.error("Erreur lors de l'envoi du log avancé:", error);
      }
    }
  
    /**
     * Envoie un log détaillé des actions admin dans le canal dédié aux logs admin.
     * @param {User} adminUser - L'utilisateur admin ayant déclenché l'action
     * @param {string} action - Le type d'action effectuée
     * @param {string} details - Les détails complémentaires de l'action
     * @param {EmbedBuilder|null} embed - (Optionnel) Un embed à joindre
     */
    async logAdminAction(adminUser, action, details, embed = null) {
      try {
        const adminLogChannel = await this.client.channels.fetch(adminLogChannelId);
        if (adminLogChannel) {
          const embedToSend = embed || new EmbedBuilder()
            .setTitle("Contre mesures - Anti spam")
            .setColor("#5e41d5")
            .setThumbnail("https://cdn-icons-gif.flaticon.com/6569/6569171.gif")
            // Vous pouvez ajuster ou supprimer le footer selon vos besoins
            //.setFooter({ text: `Contre mesure`, iconURL: inter.guild.iconURL() })
            .addFields(
              { name: "Administrateur", value: adminUser.tag, inline: true },
              { name: "Action", value: action, inline: true },
              { name: "Détails", value: details }
            )
            .setTimestamp();
          await adminLogChannel.send({ embeds: [embedToSend] });
        } else {
          console.error(`Canal de log admin introuvable (ID: ${adminLogChannelId}).`);
        }
      } catch (error) {
        console.error("Erreur lors de l'envoi du log admin:", error);
      }
    }
  
    setupListeners() {
      // Écoute globale pour tous les messages entrants
      this.client.on(Events.MessageCreate, async (message) => {
        if (message.author.bot) return;
        try {
          await this.handleMessage(message);
        } catch (error) {
          console.error(`Erreur dans handleMessage pour le canal ${message.channel.id}:`, error);
        }
      });
    }
  
    async handleMessage(message) {
      const channelId = message.channel.id;
  
      // Initialiser les logs et rapport pour le canal s'ils n'existent pas déjà
      if (!this.messageLog.has(channelId)) {
        this.messageLog.set(channelId, []);
        this.attackReport.set(channelId, { count: 0, messages: [] });
  
        // Création d’un webhook pour le canal
        try {
          const webhook = await message.channel.createWebhook({
            name: `Sentinel pour ${message.channel.name}`,
            avatar: WEBHOOK_AVATAR,
          });
          const webhookClient = new WebhookClient({ id: webhook.id, token: webhook.token });
          this.webhookClients.set(channelId, webhookClient);
        } catch (error) {
          console.error(`Erreur lors de la création du webhook pour le canal ${channelId}:`, error);
        }
      }
  
      const now = Date.now();
      let logs = this.messageLog.get(channelId);
      logs.push(now);
  
      // Ajout du message au rapport d'attaque (on stocke également l'ID de l'auteur)
      const report = this.attackReport.get(channelId);
      report.messages.push({
        time: now,
        content: message.content,
        author: message.author.tag,
        authorId: message.author.id,
      });
  
      // On ne garde que les messages récents dans la fenêtre définie
      logs = logs.filter((timestamp) => now - timestamp < timeWindow);
      this.messageLog.set(channelId, logs);
  
      // Si le seuil est atteint, on déclenche la procédure anti-spam
      if (logs.length >= spamThreshold) {
        await this.handleSpam(message.channel, channelId);
      }
    }
  
    async handleSpam(channel, channelId) {
      // Récupération du rôle générique
      const genericRole = channel.guild.roles.cache.get(genericRoleId);
      if (!genericRole) {
        console.error(`Le rôle "générique" (ID: ${genericRoleId}) est introuvable dans le serveur pour le canal ${channelId}.`);
        return;
      }
      try {
        // Bloquer temporairement l'envoi de messages pour le rôle générique
        await channel.permissionOverwrites.edit(genericRole, {
          [PermissionsBitField.Flags.SendMessages]: false,
        });
        await this.logAdvanced(
          `🔒 **Blocage de canal** : Le canal **${channel.name}** (ID: ${channelId}) a été bloqué pour spam à ${new Date().toLocaleString()}.`
        );
      } catch (error) {
        console.error(`Erreur lors du blocage du canal ${channelId}:`, error);
      }
  
      const webhookClient = this.webhookClients.get(channelId);
      if (webhookClient) {
        try {
          await webhookClient.send('⚠️ Le canal est temporairement bloqué en raison de spam.');
        } catch (error) {
          console.error(`Erreur lors de l'envoi du message via le webhook pour le canal ${channelId}:`, error);
        }
      }
  
      // Incrémenter le compteur d'attaques
      const reportData = this.attackReport.get(channelId);
      reportData.count++;
      // Réinitialiser le log pour éviter des déclenchements en boucle immédiats
      this.messageLog.set(channelId, []);
  
      // Après la durée de blocage, débloquer le canal et activer la surveillance dite "sentinelle"
      setTimeout(async () => {
        await this.unblockChannel(channel, channelId);
      }, muteDuration);
    }
  
    async unblockChannel(channel, channelId) {
      const genericRole = channel.guild.roles.cache.get(genericRoleId);
      if (!genericRole) {
        console.error(`Le rôle "générique" (ID: ${genericRoleId}) est introuvable dans le serveur pour le canal ${channelId}.`);
        return;
      }
      try {
        await channel.permissionOverwrites.edit(genericRole, {
          [PermissionsBitField.Flags.SendMessages]: true,
        });
        await this.logAdvanced(
          `🔓 **Déblocage de canal** : Le canal **${channel.name}** (ID: ${channelId}) a été débloqué à ${new Date().toLocaleString()}.`
        );
      } catch (error) {
        console.error(`Erreur lors du déblocage du canal ${channelId}:`, error);
      }
  
      const webhookClient = this.webhookClients.get(channelId);
      if (webhookClient) {
        try {
          await webhookClient.send('🔓 Le canal est débloqué, la surveillance continue.');
        } catch (error) {
          console.error(`Erreur lors de l'envoi du message de déblocage pour le canal ${channelId}:`, error);
        }
      }
  
      // Lancer la surveillance par sentinelle
      this.startSentinel(channel, channelId);
    }
  
    startSentinel(channel, channelId) {
      const sentinelListener = async (message) => {
        if (message.channel.id !== channelId || message.author.bot) return;
        const now = Date.now();
        let logs = this.messageLog.get(channelId) || [];
        logs.push(now);
  
        // Ajout au rapport d'attaque
        const report = this.attackReport.get(channelId);
        report.messages.push({
          time: now,
          content: message.content,
          author: message.author.tag,
          authorId: message.author.id,
        });
  
        logs = logs.filter((timestamp) => now - timestamp < timeWindow);
        this.messageLog.set(channelId, logs);
  
        if (logs.length >= spamThreshold) {
          try {
            const genericRole = message.guild.roles.cache.get(genericRoleId);
            if (!genericRole) {
              console.error(`Le rôle "générique" (ID: ${genericRoleId}) est introuvable dans le serveur pour le canal ${channelId}.`);
              return;
            }
            await channel.permissionOverwrites.edit(genericRole, {
              [PermissionsBitField.Flags.SendMessages]: false,
            });
            const webhookClient = this.webhookClients.get(channelId);
            if (webhookClient) {
              await webhookClient.send('⚠️ Le canal est de nouveau bloqué en raison de spam.');
            }
            report.count++;
            this.messageLog.set(channelId, []);
            await this.logAdvanced(
              `🔒 **Ré-blocage (sentinelle)** : Le canal **${channel.name}** (ID: ${channelId}) a été re-bloqué pour spam à ${new Date().toLocaleString()}.`
            );
          } catch (error) {
            console.error(`Erreur dans la sentinelle du canal ${channelId}:`, error);
          }
        }
      };
  
      this.client.on(Events.MessageCreate, sentinelListener);
  
      setTimeout(async () => {
        this.client.removeListener(Events.MessageCreate, sentinelListener);
        this.messageLog.set(channelId, []);
  
        const reportData = this.attackReport.get(channelId);
        const reportEmbed = this.generateReportEmbed(reportData, channelId);
        // Ici, le rapport est envoyé UNIQUEMENT dans le canal de log avancé
        await this.logAdvanced(
          `📊 **Rapport d'attaque généré** pour le canal **${channel.name}** (ID: ${channelId}) à ${new Date().toLocaleString()}.`,
          reportEmbed
        );
  
        // Réinitialiser le rapport d'attaque pour le canal
        this.attackReport.set(channelId, { count: 0, messages: [] });
      }, muteDuration);
    }
  
    generateReportEmbed(attackData, channelId) {
      const { count, messages } = attackData;
      const embed = new EmbedBuilder()
        .setTitle('Rapport des contres mesures par les sentinels')
        .setThumbnail('https://cdn-icons-gif.flaticon.com/16061/16061263.gif')
        .setDescription(`Nombre total de blocages : ${count}`)
        .setColor('#5e41d5')
        .setTimestamp();
        
      messages.forEach((msg, index) => {
        embed.addFields({
          name: `Message ${index + 1}`,
          value: `\`${new Date(msg.time).toLocaleString()}\` : ${msg.content} *(par ${msg.author})*`,
        });
      });
      return embed;
    }
  
    generateReportButtons(channelId) {
      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`ban_${channelId}`)
          .setLabel('Bannir les utilisateurs')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`clear_${channelId}`)
          .setLabel('Effacer les messages')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`report_${channelId}`)
          .setLabel('Voir le rapport')
          .setStyle(ButtonStyle.Primary),
        // Nouveau bouton pour avertir l'utilisateur
        new ButtonBuilder()
          .setCustomId(`warn_${channelId}`)
          .setLabel("Avertir l'utilisateur")
          .setStyle(ButtonStyle.Primary)
      );
      return buttons;
    }
  
    /**
     * Gère les interactions sur les boutons du rapport.
     * Les customId attendus sont "ban_{channelId}", "clear_{channelId}", "report_{channelId}" ou "warn_{channelId}".
     */
    async handleButtonInteraction(interaction) {
      if (!interaction.isButton()) return;
  
      const customId = interaction.customId;
      const [action, channelId] = customId.split('_');
      if (!channelId) return;
  
      let channel;
      try {
        channel = await this.client.channels.fetch(channelId);
      } catch (error) {
        console.error(`Erreur lors du fetch du canal ${channelId}:`, error);
        return interaction.reply({ content: "Canal introuvable.", ephemeral: true });
      }
  
      // Vérification des permissions (administrateur requis)
      if (!interaction.member.permissions.has("Administrator")) {
        return interaction.reply({ content: "Vous n'avez pas la permission d'exécuter cette action.", ephemeral: true });
      }
  
      if (action === 'ban') {
        const reportData = this.attackReport.get(channelId);
        if (!reportData || reportData.messages.length === 0) {
          return interaction.reply({ content: "Aucun utilisateur à bannir.", ephemeral: true });
        }
        // Récupérer les IDs uniques des auteurs
        const userIds = new Set();
        for (const msg of reportData.messages) {
          if (msg.authorId) userIds.add(msg.authorId);
        }
        let bannedCount = 0;
        for (const userId of userIds) {
          try {
            const member = await channel.guild.members.fetch(userId);
            if (member && member.bannable) {
              await member.ban({ reason: 'Spam détecté par le système anti-spam' });
              bannedCount++;
              await this.logAdvanced(
                `🚫 **Bannissement** : L'utilisateur **${member.user.tag}** (ID: ${member.id}) a été banni du canal **${channel.name}** (ID: ${channelId}) à ${new Date().toLocaleString()}.`
              );
              await this.logAdminAction(interaction.user, "Bannissement", `L'utilisateur **${member.user.tag}** (ID: ${member.id}) a été banni du canal **${channel.name}**.`);
            }
          } catch (error) {
            console.error(`Erreur lors du bannissement de l'utilisateur ${userId}:`, error);
          }
        }
        return interaction.reply({ content: `Bannissement effectué. ${bannedCount} utilisateur(s) banni(s).`, ephemeral: true });
      } else if (action === 'clear') {
        try {
          const messages = await channel.messages.fetch({ limit: 100 });
          const deletable = messages.filter(msg => (Date.now() - msg.createdTimestamp) < 14 * 24 * 60 * 60 * 1000);
          await channel.bulkDelete(deletable, true);
          await this.logAdvanced(
            `🗑️ **Effacement de messages** : ${deletable.size} messages ont été supprimés dans le canal **${channel.name}** (ID: ${channelId}) à ${new Date().toLocaleString()}.`
          );
          await this.logAdminAction(interaction.user, "Effacement", `${deletable.size} messages supprimés dans le canal **${channel.name}**.`);
          return interaction.reply({ content: "Les messages du canal ont été effacés.", ephemeral: true });
        } catch (error) {
          console.error(`Erreur lors de l'effacement des messages dans le canal ${channelId}:`, error);
          return interaction.reply({ content: "Erreur lors de l'effacement des messages.", ephemeral: true });
        }
      } else if (action === 'report') {
        const reportData = this.attackReport.get(channelId);
        if (!reportData) {
          return interaction.reply({ content: "Aucun rapport disponible.", ephemeral: true });
        }
        const reportEmbed = this.generateReportEmbed(reportData, channelId);
        await this.logAdminAction(interaction.user, "Consultation du rapport", `Le rapport d'attaque pour le canal **${channel.name}** a été consulté.`);
        return interaction.reply({ embeds: [reportEmbed], ephemeral: true });
      } else if (action === 'warn') {
        // Nouveau cas : avertir les utilisateurs impliqués dans le rapport
        const reportData = this.attackReport.get(channelId);
        if (!reportData || reportData.messages.length === 0) {
          return interaction.reply({ content: "Aucun utilisateur à avertir.", ephemeral: true });
        }
        // Récupérer les IDs uniques des auteurs
        const userIds = new Set();
        for (const msg of reportData.messages) {
          if (msg.authorId) userIds.add(msg.authorId);
        }
        let warnedCount = 0;
        for (const userId of userIds) {
          try {
            const member = await channel.guild.members.fetch(userId);
            if (member) {
              // Envoyer un message privé d'avertissement
              await member.send("Vous avez été averti par les modérateurs pour spam. Merci de respecter les règles du serveur.");
              warnedCount++;
              await this.logAdvanced(
                `⚠️ **Avertissement** : L'utilisateur **${member.user.tag}** (ID: ${member.id}) a reçu un avertissement pour spam dans le canal **${channel.name}** (ID: ${channelId}) à ${new Date().toLocaleString()}.`
              );
              await this.logAdminAction(interaction.user, "Avertissement", `L'utilisateur **${member.user.tag}** (ID: ${member.id}) a reçu un avertissement dans le canal **${channel.name}**.`);
            }
          } catch (error) {
            console.error(`Erreur lors de l'envoi de l'avertissement à l'utilisateur ${userId}:`, error);
          }
        }
        return interaction.reply({ content: `Avertissement envoyé à ${warnedCount} utilisateur(s).`, ephemeral: true });
      } else {
        return interaction.reply({ content: "Action inconnue.", ephemeral: true });
      }
    }
  }
  
module.exports = SpamDetector;