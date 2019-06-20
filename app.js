
const express = require("express");

const { Permissions } = require("discord.js");

const request = require("request");

const bt = require("btoa");

const { REDIRECT_URI, ID, SECRET} = process.env

const app = express()

const Client = require('./structures/client.js')

const client = Client()

const database = require('./database.js')

app.set('trust proxy', 1);

const session = require("express-session");

app.use(session({ secret: 'keyboard cat', cookie: { }, resave: false,saveUninitialized: true,}))

const bodyParser = require('body-parser')
app.use( bodyParser.json() );       
  app.use(bodyParser.urlencoded({     
    extended: true
})); 

app.get("/logout", function(req, res) {
  if(req.session.user) req.session.user = null
  return res.redirect("/")
})

app.get("/commands", function(req, res) {
  res.render("commands.ejs", {
    
   logged: req.session.user,

   user: req.session.user ? req.session.user : "",
    
  client: client
  })
})

app.get("/",function(req,res){

  res.render("index.ejs",{

   logged: req.session.user,

   user: req.session.user ? req.session.user : "",
    
   client: client

})

})

app.get("/log",function(req,res){

      res.redirect(`https://discordapp.com/api/oauth2/authorize?client_id=${id}&redirect_uri=${redirect_uri}`) // sim voce pode por isso direto no href se quiser

})

app.get("/login",async function (req, res) {

   if (!req.query.code) return res.redirect("/");

   request({

       method: 'POST', url: `https://discordapp.com/api/oauth2/token?grant_type=authorization_code&code=${req.query.code}&redirect_uri=${redirect_uri}`, headers: {

           Authorization: `Basic ${bt(id + ":" + secret)}`

       }

   }, function (_, _, body) {

       const json = JSON.parse(body);
     
       let url = 'https://discordapp.com/api/users/@me/guilds'
       let headers = {'Authorization': 'Bearer '  + json['access_token']}

       request({

           method: 'GET',

           url: url,

           headers: headers

       }, async function (_, _, guildBody) {

           guildBody = JSON.parse(guildBody)

           if (!guildBody) return res.redirect("/");

           req.session.guilds = guildBody
         
   let userUrl = 'https://discordapp.com/api/users/@me'
     
     request({
       
       method: 'GET',
       
       url: userUrl,
       
       headers: headers
     }, async function(_, _, userBody) {
        userBody = JSON.parse(userBody)

        if (!userBody.id) return res.redirect("/");

        req.session.user = userBody
       
       res.redirect('/dashboard')
       
     })

      })

   })
})


app.get("/dashboard", async function(req, res) {
  
  if(!req.session.user) return res.redirect('/log')
    
  
  res.render('dashboard.ejs', {
    
   logged: req.session.user,
    
   client: client,
    
   perm: Permissions,
    
   user: req.session.user ? req.session.user : "",
    
   guilds: req.session.guilds ? req.session.guilds : "",
    
  database: database
    
  })
});

app.post("/config/change", async function(req,res){
    const { guild, prefix, language } = req.body
    
    if(!guild) return res.end("Inválido")
  
    if(!prefix && !language) return res.end("É necessário informar o prefixo ou a linguagem")
  
    const data = await database.Guilds.findOne({_id: guild})  
    
    if(prefix) {
      data.prefix = prefix
    }
  
    if(language) {
      data.language = language
    }
  
    data.save()
    return console.log('Prefixo alterado')
})

app.post("/config/welcome", async function(req, res) {
  const { guild, welcomeMessage, leftMessage, channel } = req.body
      
  const guildGiven = client.guilds.get(guild);
  
  if(!guildGiven) return res.redirect("/404")
  
  if(!channel) return res.end("É necessário informar o canal")
  
      
  const givenChannel = guildGiven.channels.get(channel)
    
  const data = await database.Guilds.findOne({_id: guild})
  
  if(!data) {
    const newGuild = database.Guilds({
      _id: guild.id
    })
    
    newGuild.save()
    return res.end("Informe as informações novamente, o servidor não estava registrado no meu banco de dados")
  }
  
  
  if(!leftMessage && !welcomeMessage) return res.end("É necessário informar a mensagem de boas-vindas ou de saída")
  
  if(welcomeMessage) data.welcomeMessage = welcomeMessage
  if(leftMessage) data.leftMessage = leftMessage
    
  data.welcomeChannel = givenChannel.id
  data.leftChannel = givenChannel.id
  data.save()
  console.log("Canal atualizado")
})

app.post("/config/logs", async function(req, res) {
  const { guild, channel } = req.body
      
  const guildGiven = client.guilds.get(guild);
  
  if(!guildGiven) return res.redirect("/404")
  
  if(!channel) return res.end("É necessário informar o canal")
        
  const givenChannel = guildGiven.channels.get(channel)
    
  const data = await database.Guilds.findOne({_id: guild})
  
  if(!data) {
    const newGuild = database.Guilds({
      _id: guild.id
    })
    
    newGuild.save()
    return res.end("Informe as informações novamente, o servidor não estava registrado no meu banco de dados")
  }
    
  data.logChannel = givenChannel.id
  data.save()
  console.log("Canal atualizado")
})

app.get("/dashboard/:id", async function(req, res) {
  
  if(!req.session.user) return res.redirect('/log')
    
  const guild = client.guilds.get(req.params.id);
  
  if(!guild) return res.redirect('/404');
  
  const guilds = req.session.guilds
  
  for(let x = 0; x < guilds.length; x++) {
    if(guilds[x].id == req.params.id) {
      const newPerm = new Permissions(guilds[x].permissions)
      
      if(newPerm.has("MANAGE_GUILD") || newPerm.has("ADMINISTRATOR") || guilds[x].owner == true ) {
        res.render("config.ejs", {

         logged: req.session.user,

         client: client,

         perm: Permissions,

         user: req.session.user ? req.session.user : "",

         guild: guild ? guild : "",

         database: database
        })   
      } else {
        res.redirect('/dashboard')
      }
    }
  }
})

app.get("/dashboard/:id/logs", async function(req, res) {
  
  if(!req.session.user) return res.redirect('/log')
    
  const guild = client.guilds.get(req.params.id);
  
  if(!guild) return res.redirect('/404');
  
  const guilds = req.session.guilds
  
  for(let x = 0; x < guilds.length; x++) {
    if(guilds[x].id == req.params.id) {
      const newPerm = new Permissions(guilds[x].permissions)
      
      if(newPerm.has("MANAGE_GUILD") || newPerm.has("ADMINISTRATOR") || guilds[x].owner == true ) {
        res.render("logs.ejs", {

         logged: req.session.user,

         client: client,

         perm: Permissions,

         user: req.session.user ? req.session.user : "",

         guild: guild ? guild : "",

         database: database
        })   
      } else {
        res.redirect('/dashboard')
      }
    }
  }
})

app.get("/dashboard/:id/welcome", async function(req, res) {
  
  if(!req.session.user) return res.redirect('/log')
    
  const guild = client.guilds.get(req.params.id);
  
  if(!guild) return res.redirect('/404');
  
  const guilds = req.session.guilds
  
  for(let x = 0; x < guilds.length; x++) {
    if(guilds[x].id == req.params.id) {
      const newPerm = new Permissions(guilds[x].permissions)
      
      if(newPerm.has("MANAGE_GUILD") || newPerm.has("ADMINISTRATOR") || guilds[x].owner == true ) {
        res.render("welcome.ejs", {

         logged: req.session.user,

         client: client,

         perm: Permissions,

         user: req.session.user ? req.session.user : "",

         guild: guild ? guild : "",

         database: database
        })   
      } else {
        res.redirect('/dashboard')
      }
    }
  }
})

app.use('/assets', express.static('assets'));


app.use(function(req, res, next) {
  res.status(404).render("error.ejs", {
    
    logged: req.session.user,

    user: req.session.user ? req.session.user : "",
    
    guilds: req.session.guilds ? req.session.guilds : "",
    
    database: database,
    
    client: client

  })
});


app.listen(process.env.PORT, function() {
	console.log('Servidor on');
});
