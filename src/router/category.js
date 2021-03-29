const express = require('express');
const Search = require('@smakss/search');
const auth = require('../middleware/auth.js');
const verified = require('../middleware/verified.js');
const Category = require('../models/Category.js');
const router = new express.Router();

// Get all categories
router.get('/category', auth, verified, async (req, res) => {
  try {
    await req.user
      .populate({
        path: 'categories',
        options: { sort: { name: 'asc' } }
      })
      .execPopulate();

    if (!req.query.search && !req.query.limit && !req.query.skip) return res.send(req.user.categories);

    let categories = JSON.parse(JSON.stringify(req.user.categories));
    let searched = Search({ searchText: req.query.search, searchItems: categories });

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

// Get number of pages by limit property
router.get('/category/page-num', auth, verified, async (req, res) => {
  try {
    await req.user
      .populate({
        path: 'categories',
        options: {
          sort: { name: 'asc' }
        }
      })
      .execPopulate();

    let categories = JSON.parse(JSON.stringify(req.user.categories));
    let final = Search({ searchText: req.query.search, searchItems: categories });
    res.send(`${Math.ceil(final.length / req.query.limit)}`);
  } catch (e) {
    res.status(500).send(e);
  }
});

// Get category by its id
router.get('/category/:id', auth, verified, async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, author: req.user._id });
    if (!category) return res.status(404).send({ error: 'Category Not Found!' });
    res.send(category);
  } catch (e) {
    res.status(500).send(e);
  }
});

// Create a category
router.post('/category', auth, verified, async (req, res) => {
  try {
    const category = new Category({ ...req.body, author: req.user._id });
    await category.save();
    res.send('Category was successfully created!');
  } catch (e) {
    if (e.name === 'MongoError' && e.code === 11000)
      return res.status(400).send({ error: 'This category name is already taken!' });
    res.status(500).send(e);
  }
});

// Update a category
router.put('/category/:id', auth, verified, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'description'];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid Updated!' });
  }

  try {
    const category = await Category.findOne({ _id: req.params.id, author: req.user._id });

    if (!category) return res.status(404).send({ error: 'Category Not Found!' });

    updates.forEach((update) => (category[update] = req.body[update]));
    await category.save();
    res.send('Category was successfully updated!');
  } catch (e) {
    res.status(500).send(e);
  }
});

// Delete a category
router.delete('/category/:id', auth, verified, async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({ _id: req.params.id, author: req.user._id });
    if (!category) return res.status(404).send({ error: 'Category Not Found!' });
    res.send('Category was successfully deleted!');
  } catch (e) {
    res.status(500).send(e);
  }
});

// router.post('/category/all', async (req, res) => {
//   try {
//     req.body.forEach(async (categoryBody) => {
//       delete categoryBody['ID'];
//       const category = new Category(categoryBody);
//       await category.save();
//     });
//     res.status(201).send('All categories were successfully created!');
//   } catch (e) {
//     res.status(500).send(e);
//   }
// });

module.exports = router;
