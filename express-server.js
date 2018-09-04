"use strict";

const express = require('express');
const app = express();
const port = 8080;

app.set('view engine', 'ejs');

let urlDB = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


app.get('/', (req, res) => {
  res.render('pages/index');
})

app.get('/urls', (req, res) => {
  let tempVars = {urls: urlDB};
  res.render('pages/urls_index', tempVars);
});

app.get('/urls/:id', (req, res) => {
  let tempVars = {shortURL: req.params.id}
  res.render('pages/urls_show', tempVars);
});

app.get('/about', (req, res) => {
  res.render('pages/about');
});



app.listen(port, () => {
  console.log(`Example server listening on port ${port}.`);
});