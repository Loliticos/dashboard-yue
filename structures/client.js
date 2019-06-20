const { Client } = require("discord.js")
const client = new Client()

client.getUsers = user => {
  return this.users.find(u => u.username.toLowerCase().includes(user.toLowerCase()))
}

client.login(process.env.TOKEN)
module.exports =  () => client.users ? client : null
