"use strict";

const express = require('express');
const app = express();
const port = 8080;

app.set('view engine', 'ejs');


//index
app.get('/', (req, res) => {
  let things = [
    {name: 'Thing 1', role: 'The first thing'},
    {name: 'Thing 2', role: 'The second thing'},
    {name: 'Thing 3', role: 'The third thing'}
  ];

  let tagline = 'Uh oh where did these things come from?';

  res.render('pages/index', {
    things: things,
    tagline: tagline
  });
});

//about
app.get('/about', (req, res) => {
  res.render('pages/about');
});

app.listen(port);
console.log(`Listening on port ${port}...`)
