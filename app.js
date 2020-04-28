//jshint esversion:6
require("dotenv").config();
const express = require("express");

const app = express();
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
// const cookieParser = require('cookie-parser');
//const cookieSession = require('cookie-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
//const md5 = require("md5");

const findOrCreate = require("mongoose-findorcreate");

//encription:: const encrypt = require("mongoose-encryption");
//where to look for our css ,adding public folder as a static resource
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.set('view engine', 'ejs');


//session
//WE TELL OUR APP to use the session package that we acquired up
//a nd initialize somne initial settings
// app.use(cookieSession({
//     name: 'session',
//     keys: "123"
// }));
// app.use(cookieSession({
//     maxAge: 24 * 60 * 60 * 1000, // One day in milliseconds
//     keys: 'randomstringhere'
// }));
//app.use(cookieParser()); //move cookie parser middleware before session to avoid req.session .touch is not a method
app.use(session({
  secret: "This is my secret",
  resave: false,
  saveUninitialized: false
  // cookie: { secure: true }
}));
//cookie

//To start using passport initialize it with initialize() method it comes with it in bundler
app.use(passport.initialize());
//use passport to deal with the session
app.use(passport.session());

//MongoDB
mongoose.set('useCreateIndex', true);
mongoose.connect("mongodb://localhost:27017/secretDB", {
  useNewUrlParser: true
});
mongoose.set("useCreateIndex", true);
// mongoose.set("useCreateIndex",true);


//for passport it has to be mongoose schema not js simple js object
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: [String]
});
//This is what we are going to use to hash and salt our passowrd
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
//encription:: userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});
const User = new mongoose.model("User", userSchema);

//passport local configuration
passport.use(User.createStrategy());
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
//for local as well as other serialization capability
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo" //not use google plus for public profile as it is depriecated
  }, //callback which will happpen after google authentication
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));

//GET
//req.session.destroy is the call to use if you are using express-session npm module. However, you are using cookie-session which in its current version does not define req.session.destroy resulting in the error that you are getting.

//To destroy the session while using cookie-session , you just need to set it to null: req.session = null. If you decide to use express-session instead, then req.session.destroy would work.



app.get("/", function(req, res) {
  res.render("home");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});
//1.Authenticate them on google server asking them for their users profile once logged in
//2.Gives back PROFILE
//3.Redirect to auth/google/secrets make a get request on this route,where they are authenticated locally

app.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile']

  }));

//This STRING ROUTE has to match what we specified to Google previously
//This authentication will happen locally and SAVE their LOGIN session

app.get('/auth/google/secrets', //google istead of local

  passport.authenticate('google', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    //req.session.token = req.user.token;
    //Successful authentication, redirect to Secret page
    res.redirect('/secrets');
  });


// app.get('/', (req, res) => {
//     if (req.session.token) {
//         res.cookie('token', req.session.token);
//         res.json({
//             status: 'session cookie set'
//         });
//     } else {
//         res.cookie('token', '');
//         res.json({
//             status: 'session cookie not set'
//         });
//     }
// });

app.get("/secrets", function(req, res) {

  if (req.user) {
    console.log("SECRETs page :::::" + req.user);
    const userId = req.user.id;
    console.log("USER ID::" + userId);
    User.findById(userId, function(err, userFound) {
      console.log("USER FOUND::::" + userFound);
      res.render("secrets", {
        secrets: userFound.secret
      });
    });
  } else {
    res.redirect("/login");
  }
});
// User.find(function(err,foundUsers){
//   if (req.isAuthenticated) { //session id cookie is checkedR ::::::
//     res.render("secrets",{
//       secrets : foundUsers
//     });
//      //if only authenticared then render page
//   } else {
//     console.log(err);
//     res.redirect("/login");
//   }
// });


app.post("/secrets", function(req, res) {

});

app.get("/logout", function(req, res) {
      req.logout();
      req.session.regenerate(function(err) {
    // will have a new session here
  })
      if (req.session) {
        req.session.destroy((err) => {
            if (err) {
              console.log(err);
            } else {
            //  req.session.cookie.expires = true;
              res.clearCookie('connect.sid');
              res.redirect('/login');
            }
});
}
        });
      //  });
      //}


      //});
      //       req.user = null;
      //       req.session = null;
      //       res.clearCookie("test");
      // res.clearCookie("test.sig");

      //res.redirect('/'); //Inside a callback… bulletproof!



      //     req.session = null;
      //   //   auth2.signOut().then(function () {
      //   //   console.log('User signed out.');
      //   // });
      //


      //   //req.logout();
      // //req.session.destroy();
      //   //res.redirect('/login');
      //   req.session.destroy(function() {
      //     res.clearCookie('connect.sid');
      //     res.redirect('/login');
      // });

      //process.env.PROJECT_TITLE.toLowerCase());
      //  res.clearCookie(`${process.env.PROJECT_TITLE.toLowerCase()}.sig`);




      app.post("/register", function(req, res) {
        //this method comes from passport-local- mongoose
        User.register({
          username: req.body.username
        }, req.body.password, function(err, user) {
          if (err) {
            console.log(err);
          } else {
            console.log("HERE IS POST REGISTER USER::" + user);
            passport.authenticate("local")(req, res, function(err) {
              if (err) {
                console.log(err);
              } else {
                res.redirect("/secrets");
              }
            });
          }
          //logged in session saved
        });
      });

      app.post("/login", function(req, res) {

        if (req.isAuthenticated === false) { //so that empty login no error
          const user = new User({
            username: req.body.username,
            passowrd: req.body.password
          }); //this info is sent for authentication

          req.login(user, function(err) {
            if (err) {
              res.redirect("/login");
            } else {
              console.log(user);
              passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
              });
            }
          });
        } else {
          res.redirect("/login");
        }
      });

      app.get("/submit", function(req, res) {
        if (req.isAuthenticated) { //session id cookie is checked
          res.render("submit"); //only authenticared then render page
        } else {
          console.log(err);
          res.redirect("/login");
        }
      });

      //how do we know who the current user is
      app.post("/submit", function(req, res) {
        const secret = req.body.secret;
        //console.log(req.user);
        User.findById(req.user.id, function(err, foundUser) {
          if (!err) {
            if (foundUser) {
              foundUser.secret.push(secret);
              foundUser.save(function() {

                res.redirect("/secrets");

              });
            }
          } else {
            console.log(err);
          }
        });
      });

      app.listen(3000, function() {
        console.log("Listening Successfully at port 3000");
      });
