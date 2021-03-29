const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  }
});

// Change the format it returns
categorySchema.methods.toJSON = function () {
  const category = this;
  const categoryObject = category.toObject();

  delete categoryObject.__v;

  return categoryObject;
};

const Category = new mongoose.model('Category', categorySchema);

module.exports = Category;
