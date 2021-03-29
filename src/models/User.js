const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const Category = require('./Category.js');
const Purchase = require('./Purchase.js');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error({ error: 'Email is not valid!' });
      }
    }
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minLength: [6, 'Password must contain at least 6 characters!'],
    validate(value) {
      if (value.toLowerCase().includes('password')) {
        throw new Error({ error: "Password cannot contain 'password'" });
      }
    }
  },
  tokens: [
    {
      token: {
        type: String,
        required: true
      }
    }
  ],
  avatar: {
    type: Buffer
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationKey: {
    type: String,
    trim: true
  }
});

// Virtual column - purchases
userSchema.virtual('purchases', {
  ref: 'Purchase',
  foreignField: 'author',
  localField: '_id'
});

// Virtual column - categories
userSchema.virtual('categories', {
  ref: 'Category',
  foreignField: 'author',
  localField: '_id'
});

// generate jwt token
userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

  user.tokens = user.tokens.concat({ token });
  await user.save();

  return token;
};

// Hiding private data like password and tokens
userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar;
  delete userObject.verificationKey;

  return userObject;
};

// Find and return user by his email and password
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) throw new Error({ error: 'Unable to login!' });

  const isMatched = await bcrypt.compare(password, user.password);

  if (!isMatched) throw new Error({ error: 'Unable to login!' });

  return user;
};

// Hash the plain user password before saving
userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

// Delete user's purchases and categories when user is removed
userSchema.pre('remove', async function (next) {
  const user = this;
  await Category.deleteMany({ author: user._id });
  await Purchase.deleteMany({ author: user._id });
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
