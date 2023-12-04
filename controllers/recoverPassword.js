const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const nodemailer = require('nodemailer');
const User = require('../models/user');
const ForgetPasswordRequest = require('../models/forgetPasswordRequest');

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
require('dotenv').config();

const neededPath = path.join(__dirname, '..', '/public', '/recoverpassword', 'recoverpassword.html');
console.log('sdfgskjldff%%%%%%%############');

console.log(neededPath);




exports.forgotPassword = (async (req, res, next) => {
  let info;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const email = req.body.email;
    const user = await User.findOne({ email: email })
    console.log('##################################################');
    console.log(user);
    if (!user) {
      await session.commitTransaction();
      session.endSession();
      return res.status(200).json({ information: info, success: false, message: 'Incorrect Email ID' });
    }
    console.log('##################################################');
    const uuid = uuidv4();
    console.log(uuid);
    const userId = user._id.toString();
    console.log(userId);
    const isActive = true;


    const newForgetPasswordRequest = new ForgetPasswordRequest({
      uuid: uuid,
      userId: userId,
      isActive: isActive 
    });

    const forgetPasswordRequest = await newForgetPasswordRequest.save();
    console.log(forgetPasswordRequest);
    await session.commitTransaction();
    session.endSession();

    let testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.SMTP_ETHEREAL_USERNAME,
        pass: process.env.SMTP_ETHEREAL_PASSWORD
      }
    });

    info = await transporter.sendMail({
      from: '"Shubham Karode" <karode.shubham9@gmail.com>', // sender address
      to: `${req.body.email}`, // list of receivers
      subject: "Hello ✔", // Subject line
      text: "Hello world?", // plain text body
      html: '<p>Click <a href = "http://localhost:8000/password/resetpassword/' + uuid + '">here</a> to reset your password</p>'
    });

    console.log("Message sent: %s", info.messageId);

    return res.status(202).json({ message: 'Mail sent successfully', information: info, success: true });
  }
  catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    return res.status(200).json({ information: info, success: false });
  }
})








exports.resetPassword = (async (req, res, next) => {
  try {
    const uuid = req.params.uuid;
    const forgetPasswordRequest = await ForgetPasswordRequest.findOne({ uuid: uuid})
    if (!forgetPasswordRequest || forgetPasswordRequest.isActive === false) {
      return res.json({ forgetPasswordRequest: forgetPasswordRequest, success: false });
    }
    console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$');
    console.log('sending file');
    res.sendFile(neededPath);
    //return res.json({ forgetPasswordRequest: forgetPasswordRequest, success: true });
  }
  catch (error) {
    console.log(error);
    return res.json({ error: error, success: false });
  }
})








exports.updatePassword = (async (req, res, next) => {
  try {
    console.log('#########################');
    const email = req.body.email;
    console.log(email);

    const user = await User.findOne({ email: email})
    console.log(user);

    if (user) {
      console.log('I if block');

      const userId = user._id;
      const password = req.body.password;
      console.log(password);

      const forgetPasswordRequest = await ForgetPasswordRequest.findOne( { userId: userId } )
      forgetPasswordRequest.isActive = false;
      await forgetPasswordRequest.save();


      bcrypt.hash(password, 10, async (err, hash) => {
        try {
          user.password = hash;
          await user.save();
          console.log('User password update');
          res.status(201).json({ message: 'User updated successfully', success: true });
        }
        catch (err) {
          return res.status(500).json({ message: err });
        };
      })
    }
    else {
      return res.status(200).json({ message: 'Email not found', success: false });
    }

  } catch (error) {
    console.log(error);
    return res.json({ error: error, success: false });
  }
})



















































































































































































