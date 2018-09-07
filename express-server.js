"use strict";

const dotenv = require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const app = express();
const port = 8080;


app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json());
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));


let urlDB = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString(){
  let string = "";
  for(let i = 0; i <= 6; i++){
    string += Math.random().toString(36).substr(2, 15);
  }
  return string.substr(1,6);
}

//error variable
let errors = "";

//GET 

app.get('/', (req, res) => {
  //render index
  let tempVars = {username: req.session.username};
  res.render('pages/index', tempVars);
});

app.get('/about', (req, res) => {
  //render about
  let tempVars = {username: req.session.username};
  res.render('pages/about', tempVars);
});

app.get('/urls', (req, res) => {
  //render url index and display db contents
  let tempVars = {username: req.session.username, urls: urlDB};
  res.render('pages/urls_index', tempVars);
});

app.get('/urls/new', (req, res) => {
  //render new URL page
  let tempVars = {username: req.session.username};
  res.render('pages/urls_new', tempVars);
});

app.get('/urls/:id', (req, res) => {
  //get url id
  let shortURLs = req.params.id;
  let tempVars = {username: req.session.username, shortURL: shortURLs, longURL: urlDB[shortURLs]}
  res.render('pages/urls_show', tempVars);
});

app.get('/register', (req, res) => {
  //render registration page
  let tempVars = {username: req.session.username, errors: errors};
  res.render('pages/register', tempVars);
});

app.get('/u/:shortURL', (req, res) => {
  //redirect to long URL from localhost:8080/u/shortURL
  let longURL = urlDB[req.params.shortURL];
  //check for valid shortened URL
  if(!longURL){
    res.statusCode = 404;
    res.send("Invalid short URL\n");
  }else{
    res.statusCode = 302;
    res.redirect(longURL);
  }
});

//POST

app.post('/urls', (req, res) => {
  //get longURL and append to DB with random gen key
  let urlString = "";
  let check = new RegExp('http');
  //check if longURL is http format
  if(check.test(req.body.longURL)){
    urlString = req.body.longURL;
  }else{
    urlString = `http://${req.body.longURL}`
  }
  let randomString = generateRandomString();
  urlDB[randomString] = urlString;
  res.redirect(`/urls/${randomString}`);
});

app.post('/urls/:id', (req, res) => {
  //edit destination URL
  let newURL = "";
  //check if longURL is http format
  let check = new RegExp('http');
  if(check.test(req.body.longURL)){
    newURL = req.body.longURL;
  }else{
    newURL = `http://${req.body.longURL}`
  }
  let urlID = req.params.id;
  urlDB[urlID] = newURL;
  res.redirect('/urls');
});

app.post('/urls/:id/delete', (req, res) => {
  //delete URL
  let urlID = req.params.id;
  delete urlDB[urlID];
  res.redirect('/urls');
});

//User DB and POST register
let userDB = [
  {username: 'example', passwordHash: 'hashedPword'}
];

app.post('/register', (req, res) => {
  let username = req.body.userLogin;
  let password = req.body.password;
  let passwordCheck = req.body.passwordConfirmation;
  //check for errors
  
  userDB.forEach((user) => {
    if(user.username === username){
      console.log("DB username:", user.username, "Check value:", username);
      res.statusCode = 400;
      errors = `"${username}" is already taken!`;
    }else if(username.length < 5){
      console.log("Username must be at least 5 characters!");
      res.statusCode = 400;
      errors = 'Username must be at least 5 characters!';
    }
    res.render('pages/register', {errors: errors, username: username});
  });
  if(password.length < 5){
    console.log("Password must be at least 5 characters!");
    res.statusCode = 400;
    errors = 'Password must be at least 5 characters!';
    res.render('/register', {errors: errors})
  }else if(passwordCheck !== req.body.password) {
    console.log("Password:", req.body.password, "Confirmation:", passwordCheck);
    res.statusCode = 400;
    errors = 'Password and confirmation do not match!';
    res.render('pages/register', {errors: errors, username: username})
  }else{
    //handle POST request
    let passwordHash = bcrypt.genSaltSync(10, (err, salt) => {
      bcrypt.hash(password, salt, (err, hash) => {
        return hash;
      });
    });
    
    userDB.push({username, passwordHash});
    res.session = username;
    res.redirect('/');
  } 
});

// **TODO: DEAL WITH PASSWORD FIELD, CHECK USERNAME AGAINST DB**
app.post('/login', (req, res) => {
  //login to site
  let username = req.body.userLogin;
  //check against existing username in userDB 
  userDB.forEach((user) => {
    if(username.length < 1){
      res.statusCode = 400;
      res.send('Please enter a username.')
    }else if(username !== user.username){
      res.statusCode = 400;
      res.send('Username does not exist!');
    }
  });
  res.session = username;
  res.redirect('/');
});

app.post('/logout', (req, res) => {
  //logout 
  req.session = null;
  res.clearCookie("username");
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`TinyApp express server listening on port ${port}.`);
});

