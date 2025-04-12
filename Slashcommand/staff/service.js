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
  // Vérifier si l'utilisateur a déjà un service en cours dans la base
  let activeService = await Service.findOne({ staffId: inter.user.id, inService: true });
  const inService = Boolean(activeService);

  // Créer un embed dynamique selon l'état du service
  let embed;
  if (inService) {
    const startTime = activeService.startTime;
    const durationMs = Date.now() - startTime.getTime();
    const duration = formatDuration(durationMs);
    embed = new EmbedBuilder()
      .setTitle('🟢 Service en cours')
      .setDescription(`Vous êtes en service depuis ${duration}.\nDémarré : <t:${Math.floor(startTime.getTime() / 1000)}:R>`)
      .setColor('#50E3C2')
      .setFooter({ text: `Service pour ${inter.user.tag}`, iconURL: inter.user.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();
  } else {
    embed = new EmbedBuilder()
      .setTitle('🔴 Vous n’êtes pas en service')
      .setDescription('Cliquez sur **Prendre le service** pour démarrer votre service.')
      .setColor('#d25500')
      .setFooter({ text: `Service pour ${inter.user.tag}`, iconURL: inter.user.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();
  }

  // Création des boutons
  const startButton = new ButtonBuilder()
    .setCustomId('start-service')
    .setLabel('Prendre le service')
    .setStyle(ButtonStyle.Success)
    .setDisabled(inService); // Désactivé si déjà en service

  const stopButton = new ButtonBuilder()
    .setCustomId('stop-service')
    .setLabel('Stopper')
    .setStyle(ButtonStyle.Danger)
    .setDisabled(!inService); // Désactivé si non en service

  const row = new ActionRowBuilder().addComponents(startButton, stopButton);

  // Envoi de l'embed avec les boutons
  const message = await inter.reply({ embeds: [embed], components: [row], fetchReply: true });

  /* Nous utilisons ici un collector de composants. Pour un système de service qui peut durer plusieurs heures,
     il est préférable d'utiliser une durée assez longue (ici 24h = 86400000 ms). */
  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 86400000 // 24 heures
  });

  collector.on('collect', async i => {
    // Seul l'utilisateur ayant lancé la commande peut interagir avec ces boutons
    if (i.user.id !== inter.user.id) {
      return i.reply({ content: 'Vous ne pouvez pas utiliser ces boutons.', ephemeral: true });
    }

    // Gestion du bouton "Prendre le service"
    if (i.customId === 'start-service') {
      // Vérifie si, au cas où, un service actif existe déjà
      let alreadyActive = await Service.findOne({ staffId: i.user.id, inService: true });
      if (alreadyActive) {
        return i.reply({ content: 'Vous êtes déjà en service.', ephemeral: true });
      }
      // Créer un nouvel enregistrement dans la base
      const newService = new Service({
        staffId: i.user.id,
        startTime: new Date(),
        inService: true,
        day: new Date().toLocaleDateString()
      });
      await newService.save();

      // Mise à jour de l'embed après le démarrage du service
      const startTime = newService.startTime;
      const duration = formatDuration(0);
      embed = new EmbedBuilder()
        .setTitle('🟢 Service en cours')
        .setDescription(`Vous êtes en service depuis ${duration}.\nDémarré : <t:${Math.floor(startTime.getTime() / 1000)}:R>`)
        .setColor('#50E3C2')
        .setFooter({ text: `Service pour ${i.user.tag}`, iconURL: i.user.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      // Mettre à jour l'état des boutons
      startButton.setDisabled(true);
      stopButton.setDisabled(false);

      await i.update({ embeds: [embed], components: [row] });

    // Gestion du bouton "Stopper"
    } else if (i.customId === 'stop-service') {
      // Récupérer l'enregistrement du service actif
      let activeService = await Service.findOne({ staffId: i.user.id, inService: true });
      if (!activeService) {
        return i.reply({ content: "Vous n'êtes pas en service actuellement.", ephemeral: true });
      }
      activeService.endTime = new Date();
      activeService.inService = false;
      await activeService.save();

      // Calculer la durée du service
      const durationMs = activeService.endTime.getTime() - activeService.startTime.getTime();
      const duration = formatDuration(durationMs);

      // Mise à jour de l'embed pour indiquer que le service est terminé
      embed = new EmbedBuilder()
        .setTitle('🔴 Service terminé')
        .setDescription(`Votre service est terminé.\nDurée : ${duration}\nDébut : <t:${Math.floor(activeService.startTime.getTime() / 1000)}:R>\nFin : <t:${Math.floor(activeService.endTime.getTime() / 1000)}:R>`)
        .setColor('#d25500')
        .setFooter({ text: `Service pour ${i.user.tag} terminé`, iconURL: i.user.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      // Réactiver le bouton "Prendre le service" et désactiver "Stopper"
      startButton.setDisabled(false);
      stopButton.setDisabled(true);

      await i.update({ embeds: [embed], components: [row] });
    }
  });

  // Quand le collector expire, désactiver les boutons
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
    description: 'Permet au staff de prendre ou stopper son service. Les données (date, heure, durée) sont enregistrées dans MongoDB.',
    options: []
  },
  permissions: ['SEND_MESSAGES', "SEND_MESSAGES"],
  permbot: ['SEND_MESSAGES', "SEND_MESSAGES"],
};