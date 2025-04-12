const { model, Schema } = require('mongoose')
module.exports = model('logs', Schema({
    guild_id: { type: String },
    author_id: { type: String },
    channel_id: { type: String },
    name: { type: String },
}))