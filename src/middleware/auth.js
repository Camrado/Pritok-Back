const jwt = require('jsonwebtoken');
const User = require('../models/User.js');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

    if (!user) return res.status(406).send();

    req.token = token;
    req.user = user;
    next();
  } catch (e) {
    if (e.name == 'JsonWebTokenError') return res.status(406).send();
    res.status(500).send(e);
  }
};

module.exports = auth;
