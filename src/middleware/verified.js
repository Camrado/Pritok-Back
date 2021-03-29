const verified = (req, res, next) => {
  try {
    if (req.user.isVerified === false) throw new Error();

    next();
  } catch (e) {
    res.status(400).send({ error: 'You need to verify your account before accessing these features.' });
  }
};

module.exports = verified;
