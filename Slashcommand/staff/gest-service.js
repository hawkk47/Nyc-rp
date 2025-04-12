const {
    ApplicationCommandOptionType,
    ComponentType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder
  } = require('discord.js');
  const Service = require('../../models/service.js'); // Assurez-vous que le chemin est correct
  
  // Fonction pour formater une durée (ms) en une chaîne lisible
  function formatDuration(durationMs) {
    const seconds = Math.floor((durationMs / 1000) % 60);
    const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  
  module.exports.run = async (client, inter) => {
    // Vérification des permissions
    if (!inter.member.permissions.has("ADMINISTRATOR")) {
      return inter.reply({ content: "Vous n'avez pas la permission d'exécuter cette commande.", ephemeral: true });
    }
  
    const today = new Date().toLocaleDateString();
    let services = await Service.find({ day: today });
    if (services.length === 0) {
      return inter.reply({ content: "Aucune session de service trouvée pour aujourd'hui.", ephemeral: true });
    }
  
    const embed = new EmbedBuilder()
      .setTitle("Dashboard de Gestion du Service")
      .setDescription("Sélectionnez un staff dans le menu déroulant ci-dessous pour consulter les détails de sa session.")
      .setColor('#4A90E2')
      .setTimestamp();
  
    // Construire les options du select menu en récupérant aussi le pseudo via client.users.fetch
    const options = await Promise.all(services.map(async (service) => {
      let user;
      try {
        // Tente d'utiliser le cache, sinon récupère l'utilisateur depuis Discord
        user = client.users.cache.get(service.staffId) || await client.users.fetch(service.staffId);
      } catch (error) {
        user = { username: service.staffId };
      }
      const label = user.username.length > 25 ? user.username.substring(0, 22) + '...' : user.username;
      const state = service.inService ? "En service" : "Terminé";
      const desc = `${user.username} (${service.staffId}) - ${state} - Temps: ${formatDuration(service.totalTime)}`;
      return { label: label, description: desc, value: service._id.toString() };
    }));
  
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('gest-service-select')
      .setPlaceholder('Sélectionner un staff')
      .addOptions(options);
  
    const selectRow = new ActionRowBuilder().addComponents(selectMenu);
  
    // Boutons d'action
    const stopButton = new ButtonBuilder()
      .setCustomId('gest-service-stop')
      .setLabel('Stop service')
      .setStyle(ButtonStyle.Danger);
    const resetButton = new ButtonBuilder()
      .setCustomId('gest-service-reset')
      .setLabel('Reset temps')
      .setStyle(ButtonStyle.Secondary);
    const deleteButton = new ButtonBuilder()
      .setCustomId('gest-service-delete')
      .setLabel('Supprimer session')
      .setStyle(ButtonStyle.Secondary);
    const buttonRow = new ActionRowBuilder().addComponents(stopButton, resetButton, deleteButton);
  
    // Envoi de la réponse initiale (éphémère)
    const message = await inter.reply({
      embeds: [embed],
      components: [selectRow, buttonRow],
      ephemeral: true,
      fetchReply: true
    });
  
    let currentService = null;
  
    // Collecteur pour le menu déroulant
    const selectCollector = message.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 600000 // 10 minutes
    });
  
    // Collecteur pour les boutons
    const buttonCollector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 600000 // 10 minutes
    });
  
    // Gestion du select menu
    selectCollector.on('collect', async i => {
      if (i.user.id !== inter.user.id) {
        return i.reply({ content: "Vous ne pouvez pas utiliser ce menu.", ephemeral: true });
      }
      const serviceId = i.values[0];
      currentService = await Service.findById(serviceId);
      if (!currentService) {
        return i.reply({ content: "Session introuvable.", ephemeral: true });
      }
      // Récupération du pseudo
      let user;
      try {
        user = client.users.cache.get(currentService.staffId) || await client.users.fetch(currentService.staffId);
      } catch (error) {
        user = { username: currentService.staffId };
      }
      const state = currentService.inService ? "En service" : "Terminé";
      const description =
        `**Staff:** ${user.username} (ID: ${currentService.staffId})\n` +
        `**Etat:** ${state}\n` +
        `**Heure de début:** <t:${Math.floor(currentService.startTime.getTime() / 1000)}:R>\n` +
        (currentService.endTime ? `**Heure de fin:** <t:${Math.floor(currentService.endTime.getTime() / 1000)}:R>\n` : '') +
        `**Temps cumulé:** ${formatDuration(currentService.totalTime)}`;
      const detailEmbed = EmbedBuilder.from(embed).setDescription(description);
      await i.update({ embeds: [detailEmbed] });
    });
  
    // Gestion des boutons
    buttonCollector.on('collect', async i => {
      if (i.user.id !== inter.user.id) {
        return i.reply({ content: "Vous ne pouvez pas utiliser ces boutons.", ephemeral: true });
      }
      if (!currentService) {
        return i.reply({ content: "Veuillez d'abord sélectionner un staff.", ephemeral: true });
      }
      if (i.customId === 'gest-service-stop') {
        if (!currentService.inService) {
          return i.reply({ content: "Ce staff n'est pas en service.", ephemeral: true });
        }
        const now = new Date();
        currentService.endTime = now;
        currentService.inService = false;
        const sessionDuration = now.getTime() - currentService.startTime.getTime();
        currentService.totalTime += sessionDuration;
        await currentService.save();
        let user;
        try {
          user = client.users.cache.get(currentService.staffId) || await client.users.fetch(currentService.staffId);
        } catch (error) {
          user = { username: currentService.staffId };
        }
        const updatedDescription =
          `**Staff:** ${user.username} (ID: ${currentService.staffId})\n` +
          `**Etat:** Terminé\n` +
          `**Heure de début:** <t:${Math.floor(currentService.startTime.getTime() / 1000)}:R>\n` +
          `**Heure de fin:** <t:${Math.floor(currentService.endTime.getTime() / 1000)}:R>\n` +
          `**Temps cumulé:** ${formatDuration(currentService.totalTime)}`;
        const updateEmbed = EmbedBuilder.from(embed).setDescription(updatedDescription);
        await i.update({ embeds: [updateEmbed] });
      } else if (i.customId === 'gest-service-reset') {
        // Réinitialiser le temps cumulé
        currentService.totalTime = 0;
        await currentService.save();
        let user;
        try {
          user = client.users.cache.get(currentService.staffId) || await client.users.fetch(currentService.staffId);
        } catch (error) {
          user = { username: currentService.staffId };
        }
        const updatedDescription =
          `**Staff:** ${user.username} (ID: ${currentService.staffId})\n` +
          `**Etat:** ${currentService.inService ? "En service" : "Terminé"}\n` +
          `**Heure de début:** <t:${Math.floor(currentService.startTime.getTime() / 1000)}:R>\n` +
          (currentService.endTime ? `**Heure de fin:** <t:${Math.floor(currentService.endTime.getTime() / 1000)}:R>\n` : '') +
          `**Temps cumulé:** ${formatDuration(currentService.totalTime)}\n` +
          `*Le temps cumulé a été réinitialisé.*`;
        const updateEmbed = EmbedBuilder.from(embed).setDescription(updatedDescription);
        await i.update({ embeds: [updateEmbed] });
      } else if (i.customId === 'gest-service-delete') {
        // Supprimer la session
        await Service.findByIdAndDelete(currentService._id);
        // Mise à jour de la liste et reconstruction des options
        services = services.filter(s => s._id.toString() !== currentService._id.toString());
        const newOptions = await Promise.all(services.map(async service => {
          let user;
          try {
            user = client.users.cache.get(service.staffId) || await client.users.fetch(service.staffId);
          } catch (error) {
            user = { username: service.staffId };
          }
          const label = user.username.length > 25 ? user.username.substring(0, 22) + '...' : user.username;
          const state = service.inService ? "En service" : "Terminé";
          const desc = `${user.username} (${service.staffId}) - ${state} - Temps: ${formatDuration(service.totalTime)}`;
          return { label: label, description: desc, value: service._id.toString() };
        }));
        selectMenu.setOptions(newOptions);
        currentService = null;
        await i.update({
          content: "Session supprimée.",
          embeds: [embed],
          components: [new ActionRowBuilder().addComponents(selectMenu), buttonRow]
        });
      }
    });
  
    // À la fin des collectors, désactiver les composants
    const disableComponents = () => {
      selectMenu.setDisabled(true);
      stopButton.setDisabled(true);
      resetButton.setDisabled(true);
      deleteButton.setDisabled(true);
    };
  
    selectCollector.on('end', async () => {
      disableComponents();
      await inter.editReply({
        components: [
          new ActionRowBuilder().addComponents(selectMenu),
          new ActionRowBuilder().addComponents(stopButton, resetButton, deleteButton)
        ]
      });
    });
  
    buttonCollector.on('end', async () => {
      disableComponents();
      await inter.editReply({
        components: [
          new ActionRowBuilder().addComponents(selectMenu),
          new ActionRowBuilder().addComponents(stopButton, resetButton, deleteButton)
        ]
      });
    });
  };
  
  module.exports.help = {
    name: "gest-service",
    data: {
      name: "gest-service",
      description: "Dashboard de gestion des services de staff.",
      options: []
    },
    permissions: ['ADMINISTRATOR', 'MANAGE_MESSAGES'],
    permbot: ['ADMINISTRATOR', 'MANAGE_MESSAGES'],
  };
  