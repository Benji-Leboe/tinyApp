const express = require('express');
const app = express();
const port = 8080;

let urlDB = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get('/', (req, res) => {
  res.send('Howdy!');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDB);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.listen(port, () => {
  console.log(`Example server listening on port ${port}.`);
});