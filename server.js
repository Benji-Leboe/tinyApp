const express = require('express');
const app = express();
const port = 8080;

app.set('view engine', 'ejs');


//index
app.get('/', (req, res) => {
  res.render('pages/index');
});

//about
app.get('/about', (req, res) => {
  res.render('pages/about');
});

app.listen(port);
console.log(`Listening on port ${port}...`)
