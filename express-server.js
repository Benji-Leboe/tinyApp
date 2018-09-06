"use strict";

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();
const port = 8080;
const { check, validationResult } = require('express-validator/check');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());


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

app.get('/', (req, res) => {
  //render index
  let tempVars = {username: req.cookies.username};
  res.render('pages/index', tempVars);
});

app.get('/about', (req, res) => {
  //render about
  let tempVars = {username: req.cookies.username};
  res.render('pages/about', tempVars);
});

app.get('/urls', (req, res) => {
  //render url index and display db contents
  let tempVars = {username: req.cookies.username, urls: urlDB};
  res.render('pages/urls_index', tempVars);
});

app.get('/urls/new', (req, res) => {
  //render new URL page
  let tempVars = {username: req.cookies.username};
  res.render('pages/urls_new', tempVars);
});

app.get('/urls/:id', (req, res) => {
  //get url id
  let shortURLs = req.params.id;
  let tempVars = {username: req.cookies.username, shortURL: shortURLs, longURL: urlDB[shortURLs]}
  res.render('pages/urls_show', tempVars);
});

app.post('/urls', (req, res) => {
  //get longURL and append to DB with random gen key
  let urlString = "";
  let check = new RegExp('http');
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

app.post('/login', [
  //check for min username length
  check('userLogin').isLength({min: 2})
],(req, res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    res.status(422).json({errors: errors.array()});
  }
  let username = req.body.userLogin;
  res.cookie('username', username);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie("username");
  res.redirect('/');
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

app.listen(port, () => {
  console.log(`TinyApp express server listening on port ${port}.`);
});

