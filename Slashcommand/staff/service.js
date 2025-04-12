const { ApplicationCommandOptionType, ComponentType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Service = require('../../models/service.js'); // Assurez-vous que le chemin est correct

// Fonction d'aide pour formater une durée (en ms) en chaîne lisible
function formatDuration(durationMs) {
  const seconds = Math.floor((durationMs / 1000) % 60);
  const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  return `${hours}h ${minutes}m ${seconds}s`;
}

module.exports.run = async (client, inter) => {
  // On utilise le format de date locale pour identifier le jour (ex: "15/04/2025")
  const today = new Date().toLocaleDateString();

  // Vérifier si l'utilisateur est actuellement en service
  let activeService = await Service.findOne({ staffId: inter.user.id, inService: true });
  let embed;

  if (activeService) {
    // Si en service : calcul de la durée actuelle (du démarrage jusqu'à maintenant)
    const currentDuration = Date.now() - activeService.startTime.getTime();
    // La durée cumulée est la somme du total déjà enregistré et de la durée en cours
    const totalDuration = activeService.totalTime + currentDuration;
    embed = new EmbedBuilder()
      .setTitle('🟢 Service en cours')
      .setDescription(`Vous êtes en service depuis ${formatDuration(currentDuration)}.\nTemps cumulés aujourd'hui : ${formatDuration(totalDuration)}\nDémarré : <t:${Math.floor(activeService.startTime.getTime() / 1000)}:R>`)
      .setColor('#50E3C2')
      .setFooter({ text: `Service pour ${inter.user.tag}`, iconURL: inter.user.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();
  } else {
    // Si non en service, on recherche un enregistrement pour le jour courant (même s'il est terminé)
    let existingSession = await Service.findOne({ staffId: inter.user.id, day: today });
    if (!existingSession) {
      // Créer un nouvel enregistrement si aucun n'existe pour aujourd'hui
      existingSession = new Service({
        staffId: inter.user.id,
        startTime: new Date(),
        inService: true,
        day: today,
        totalTime: 0
      });
      await existingSession.save();
      activeService = existingSession;
    } else {
      // Si un enregistrement existe pour aujourd'hui et n'est pas en service, on le met à jour pour reprendre le service
      existingSession.startTime = new Date();
      existingSession.inService = true;
      await existingSession.save();
      activeService = existingSession;
    }

    embed = new EmbedBuilder()
      .setTitle('🟢 Service en cours')
      .setDescription(`Votre service a débuté.\nTemps cumulés aujourd'hui : ${formatDuration(activeService.totalTime)}\nDémarré : <t:${Math.floor(activeService.startTime.getTime() / 1000)}:R>`)
      .setColor('#50E3C2')
      .setFooter({ text: `Service pour ${inter.user.tag}`, iconURL: inter.user.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();
  }

  // Boutons de commande
  const startButton = new ButtonBuilder()
    .setCustomId('start-service')
    .setLabel('Prendre le service')
    .setStyle(ButtonStyle.Success)
    .setDisabled(!!activeService); // Désactivé si déjà en service

  const stopButton = new ButtonBuilder()
    .setCustomId('stop-service')
    .setLabel('Stopper')
    .setStyle(ButtonStyle.Danger)
    .setDisabled(!activeService); // Désactivé si pas en service

  const row = new ActionRowBuilder().addComponents(startButton, stopButton);

  // Envoi de l'embed avec les boutons
  const message = await inter.reply({ embeds: [embed], components: [row], fetchReply: true });

  // Utilisation d'un collector avec une durée longue (ici 24h pour permettre des sessions étendues)
  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 86400000 // 24h
  });

  collector.on('collect', async i => {
    // Limiter l'interaction au même utilisateur
    if (i.user.id !== inter.user.id) {
      return i.reply({ content: 'Vous ne pouvez pas utiliser ces boutons.', ephemeral: true });
    }

    if (i.customId === 'start-service') {
      // Vérifier à nouveau au cas où le service serait déjà actif
      let active = await Service.findOne({ staffId: i.user.id, inService: true });
      if (active) {
        return i.reply({ content: 'Vous êtes déjà en service.', ephemeral: true });
      }
      
      // Reprise du service sur la session existante pour aujourd'hui ou création d'une nouvelle si nécessaire
      let session = await Service.findOne({ staffId: i.user.id, day: today });
      if (session) {
        session.startTime = new Date();
        session.inService = true;
        await session.save();
      } else {
        session = new Service({
          staffId: i.user.id,
          startTime: new Date(),
          inService: true,
          day: today,
          totalTime: 0
        });
        await session.save();
      }

      // Mise à jour de l'embed
      const description = `Votre service a débuté.\nTemps cumulés aujourd'hui : ${formatDuration(session.totalTime)}\nDémarré : <t:${Math.floor(session.startTime.getTime() / 1000)}:R>`;
      embed = new EmbedBuilder()
        .setTitle('🟢 Service en cours')
        .setDescription(description)
        .setColor('#50E3C2')
        .setFooter({ text: `Service pour ${i.user.tag}`, iconURL: i.user.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();
      
      // Mise à jour des boutons
      startButton.setDisabled(true);
      stopButton.setDisabled(false);
      await i.update({ embeds: [embed], components: [row] });

    } else if (i.customId === 'stop-service') {
      // Récupération de la session active
      let active = await Service.findOne({ staffId: i.user.id, inService: true });
      if (!active) {
        return i.reply({ content: "Vous n'êtes pas en service actuellement.", ephemeral: true });
      }
      const now = new Date();
      active.endTime = now;
      active.inService = false;
      // Calcul de la durée de la session en cours
      const sessionDuration = now.getTime() - active.startTime.getTime();
      active.totalTime += sessionDuration;
      await active.save();

      const description = `Votre service est terminé.\nDurée de la session : ${formatDuration(sessionDuration)}\nTemps cumulés aujourd'hui : ${formatDuration(active.totalTime)}\nDébut : <t:${Math.floor(active.startTime.getTime() / 1000)}:R>\nFin : <t:${Math.floor(now.getTime() / 1000)}:R>`;
      embed = new EmbedBuilder()
        .setTitle('🔴 Service terminé')
        .setDescription(description)
        .setColor('#d25500')
        .setFooter({ text: `Service pour ${i.user.tag} terminé`, iconURL: i.user.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      // Mise à jour des boutons
      startButton.setDisabled(false);
      stopButton.setDisabled(true);
      await i.update({ embeds: [embed], components: [row] });
    }
  });

  // À la fin du collector, désactive les boutons
  collector.on('end', async () => {
    startButton.setDisabled(true);
    stopButton.setDisabled(true);
    await inter.editReply({ components: [row] });
  });
};

module.exports.help = {
  name: 'service',
  data: {
    name: 'service',
    description: 'Gère le service du staff et cumule le temps quotidien.', // Assurez-vous que cette description est inférieure à 100 caractères
    options: []
  },
  permissions: ['SEND_MESSAGES', 'SEND_MESSAGES'],
  permbot: ['SEND_MESSAGES', "MANAGE_MESSAGES"],
};
