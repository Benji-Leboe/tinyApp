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

app.listen(port, () => {
  console.log(`Example server listening on port ${port}.`);
});