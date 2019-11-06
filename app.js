//jshint esversion:6
require('dotenv').config();
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

const express = require('express');
const bp = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');

const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require('mongoose-findorcreate');


const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bp.urlencoded({
  extended: true
}));

//----------Starting the session----------//

app.use(session({
  secret: 'Our little secret!...',
  resave: false,
  saveUninitialized: false,
  //cookie: { secure: true }
}));

//----------Starting the session----------//

//----------Starting the passport----------//

app.use(passport.initialize());
app.use(passport.session());

//----------Starting the passport----------//



mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

//----------Setting up the schema----------//
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = mongoose.model('User', userSchema);

//----------Setting up the schema----------//


//----------Creating the strategy for normal registration----------//
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

//----------Creating the strategy for normal registration----------//

//----------Creating the strategy for GOOGLE registration----------//

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileUrl: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    //  console.log(profile);
    User.findOrCreate({
      username: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));

//----------Creating the strategy for GOOGLE registration----------//

//----------Creating the strategy for FACEBOOK registration----------//

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_ID,
    clientSecret: process.env.FACEBOOK_SECRET,

    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
  //  console.log(profile);
    User.findOrCreate({
      username: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));

//----------Creating the strategy for FACEBOOK registration----------//



mongoose.set('useCreateIndex', true);


app.get("/", function(req, res) {

  res.render("home");
});

app.get("/login", function(req, res) {

  res.render("login");
});

app.post("/login", function(req, res) {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err) {
    if (err) console.log(err);

    else {

      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }

  });


});

app.get("/register", function(req, res) {

  res.render("register");
});

app.post("/register", function(req, res) {

  User.register({
    username: req.body.username
  }, req.body.password, function(err, user) {

    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {

      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });

    }
  });


});

app.get("/auth/google",

  passport.authenticate("google", {
    scope: ['profile']
  })
);

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/google/secrets',
  passport.authenticate('google', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, redirect to the secrets page.
    res.redirect('/secrets');
  });

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });



app.get("/secrets", function(req, res) {

  User.find ( {"secret": {$ne:null}},function(err,foundUsers){

    if(err) console.log(err);
    else {
      if(foundUsers){
        res.render("secrets",{usersWithSecrets:foundUsers});


      }

    }

  });
});

app.get("/submit", function(req, res) {

  if (req.isAuthenticated()) {
    res.render("submit");
  } else res.redirect("/login");

});

app.post("/submit", function(req, res) {

  const theSecret = req.body.secret;
console.log(req.user.id);
  //passport saves the user details in req.user

  User.findById(req.user.id, function(err, foundUser) {

    if (err) console.log(err);
    else if (foundUser) {
      foundUser.secret=theSecret;
      foundUser.save(function() {

        res.redirect("/secrets");
      });

    }


  });


});

app.get("/logout", function(req, res) {

  req.logout();
  res.redirect("/");

});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
