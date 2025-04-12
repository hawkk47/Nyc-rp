const axios = require('axios')
const { models } = require('../../models/index')
const config = require('../../config.json')
const { date } = require('../../class/date.js')
const Discord = require('discord.js')
const ms = require('ms')
const { ApplicationCommandType, ApplicationCommandOptionType ,EmbedBuilder} = require('discord.js');

module.exports.run = async (client, inter) => {
    let member = inter.options.getMember("membre")
    let time = ms(inter.options.getString("temps"))
    let reason = inter.options.getString("reason")

    if(!time) inter.reply("Merci de donner un temps")
    console.log(member)
    member.timeout(time, reason)
    inter.reply(`Le membre : ${member} a été timeout\npendant : ${time} miliseconde.`)
}
module.exports.help = {
    name: "timeout",
    data: {
            name: "timeout",
            description: "timeout/mute un membre ",
            options: [{
                name: "membre",
                description: "Le membre a timeout",
                type: ApplicationCommandOptionType.User,
                required: true
            }, {
                name: "temps",
                description: "temps du timeout",
                type: ApplicationCommandOptionType.String,
                required: true
            },{
                name: "raison",
                description: "La raison du timeout",
                type: ApplicationCommandOptionType.String,
                required: true
            }]
    },
    permissions: ['MANAGE_MESSAGE', 'Gérer les messages'],
    permbot: ["MANAGE_CHANNEL", "Gérer les salons"]
}