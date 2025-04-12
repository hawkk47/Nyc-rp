const Bot = require('./class/bot.js')
const { Events, Collection, EmbedBuilder, GatewayIntentBits, REST, Routes, ContextMenuCommandAssertions, IntentsBitField } = require('discord.js');
const intents = new IntentsBitField(3276799)
const client = new Bot({ intents: intents, partials: [
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMembers, 
    GatewayIntentBits.GuildWebhooks, 
    GatewayIntentBits.GuildMembers, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.GuildScheduledEvents,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildMessageReactions,
]
})


module.exports.client = client
client.initialize()

// connexion à mongodb
const config = require("./config.json")
const mongoose = require('mongoose')

const { mongooseConnectionString } = require('./config.json')
mongoose.connect(mongooseConnectionString, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
})
    .then(() => console.log('connection à mongodb avec succès')).catch((err) => {
        console.log(err)
    })


client.login(config.token)