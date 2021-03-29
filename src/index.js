const express = require('express');
const cors = require('cors');
require('./db/mongoose.js');
const purchaseRouter = require('./router/purchase.js');
const categoryRouter = require('./router/category.js');
const userRouter = require('./router/user.js');

const app = express();
const port = process.env.PORT;

app.use(cors());

app.use(express.json());
app.use(purchaseRouter, categoryRouter, userRouter);

app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
