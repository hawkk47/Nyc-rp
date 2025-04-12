const { ApplicationCommandOptionType, ComponentType, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports.run = async (client, inter) => {
  // Récupération des paires question/réponse fournies dans la commande
  const q1 = inter.options.getString('question1');
  const a1 = inter.options.getString('answer1');
  const q2 = inter.options.getString('question2');
  const a2 = inter.options.getString('answer2');
  const q3 = inter.options.getString('question3');
  const a3 = inter.options.getString('answer3');
  const q4 = inter.options.getString('question4');
  const a4 = inter.options.getString('answer4');
  const q5 = inter.options.getString('question5');
  const a5 = inter.options.getString('answer5');

  // Construction d'un tableau des entrées FAQ en ne gardant que les paires complètes
  const faqOptions = [];
  if (q1 && a1) faqOptions.push({ label: q1, value: 'faq0', answer: a1 });
  if (q2 && a2) faqOptions.push({ label: q2, value: 'faq1', answer: a2 });
  if (q3 && a3) faqOptions.push({ label: q3, value: 'faq2', answer: a3 });
  if (q4 && a4) faqOptions.push({ label: q4, value: 'faq3', answer: a4 });
  if (q5 && a5) faqOptions.push({ label: q5, value: 'faq4', answer: a5 });

  // Vérifier qu'au moins une FAQ a été définie
  if (faqOptions.length === 0) {
    return inter.reply({ content: "Vous devez fournir au moins une paire question/réponse.", ephemeral: true });
  }

  // Création de l'embed initial avec des éléments visuels améliorés
  const embed = new EmbedBuilder()
    .setTitle('📚 FAQ Personnalisable')
    .setDescription("Sélectionnez une question dans le menu déroulant ci-dessous pour afficher la réponse correspondante.")
    .setColor('#4A90E2')
    .setThumbnail('https://via.placeholder.com/150')
    .setImage('https://via.placeholder.com/600x200')
    .setFooter({ text: `FAQ personnalisable - demandée par ${inter.user.tag}`, iconURL: inter.user.displayAvatarURL({ dynamic: true }) })
    .setTimestamp();

  // Création du menu déroulant pour la FAQ
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('faq-select-custom')
    .setPlaceholder('Choisissez une question')
    .addOptions(
      faqOptions.map(option => {
        // Le label du select menu ne peut pas dépasser 25 caractères (on tronque si besoin)
        let label = option.label;
        if (label.length > 25) label = label.substring(0, 22) + '...';
        return {
          label: label,
          description: 'Cliquez pour voir la réponse',
          value: option.value
        };
      })
    );

  // Intégration du menu dans une ligne d'action
  const row = new ActionRowBuilder().addComponents(selectMenu);

  // Envoi de l'embed initial avec le menu déroulant
  const message = await inter.reply({ embeds: [embed], components: [row], fetchReply: true });

  // Collector pour intercepter les interactions sur le select menu, limité à 60 secondes
  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: 60000
  });

  collector.on('collect', async i => {
    // Restriction : Seul l'utilisateur ayant initié la commande peut interagir
    if (i.user.id !== inter.user.id) {
      return i.reply({ content: "Désolé, vous n'êtes pas autorisé(e) à utiliser ce menu.", ephemeral: true });
    }

    // Recherche de l'entrée FAQ correspondant à la valeur sélectionnée
    const selectedValue = i.values[0];
    const selectedFAQ = faqOptions.find(option => option.value === selectedValue);

    // Mise à jour de l'embed pour afficher la réponse
    const answerEmbed = EmbedBuilder.from(embed)
      .setTitle(selectedFAQ.label)
      .setDescription(`**Réponse :**\n${selectedFAQ.answer}`)
      .setColor('#50E3C2')
      .setFooter({ text: `FAQ personnalisable - réponse affichée`, iconURL: inter.user.displayAvatarURL({ dynamic: true }) });

    await i.update({ embeds: [answerEmbed] });
  });

  // Désactivation du menu lorsque le collector expire
  collector.on('end', async () => {
    row.components[0].setDisabled(true);
    await inter.editReply({ components: [row] });
  });
};

module.exports.help = {
  name: 'faqcustom',
  data: {
    name: 'faqcustom',
    description: 'Crée une FAQ personnalisable via des options de commande',
    options: [
      {
        name: 'question1',
        type: ApplicationCommandOptionType.String,
        description: 'La première question de la FAQ',
        required: true,
      },
      {
        name: 'answer1',
        type: ApplicationCommandOptionType.String,
        description: 'La réponse associée à la première question',
        required: true,
      },
      {
        name: 'question2',
        type: ApplicationCommandOptionType.String,
        description: 'La deuxième question de la FAQ (optionnel)',
        required: false,
      },
      {
        name: 'answer2',
        type: ApplicationCommandOptionType.String,
        description: 'La réponse associée à la deuxième question (optionnel)',
        required: false,
      },
      {
        name: 'question3',
        type: ApplicationCommandOptionType.String,
        description: 'La troisième question de la FAQ (optionnel)',
        required: false,
      },
      {
        name: 'answer3',
        type: ApplicationCommandOptionType.String,
        description: 'La réponse associée à la troisième question (optionnel)',
        required: false,
      },
      {
        name: 'question4',
        type: ApplicationCommandOptionType.String,
        description: 'La quatrième question de la FAQ (optionnel)',
        required: false,
      },
      {
        name: 'answer4',
        type: ApplicationCommandOptionType.String,
        description: 'La réponse associée à la quatrième question (optionnel)',
        required: false,
      },
      {
        name: 'question5',
        type: ApplicationCommandOptionType.String,
        description: 'La cinquième question de la FAQ (optionnel)',
        required: false,
      },
      {
        name: 'answer5',
        type: ApplicationCommandOptionType.String,
        description: 'La réponse associée à la cinquième question (optionnel)',
        required: false,
      }
    ]
  },
  permissions: [],
  permbot: [],
};
