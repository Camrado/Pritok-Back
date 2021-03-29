const express = require('express');
const Search = require('@smakss/search');
const auth = require('../middleware/auth.js');
const verified = require('../middleware/verified.js');
const Purchase = require('../models/Purchase.js');
const router = new express.Router();

// Get array of dates between two dates
Date.prototype.addDays = function (days) {
  let date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

function getDates(startDate, stopDate) {
  let dateArray = new Array();
  let currentDate = startDate;
  while (currentDate <= stopDate) {
    dateArray.push(new Date(currentDate));
    currentDate = currentDate.addDays(1);
  }
  return dateArray;
}

// Get all purchases
router.get('/purchase', auth, verified, async (req, res) => {
  const match = {};

  if (req.query.fromDate && req.query.toDate) {
    let fromDate = new Date(req.query.fromDate);
    let toDate = new Date(req.query.toDate);
    match.date = getDates(fromDate, toDate);
  }

  try {
    await req.user
      .populate({
        path: 'purchases',
        match,
        options: { sort: { date: 'asc' } }
      })
      .execPopulate();

    let purchases = JSON.parse(JSON.stringify(req.user.purchases));
    let searched = Search({ searchText: req.query.search, searchItems: purchases });

    res.send(pagination(searched, req.query.limit, req.query.skip));
  } catch (e) {
    res.status(500).send(e);
  }
});

function pagination(arr, limit, skip) {
  for (skip; skip > 0; skip--) {
    arr.shift();
  }

  let res = [];

  for (let i = 0; i < limit; i++) {
    if (arr[i] != null) res.push(arr[i]);
  }

  return res;
}

// Get number of pages by limit, fromDate and toDate properties
router.get('/purchase/page-num', auth, verified, async (req, res) => {
  const match = {};

  if (req.query.fromDate && req.query.toDate) {
    let fromDate = new Date(req.query.fromDate);
    let toDate = new Date(req.query.toDate);
    match.date = getDates(fromDate, toDate);
  }

  try {
    await req.user
      .populate({
        path: 'purchases',
        match,
        options: {
          sort: { date: 'asc' }
        }
      })
      .execPopulate();

    let purchases = JSON.parse(JSON.stringify(req.user.purchases));
    let final = Search({ searchText: req.query.search, searchItems: purchases });
    res.send(`${Math.ceil(final.length / req.query.limit)}`);
  } catch (e) {
    res.status(500).send(e);
  }
});

// Get purchase by its id
router.get('/purchase/:id', auth, verified, async (req, res) => {
  try {
    const purchase = await Purchase.findOne({ _id: req.params.id, author: req.user._id });
    if (!purchase) return res.status(404).send({ error: 'Purchase Not Found!' });
    res.send(purchase);
  } catch (e) {
    res.status(500).send(e);
  }
});

// Create a purchase
router.post('/purchase', auth, verified, async (req, res) => {
  try {
    const purchase = new Purchase({ ...req.body, author: req.user._id });
    await purchase.save();
    res.send('Purchase was successfully created!');
  } catch (e) {
    res.status(500).send(e);
  }
});

// Update a purchase
router.put('/purchase/:id', auth, verified, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['date', 'category', 'item', 'price', 'quantity', 'total_price'];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid Updated!' });
  }

  try {
    const purchase = await Purchase.findOne({ _id: req.params.id, author: req.user._id });

    if (!purchase) return res.status(404).send({ error: 'Purchase Not Found!' });

    updates.forEach((update) => (purchase[update] = req.body[update]));
    await purchase.save();
    res.send('Purchase was successfully updated!');
  } catch (e) {
    res.status(500).send(e);
  }
});

// Delete a purchase
router.delete('/purchase/:id', auth, verified, async (req, res) => {
  try {
    const purchase = await Purchase.findOneAndDelete({ _id: req.params.id, author: req.user._id });
    if (!purchase) return res.status(404).send({ error: 'Purchase Not Found!' });
    res.send('Purchase was successfully deleted!');
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;
