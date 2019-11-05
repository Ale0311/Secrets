//jshint esversion:6
require('dotenv').config();

const express = require('express');
const bp = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');



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

  email: String,
  password: String

});

userSchema.plugin(passportLocalMongoose);


const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
mongoose.set('useCreateIndex', true);
//----------Setting up the schema----------//


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



app.get("/secrets", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else res.redirect("/login");
});

app.get("/logout",function(req, res) {

  req.logout();
  res.redirect("/");

});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
