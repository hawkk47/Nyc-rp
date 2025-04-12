const { model, Schema } = require('mongoose')
module.exports = model('captcha', Schema({
    guild: { type: String },
    channel: { type : String },
    role: {type : String},
    etat : {type: Boolean, default: false}
}));