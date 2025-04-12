const { ApplicationCommandOptionType, ComponentType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports.run = async (client, inter) => {
  // Récupération des options de commande
  const question = inter.options.getString('question');
  const option1 = inter.options.getString('option1');
  const option2 = inter.options.getString('option2');

  // Création de l'embed initial
  const embed = new EmbedBuilder()
    .setTitle(`📊 ${question}`)
    .setDescription('Votez en utilisant les boutons ci-dessous.')
    .setColor('#d25500')
    .setFooter({ text: `Sondage créé par ${inter.user.tag}`, iconURL: inter.user.displayAvatarURL({ dynamic: true }) });

  // Création des boutons pour voter
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('poll-option1')
        .setLabel(option1)
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('poll-option2')
        .setLabel(option2)
        .setStyle(ButtonStyle.Danger)
    );

  // Envoi du message de sondage
  const message = await inter.reply({ embeds: [embed], components: [row], fetchReply: true });

  // Filtre pour les boutons (seuls les boutons "poll-option1" et "poll-option2" sont acceptés)
  const filter = i => ['poll-option1', 'poll-option2'].includes(i.customId);

  // Création du collector pour collecter les interactions pendant 60 secondes
  const collector = message.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 60000 });

  // Objets pour suivre les votes et les utilisateurs ayant déjà voté
  const votes = {
    option1: 0,
    option2: 0,
  };
  const votedUsers = new Set();

  // Fonction pour mettre à jour dynamiquement l'embed avec l'état du sondage
  const updateEmbed = () => {
    const totalVotes = votes.option1 + votes.option2;
    // Pour éviter la division par 0
    const option1Percentage = totalVotes ? Math.round((votes.option1 / totalVotes) * 100) : 0;
    const option2Percentage = totalVotes ? Math.round((votes.option2 / totalVotes) * 100) : 0;

    // Création d'une barre de progression basée sur un ratio de 10 blocs
    const progressBar = percentage => {
      const filledBlocks = Math.round(percentage / 10);
      const emptyBlocks = 10 - filledBlocks;
      return `${'█'.repeat(filledBlocks)}${'▒'.repeat(emptyBlocks)}`;
    };

    embed.setDescription(
      `${option1} (${votes.option1} votes): ${progressBar(option1Percentage)} ${option1Percentage}%\n` +
      `${option2} (${votes.option2} votes): ${progressBar(option2Percentage)} ${option2Percentage}%`
    );
  };

  // Gestion de la collecte des votes
  collector.on('collect', async i => {
    // Vérifier si l'utilisateur a déjà voté
    if (votedUsers.has(i.user.id)) {
      await i.reply({ content: 'Vous ne pouvez voter qu\'une seule fois.', ephemeral: true });
      return;
    }

    // Ajout de l'utilisateur à l'ensemble des votants et comptage du vote
    votedUsers.add(i.user.id);
    votes[i.customId === 'poll-option1' ? 'option1' : 'option2'] += 1;

    // Mise à jour de l'embed avec les nouveaux résultats
    updateEmbed();
    try {
      await i.update({ embeds: [embed] });
    } catch (error) {
      console.error(error);
    }
  });

  // Fin de la collecte des votes
  collector.on('end', async () => {
    // Désactiver les boutons afin d'empêcher de nouveaux votes
    row.components.forEach(component => component.setDisabled(true));

    // S'il y a eu des votes, ajout d'un récapitulatif final
    if (votedUsers.size > 0) {
      // Déterminer le gagnant
      let resultText = '';
      if (votes.option1 > votes.option2) {
        resultText = `Le gagnant est **${option1}** !`;
      } else if (votes.option2 > votes.option1) {
        resultText = `Le gagnant est **${option2}** !`;
      } else {
        resultText = 'Match nul !';
      }

      // Ajout d'un champ récapitulatif des résultats et mise à jour du footer
      embed.addFields({ name: 'Résultat', value: resultText });
      embed.setFooter({ text: `Sondage terminé. Créé par ${inter.user.tag}`, iconURL: inter.user.displayAvatarURL({ dynamic: true }) });
      
      // Mise à jour finale de l'embed
      updateEmbed();
      await inter.editReply({ embeds: [embed], components: [row] });
    } else {
      // Si aucun vote n'a été émis, envoi d'un message dans le canal
      inter.channel.send('Le temps est écoulé et personne n\'a voté dans le sondage.');
    }
  });
};

module.exports.help = {
  name: 'poll',
  data: {
    name: 'poll',
    description: 'Crée un sondage avec deux options',
    options: [
      {
        name: 'question',
        type: ApplicationCommandOptionType.String,
        description: 'La question du sondage',
        required: true,
      },
      {
        name: 'option1',
        type: ApplicationCommandOptionType.String,
        description: 'La première option pour le sondage',
        required: true,
      },
      {
        name: 'option2',
        type: ApplicationCommandOptionType.String,
        description: 'La deuxième option pour le sondage',
        required: true,
      },
    ],
  },
  permissions: ['KICK_MEMBERS', 'kick des membres'],
  permbot: ["KICK_MEMBERS", "kick des membres"],
};