
const express = require("express");

const { Permissions } = require("discord.js")

const request = require("request");

const bt = require("btoa");

const {redirect_uri,id,secret} = require("./config.json")

const app = express()

const Client = require('./structures/client.js')

const database = require('./database.js')

app.set('trust proxy', 1);

const session = require("express-session");

app.use(session({ secret: 'keyboard cat', cookie: { }, resave: false,saveUninitialized: true,}))

app.get("/logout", function(req, res) {
  if(req.session.user) req.session.user = null
  return res.redirect("/")
})

app.get("/",function(req,res){

  res.render("index.ejs",{

   logged: req.session.user,

   user: req.session.user ? req.session.user : "",
    
   database: database

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
  
  const client = Client()
  
  
  res.render('dashboard.ejs', {
    
   logged: req.session.user,
    
   client: client,
    
   perm: Permissions,
    
   user: req.session.user ? req.session.user : "",
    
   guilds: req.session.guilds ? req.session.guilds : "",
    
  database: database
    
  })
});

app.get("/dashboard/:id", async function(req, res) {
  
  if(!req.session.user) return res.redirect('/log')
  
  const client = Client();
  
  const guild = client.guilds.get(req.params.id);
  
  if(!guild) return res.redirect('/404');
    

  
})

app.use(function(req, res, next) {
  res.status(404).render("error.ejs", {
    
    logged: req.session.user,

    user: req.session.user ? req.session.user : "",
    
    guilds: req.session.guilds ? req.session.guilds : "",
    
    database: database

  })
});


app.listen(process.env.PORT, function() {
	console.log('Servidor on');
});
