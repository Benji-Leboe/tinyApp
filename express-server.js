"use strict";

const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const port = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

let urlDB = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString(){
  let string = "";
  for(let i = 0; i <= 6; i++){
    string += Math.random().toString(36).substr(2, 15)
  }
  return string.substr(1,6);
}

app.get('/', (req, res) => {
  //render index
  res.render('pages/index');
})

app.get('/about', (req, res) => {
  //render about
  res.render('pages/about');
});

app.get('/urls', (req, res) => {
  //render url index and display db contents
  let tempVars = {urls: urlDB};
  res.render('pages/urls_index', tempVars);
});

app.get('/urls/new', (req, res) => {
  res.render('pages/urls_new');
});

app.get('/urls/:id', (req, res) => {
  //get url id
  let shortURLs = req.params.id;
  let tempVars = {shortURL: shortURLs, longURL: urlDB[shortURLs]}
  res.render('pages/urls_show', tempVars);
});

app.post('/urls', (req, res) => {
  //get longURL and append to DB with random gen key
  let urlString = req.body.longURL;
  let randomString = generateRandomString();
  urlDB[randomString] = `http://${urlString}`;
  res.redirect(`/urls/${randomString}`);
});

app.post('/urls/:id/delete', (req, res) => {
  let urlID = req.params.id;
  delete urlDB[urlID];
  res.redirect('/urls');
})

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

