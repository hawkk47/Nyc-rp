const { 
    EmbedBuilder, 
    ButtonBuilder, 
    ActionRowBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle,
    AttachmentBuilder,
    InteractionCollector
  } = require("discord.js");
  const { createCanvas } = require("canvas");
  const client = require("../index").client;
  
  // Génère un code captcha aléatoire (6 caractères)
  function generateCaptcha() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
    
  // Génère l'image du captcha à partir du code avec canvas
  function generateCaptchaImage(captchaCode) {
    const width = 250;
    const height = 100;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
  
    // Remplissage du fond avec une couleur claire
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, width, height);
  
    // Optionnel : ajout de bruit (lignes aléatoires)
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = '#' + Math.floor(Math.random() * 16777215).toString(16);
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.lineTo(Math.random() * width, Math.random() * height);
      ctx.stroke();
    }
  
    // Affichage du texte captcha en noir, centré
    ctx.font = "bold 48px sans-serif";
    ctx.fillStyle = "#000000";
    const textWidth = ctx.measureText(captchaCode).width;
    const x = (width - textWidth) / 2;
    const y = (height + 48) / 2; // 48 correspond à la taille de la police
    ctx.fillText(captchaCode, x, y);
  
    return canvas.toBuffer();
  }
    
  client.on("guildMemberAdd", async (member) => {
    if (member.user.bot) return;
    
    // Remplacez ces valeurs par vos identifiants réels
    const welcomeChannelID = "900494935554412616";  // Salon de bienvenue
    const captchaChannelID = "900494935554412616";    // Salon dédié au captcha
    const verifiedRoleID = "901236111014252544";       // Rôle à attribuer après validation
    
    const welcomeChannel = client.channels.cache.get(welcomeChannelID);
    const captchaChannel = client.channels.cache.get(captchaChannelID);
    
    if (!welcomeChannel) {
      console.error("Canal de bienvenue introuvable !");
      return;
    }
    if (!captchaChannel) {
      console.error("Canal de captcha introuvable !");
      return;
    }
    
    // Envoi d'un message en DM invitant l'utilisateur à se rendre dans le salon captcha
    await member.send(
      `<@${member.id}> Bienvenue sur le serveur ! Pour accéder au serveur, veuillez vous rendre dans <#${captchaChannelID}> et compléter le captcha.`
    );
    
    // --- Système de captcha dans le salon dédié ---
    
    let captchaCode = generateCaptcha();
    let attempts = 0;
    const maxAttempts = 3;
    
    // Construit l'embed contenant l'image captcha et le nombre de tentatives restantes
    async function buildCaptchaEmbed() {
      const imageBuffer = generateCaptchaImage(captchaCode);
      let attachment = null;
      const embed = new EmbedBuilder()
        .setTitle("🔒 Vérification Captcha 🔒")
        .setDescription(`Veuillez saisir le code visible sur l'image ci-dessous.\nTentatives restantes : **${maxAttempts - attempts}**`)
        .setColor("#3498db")
        .setFooter({ text: "Vous avez 60 secondes pour répondre." });
      if (imageBuffer) {
        attachment = new AttachmentBuilder(imageBuffer, { name: "captcha.png" });
        embed.setImage("attachment://captcha.png");
      }
      return { embed, attachment };
    }
    
    // Rafraîchit le captcha : nouveau code et réinitialisation du compteur
    async function refreshCaptcha() {
      captchaCode = generateCaptcha();
      attempts = 0;
      return buildCaptchaEmbed();
    }
    
    // Création des boutons "Saisir le code" et "Rafraîchir"
    const enterButton = new ButtonBuilder()
      .setLabel("Saisir le code")
      .setCustomId("enter_code")
      .setStyle(ButtonStyle.Primary);
    const refreshButton = new ButtonBuilder()
      .setLabel("Rafraîchir")
      .setCustomId("refresh_captcha")
      .setStyle(ButtonStyle.Secondary);
    const buttonsRow = new ActionRowBuilder().addComponents(enterButton, refreshButton);
    
    // Construction initiale du message captcha
    let { embed, attachment } = await buildCaptchaEmbed();
    const messageData = {
      content: `<@${member.id}>`,
      embeds: [embed],
      components: [buttonsRow],
    };
    if (attachment) messageData.files = [attachment];
    
    // Envoi du message de captcha dans le salon dédié
    const captchaMsg = await captchaChannel.send(messageData);
    
    // Collector pour les interactions sur les boutons (limité au membre)
    const buttonsCollector = captchaMsg.createMessageComponentCollector({
      filter: (interaction) => interaction.user.id === member.id,
      time: 60000,
    });
    
    // Collector dédié aux modals pour la saisie du code
    const modalCollector = new InteractionCollector(client, {
      filter: (i) => i.isModalSubmit() && i.customId === "captchaModal" && i.user.id === member.id,
      time: 60000,
    });
    
    let isVerified = false;
    
    buttonsCollector.on("collect", async (interaction) => {
      if (interaction.customId === "refresh_captcha") {
        const newData = await refreshCaptcha();
        embed = newData.embed;
        if (newData.attachment) {
          await captchaMsg.edit({ embeds: [embed], files: [newData.attachment], components: [buttonsRow] });
        } else {
          await captchaMsg.edit({ embeds: [embed], components: [buttonsRow] });
        }
        if (!interaction.deferred && !interaction.replied) {
          await interaction.reply({ content: "🔄 Captcha rafraîchi.", ephemeral: true });
        }
      } else if (interaction.customId === "enter_code") {
        // Construction et affichage du modal pour saisir le code
        const modal = new ModalBuilder()
          .setCustomId("captchaModal")
          .setTitle("Vérification Captcha");
    
        const codeInput = new TextInputBuilder()
          .setCustomId("captcha_input")
          .setLabel("Entrez le code affiché")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);
    
        const modalRow = new ActionRowBuilder().addComponents(codeInput);
        modal.addComponents(modalRow);
    
        await interaction.showModal(modal);
      }
    });
    
    modalCollector.on("collect", async (modalInteraction) => {
      const userInput = modalInteraction.fields.getTextInputValue("captcha_input");
      if (userInput.trim().toUpperCase() === captchaCode.toUpperCase()) {
        // Captcha validé : attribution du rôle
        const role = member.guild.roles.cache.get(verifiedRoleID);
        if (role) {
          await member.roles.add(role).catch(console.error);
        }
        isVerified = true;
        if (!modalInteraction.deferred && !modalInteraction.replied) {
          await modalInteraction.reply({ content: "✅ Captcha validé avec succès !", ephemeral: true });
        }
        buttonsCollector.stop("validated");
        modalCollector.stop("validated");
        // Désactivation des boutons pour empêcher de nouvelles interactions
        const disabledComponents = captchaMsg.components.map(row => {
          const newRow = ActionRowBuilder.from(row);
          newRow.components = row.components.map(component => ButtonBuilder.from(component).setDisabled(true));
          return newRow;
        });
        await captchaMsg.edit({ components: disabledComponents });
      } else {
        // Saisie incorrecte : incrémenter le compteur de tentatives
        attempts++;
        if (attempts >= maxAttempts) {
          if (!modalInteraction.deferred && !modalInteraction.replied) {
            await modalInteraction.reply({ content: "❌ Nombre maximum de tentatives atteint.", ephemeral: true });
          }
          buttonsCollector.stop("max_attempts");
          modalCollector.stop("max_attempts");
        } else {
          if (!modalInteraction.deferred && !modalInteraction.replied) {
            await modalInteraction.reply({ content: `❌ Code incorrect. Il vous reste **${maxAttempts - attempts}** tentative(s).`, ephemeral: true });
          }
        }
        const updatedEmbed = EmbedBuilder.from(embed).setDescription(
          `Veuillez saisir le code visible sur l'image ci-dessous.\nTentatives restantes : **${maxAttempts - attempts}**`
        );
        await captchaMsg.edit({ embeds: [updatedEmbed] });
      }
    });
    
    buttonsCollector.on("end", async (_, reason) => {
      if (!isVerified) {
        try {
          await member.send("⏳ Vous n'avez pas validé le captcha à temps ou avez échoué. Vous serez expulsé du serveur.")
            .catch(console.error);
        } catch (err) {
          console.error("Erreur lors de l'envoi du DM :", err);
        }
        // Optionnel : expulsion du membre en cas d'échec
        // await member.kick("Échec du captcha").catch(console.error);
    
        const disabledComponents = captchaMsg.components.map(row => {
          const newRow = ActionRowBuilder.from(row);
          newRow.components = row.components.map(component => ButtonBuilder.from(component).setDisabled(true));
          return newRow;
        });
        await captchaMsg.edit({ components: disabledComponents });
      }
    });
  });
  