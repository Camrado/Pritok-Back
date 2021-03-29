const express = require('express');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const User = require('../models/User.js');
const auth = require('../middleware/auth.js');
const router = new express.Router();

// Get profile
router.get('/users/me', auth, async (req, res) => {
  res.send(req.user);
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MY_MAIL,
    pass: process.env.MY_MAIL_PASSWORD
  }
});

// Create a user - Sign up
router.post('/users', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    const token = await user.generateAuthToken();

    // Verifying account
    const verificationKey = Math.floor(100000 + Math.random() * 900000);

    user.verificationKey = verificationKey;
    await user.save();

    res.send({ user, token });

    // Sending email
    transporter.sendMail(
      {
        from: `Pritok - Email Confirmation <${process.env.MY_MAIL}>`,
        to: user.email,
        subject: 'Email Confirmation',
        text: `  Hello ${user.name}!

  Are you ready to gain access to all of the assets we prepared for clients of Pritok? First, you must complete your registration by copying this code and pasting it in our site:
      
  ${verificationKey}
      
  This code will confirm your email address, and then you’ll officially be a part of the Pritok community.
      
  See you there! 
  Best regards, the Pritok team`
      },
      (error, info) => {
        if (error) res.status(400).send(error);
      }
    );
  } catch (e) {
    if (e.name === 'MongoError' && e.code === 11000) return res.status(400).send({ error: 'This email is already taken!' });
    res.status(500).send(e);
  }
});

// Send verification email again
router.get('/users/me/send-verification-email', auth, async (req, res) => {
  if (req.user.isVerified) return res.status(400).send({ error: "You've already confirmed your e-mail" });

  try {
    const verificationKey = Math.floor(100000 + Math.random() * 900000);

    req.user.verificationKey = verificationKey;
    req.user.save();

    // Sending email
    transporter.sendMail(
      {
        from: `Pritok - Email Confirmation <${process.env.MY_MAIL}>`,
        to: req.user.email,
        subject: 'Email Confirmation',
        text: `  Hello ${req.user.name}!

  It seems you didn't confirm your account and you want to fix it. So here is your confirmation code:
      
  ${verificationKey}
      
  This code will confirm your email address, and then you’ll officially be a part of the Pritok community.
      
  See you there! 
  Best regards, the Pritok team`
      },
      (error, info) => {
        if (error) return res.status(400).send({ error: 'Something went wrong...' });
      }
    );

    res.send({ success: 'Email has been sent' });
  } catch (e) {
    res.status(400).send(e);
  }
});

// Verify account
router.post('/users/me/verify', auth, async (req, res) => {
  if (req.user.isVerified) return res.status(400).send({ error: "You've already confirmed your e-mail" });

  try {
    if (req.body.verificationKey == req.user.verificationKey) {
      req.user.isVerified = true;
      await req.user.save();
      res.send({ success: 'Your account was successfully confirmed!' });
    } else {
      res.status(400).send({ error: 'Confirmation key is not correct!' });
    }
  } catch (e) {
    res.status(400).send(e);
  }
});

// Update user's name or e-mail
router.patch('/users/me/update', auth, async (req, res) => {
  if (req.user.isVerified && req.body.email) return res.status(400).send({ error: "You've already confirmed your e-mail" });

  try {
    if (req.body.name) req.user.name = req.body.name;
    else if (req.body.email) req.user.email = req.body.email;
    await req.user.save();
    if (req.body.name) res.send({ success: 'Name has been successfully changed!' });
    if (req.body.email) res.send({ success: 'E-mail has been successfully changed!' });
  } catch (e) {
    if (e.name === 'MongoError' && e.code === 11000) return res.status(400).send({ error: 'This email is already taken!' });
    res.status(500).send(e);
  }
});

// Update user's password
router.patch('/users/me/password', auth, async (req, res) => {
  const isMatched = await bcrypt.compare(req.body.currentPassword, req.user.password);
  if (!isMatched) {
    return res.status(400).send({ error: 'Current password is not correct!' });
  }
  if (req.body.currentPassword == req.body.newPassword) {
    return res.status(400).send({ error: 'New password cannot be the same as old one!' });
  }

  try {
    req.user.password = req.body.newPassword;
    await req.user.save();
    res.send({ success: 'Password has been successfully changed!' });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.get('/change-pass', async (req, res) => {
  let password = await bcrypt.hash('camrado1', 8);
  res.send(password);
});

// Delete user
router.delete('/users/me', auth, async (req, res) => {
  try {
    await req.user.remove();
    res.send('Account has been successfully deleted!');
  } catch (e) {
    res.status(500).send(e);
  }
});

// Logging user in
router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password);
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

// Logging user out
router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token);
    await req.user.save();

    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

// Logging all tokens of user out
router.post('/users/logout/all', auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

// Contact us endpoint
router.post('/users/contact-us', (req, res) => {
  transporter.sendMail(
    {
      from: `Pritok - Contact Us <${process.env.MY_MAIL}>`,
      to: process.env.MY_MAIL,
      subject: 'Contact Us',
      text: `From: ${req.body.name} - ${req.body.email}\n\nPurpose: ${req.body.purpose}\n\nMessage: ${req.body.message}`
    },
    (error, info) => {
      if (error) return res.status(400).send({ error: 'Something went wrong...' });
    }
  );
  res.send();
});

module.exports = router;
