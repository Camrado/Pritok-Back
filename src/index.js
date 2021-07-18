const express = require('express');
const cors = require('cors');
require('./db/mongoose.js');
const purchaseRouter = require('./router/purchase.js');
const categoryRouter = require('./router/category.js');
const userRouter = require('./router/user.js');

const app = express();
const port = process.env.PORT;

let whitelist = ['https://pritok.herokuapp.com', 'http://pritok.herokuapp.com', 'http://localhost:8100'];
let corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(purchaseRouter, categoryRouter, userRouter);

app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});

// some new comment