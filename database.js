const mongoose = require('mongoose')
const Schema = mongoose.Schema

mongoose.connect('mongodb+srv://loliticos:list@cluster0-ghogp.mongodb.net/test?retryWrites=true', { useNewUrlParser: true })

const User = new Schema({
	_id: { type: String, required: true },
	money: { type: Number, default: 0 },
	trabalho: { type: Number, default: 0 }
})

const Guild = new Schema({
	_id: { type: String, required: true },
	prefix: { type: String, default: 'y!' },
	language: { type: String, default: 'pt-br' },
  welcomeMessage: { type: String, default: false },
  welcomeChannel: { type: String, default: false },
  logChannel: { type: String, default: false },
  leftMessage: { type: String, default: false },
  leftChannel: { type: String, default: false }
})


const Users = mongoose.model("Users", User);
const Guilds = mongoose.model("Guilds", Guild);
exports.Guilds = Guilds
exports.Users = Users
