const { model, Schema } = require('mongoose')
module.exports = model('warn', Schema({
    warnid: { type: String },
    guild_id: { type: String },
    user_id: { type: String },
    reason: { type: String },
    date: { type: String },
    moderator: { type: String },
}))