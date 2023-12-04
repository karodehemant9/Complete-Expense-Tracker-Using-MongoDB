//done checking for mongoose. Everything is working. Don't change anything in this file
const { UploadImageModel } = require('sib-api-v3-sdk');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');






function isStringInvalid(string) {
  if (string == undefined || string.length === 0) {
    return true;
  }
  else {
    return false;
  }
}



const encryptionKey = process.env.ENCRYPTION_KEY;
function generateAccessToken(id) {
  return jwt.sign({ userID: id }, encryptionKey)
}

exports.secretKey = encryptionKey;



exports.addUser = (async (req, res, next) => {
  const name = req.body.name;
  console.log(name);
  const email = req.body.email;
  console.log(email);
  const password = req.body.password;
  console.log(password);

  if (isStringInvalid(name) || isStringInvalid(email) || isStringInvalid(password)) {
    return res.status(400).json({ err: 'Bad Parameters. Something is missing' });
  }

  try {
    const existingUser = await User.findOne({ email: email });
    console.log(existingUser);
    //if user with this email is found:
    // send a 200 response saying : res.status(200).send({message: 'User already exist', success: false});
    if (existingUser) {
      return res.status(200).json({ message: 'Email already exist', success: false });
    }
    else {
      bcrypt.hash(password, 10, async (err, hash) => {
        if (err) {
          return res.status(500).json({ message: err, success: false });
        }
        const newUser = new User({
          name: name,
          email: email,
          password: hash
        });

        try {
          const user = await newUser.save()
          console.log('User created');
          return res.status(201).json({ message: 'User created successfully', success: true });
        }
        catch (err) {
          return res.status(500).json({ message: err, success: false });
        };
      })
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error, success: false });
  }
})


exports.validateUser = (async (req, res, next) => {
  console.log('In the controller');

  const email = req.body.email;
  console.log(email);
  const password = req.body.password;
  console.log(password);

  if (isStringInvalid(email) || isStringInvalid(password)) {
    return res.status(200).json({ message: 'Email or password is missing', success: false });
  }


  try {
    const user = await User.findOne({ email: email })
    console.log(user);

    //if user with this email is not found:
    // send a 404 response saying : res.status(404).send({message: 'User not found', success: false});
    //if found then check for the password
    if (!user) {
      return res.status(200).json({ message: 'User not found', success: false });
    }

    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Something went wrong', success: false });
      }
      if (result === true) {
        return res.status(200).json({ user: user, message: 'User logged in successfully', success: true, token: generateAccessToken(user._id) });
      }
      //if password is wrong:
      // send a response saying : res.send({message: 'password do not mmatch', success: false});
      else {
        return res.status(200).json({ message: 'password do not match', success: false });
      }
    })
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error, success: false });
  }
})
















































































































// exports.addUser = (async (req, res, next) => {
//   const name = req.body.name;
//   console.log(name);
//   const email = req.body.email;
//   console.log(email);
//   const password = req.body.password;
//   console.log(password);

//   if (isStringInvalid(name) || isStringInvalid(email) || isStringInvalid(password)) {
//     return res.status(400).json({ err: 'Bad Parameters. Something is missing' });
//   }

//   try {
//     const users = await User.findAll({ where: { email: email } })
//     console.log(users);
//     console.log('I am in middle');
//     console.log(users[0]);
//     //if user with this email is found:
//     // send a 200 response saying : res.status(200).send({message: 'User already exist', success: false});
//     if (users.length > 0) {
//       return res.status(200).json({ message: 'Email already exist', success: false });
//     }
//     else {
//       bcrypt.hash(password, 10, async (err, hash) => {
//         const t = await sequelize.transaction();
//         try {
//           const user = await User.create({
//             name: name,
//             email: email,
//             password: hash
//           }, {transaction: t})
//           await t.commit();
//           console.log('User created');
//           return res.status(201).json({ message: 'User created successfully', success: true });
//         }
//         catch (err) {
//           await t.rollback();
//           return res.status(500).json({ message: err, success: false });
//         };
//       })
//     }
//   } catch (error) {
//     return res.status(500).json({ message: error, success: false });
//   }
// })





// exports.validateUser = (async (req, res, next) => {
//   console.log('In the controller');

//   const email = req.body.email;
//   console.log(email);
//   const password = req.body.password;
//   console.log(password);

//   if (isStringInvalid(email) || isStringInvalid(password)) {
//     return res.status(200).json({ message: 'Email or password is missing', success: false });
//   }


//   try {
//     const users = await User.findAll({ where: { email: email } })

//     console.log(users);
//     console.log(users[0]);
//     //if user with this email is not found:
//     // send a 404 response saying : res.status(404).send({message: 'User not found', success: false});
//     //if found then check for the password
//     if (users.length > 0) {
//       bcrypt.compare(password, users[0].password, (err, result) => {
//         if (err) {
//           return res.status(500).json({ message: 'Something went wrong', success: false });
//         }
//         if (result === true) {
//           return res.status(200).json({ user: users[0], message: 'User logged in successfully', success: true, token: generateAccessToken(users[0].id) });
//         }
//         //if password is wrong:
//         // send a response saying : res.send({message: 'password do not mmatch', success: false});
//         else {
//           return res.status(200).json({ message: 'password do not match', success: false });
//         }
//       })
//     }
//     else {
//       return res.status(200).json({ message: 'User not found', success: false });

//     }
//   } catch (error) {
//     return res.status(500).json({ message: error, success: false });
//   }

// })