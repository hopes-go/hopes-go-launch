require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api', routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`hopes-go-launch listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});
