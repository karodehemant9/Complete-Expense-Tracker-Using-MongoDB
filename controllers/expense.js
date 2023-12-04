const User = require('../models/user');
const Expense = require('../models/expense');
const DownloadedFile = require('../models/downloadedFile');

const mongoose = require('mongoose');
const AWS = require('aws-sdk');
const moment = require('moment');
require('dotenv').config();




exports.getExpenses = (async (req, res, next) => {
  const pageNo = req.params.pageNo;
  const userID = req.user.id;
  console.log(userID);
  const ITEMS_PER_PAGE = Number(req.params.itemsPerPage);

  try {
    const expenseCountAndSum = await Expense.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userID) } },
      {
        $group: {
          _id: null,
          rowCount: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ])
    let totalItemsAndSum = expenseCountAndSum[0];
    console.log('total Items and Sum' ,expenseCountAndSum[0]);

    const expenses = await Expense.find({ user: userID })
      .skip((pageNo - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);
      
    console.log(expenses);
    return res.status(200).json({ expenses: expenses, totalItemsAndSum: totalItemsAndSum, success: true });
  }
  catch (err) {
    console.log(err);
    return res.status(500).json({ err: err, success: false });
  }
})







exports.getDailyExpenses = (async (req, res, next) => {
  const pageNo = req.params.pageNo;
  const userID = req.user.id;
  const ITEMS_PER_PAGE = Number(req.params.itemsPerPage);

  const today = moment().startOf('day');
  const tomorrow = moment(today).endOf('day');

  try {
    const expenseCountAndSum = await Expense.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userID),
          createdAt: { $gte: today.toDate(), $lte: tomorrow.toDate() },
        },
      },
      {
        $group: {
          _id: null,
          rowCount: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);
    let totalItemsAndSum = expenseCountAndSum[0];


    const expenses = await Expense.find({
      user: userID,
      createdAt: { $gte: today.toDate(), $lte: tomorrow.toDate() },
    })
      .skip((pageNo - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);
      
    console.log(expenses);
    return res.status(200).json({ expenses: expenses, totalItemsAndSum: totalItemsAndSum, success: true });
  }
  catch (err) {
    console.log(err);
    return res.status(500).json({ err: err, success: false });
  }
})




exports.getWeeklyExpenses = (async (req, res, next) => {
  const pageNo = req.params.pageNo;
  const userID = req.user.id;
  const ITEMS_PER_PAGE = Number(req.params.itemsPerPage);

  const today = moment();
  const currentWeekEnd = moment(today).endOf('day');
  const lastWeekStart = currentWeekEnd.clone().subtract(1, 'weeks');

  try {
    const expenseCountAndSum = await Expense.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userID),
          createdAt: { $gte: lastWeekStart.toDate(), $lte: currentWeekEnd.toDate() },
        },
      },
      {
        $group: {
          _id: null,
          rowCount: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    // Get totalItemsAndSum from the first element of the result
    let totalItemsAndSum = expenseCountAndSum[0];

    // Fetch expenses for the specified page
    const expenses = await Expense.find({
      user: userID,
      createdAt: { $gte: lastWeekStart.toDate(), $lte: currentWeekEnd.toDate() },
    })
      .skip((pageNo - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);
      
    console.log(expenses);
    return res.status(200).json({ expenses: expenses, totalItemsAndSum: totalItemsAndSum, success: true });
  }
  catch (err) {
    console.log(err);
    return res.status(500).json({ err: err, success: false });
  }
})





exports.getMonthlyExpenses = (async (req, res, next) => {
  const pageNo = req.params.pageNo;
  const userID = req.user.id;
  const ITEMS_PER_PAGE = Number(req.params.itemsPerPage);

  const startOfMonth = moment().startOf('month');
  const endOfMonth = moment(startOfMonth).endOf('month');

  try {
    // Count the total number of expenses and calculate the total amount
    const expenseCountAndSum = await Expense.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userID),
          createdAt: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
        },
      },
      {
        $group: {
          _id: null,
          rowCount: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    // Get totalItemsAndSum from the first element of the result
    let totalItemsAndSum = expenseCountAndSum[0];

    // Fetch expenses for the specified page
    const expenses = await Expense.find({
      user: userID,
      createdAt: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
    })
      .skip((pageNo - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

      console.log(expenses);
      
    return res.status(200).json({ expenses: expenses, totalItemsAndSum: totalItemsAndSum, success: true });
  }
  catch (err) {
    console.log(err);
    return res.status(500).json({ err: err, success: false });
  }
})










exports.addExpense = (async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const amount = req.body.amount;
    console.log(amount);
    const description = req.body.description;
    console.log(description);
    const category = req.body.category;
    console.log(category);

    // Expense.create({amount: amount, description: description, category: category, userId: req.user.id}) == req.user.createExpense({amount: amount, description: description, category: category})
    // Create a new instance of the Expense model
    const expense = new Expense({
      amount: amount,
      description: description,
      category: category,
      user: req.user._id, 
    });

    // Save the new expense document
    await expense.save({ session: session });

    // Update the user's totalExpense
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.user._id },
      { $inc: { totalExpense: amount } },
      { session: session, new: true }
    );

    await session.commitTransaction();
    session.endSession();
    res.status(201).json({ expense: expense, message: 'Expense created successfully', success: true });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    return res.status(500).json({ err: error, success: false });
  }
})






exports.deleteExpense = (async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  const expenseId = req.params.expenseID;
  console.log('expense id to delete expense is: ')
  console.log(expenseId);
  console.log(req.user);
  try {
    const expenseToDelete = await Expense.findOne({ _id: expenseId, user: req.user._id })
    console.log('expenseToDelete');
    console.log(expenseToDelete);

    if (!expenseToDelete) {
      await session.abortTransaction();
      session.endSession();
      return res.status(200).json({ message: 'Expense doesn\'t belong to the user', success: false });
    }

    const amount = Number(expenseToDelete.amount);

    const updatedUser = await User.findOneAndUpdate(
      { _id: req.user.id },
      { $inc: { totalExpense: -amount } },
      { session: session }
    );

    const noOfRecords = await Expense.deleteOne({ _id: expenseId, user: req.user.id }, { session: session });
    console.log(noOfRecords);

    if (noOfRecords.deletedCount !== 0) {
      await session.commitTransaction();
      session.endSession();
      return res.status(200).json({ message: 'Record deleted successfully', success: true });
    }
    
    await session.abortTransaction();
    session.endSession();
    return res.status(200).json({ message: 'expense doesn\'t belong to user', success: false });
  }
  catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.log(err);
    return res.status(500).json({ err: err, success: false });
  }
})





exports.downloadExpenses = (async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    console.log('Inside download expense function', req.user.id);
    const expenses = await Expense.find({ user: req.user.id });
    console.log(expenses);

    const stringifiedExpenses = JSON.stringify(expenses);
    const userId = req.user.id;
    const filename = `Expense${userId}/${new Date()}.txt`;
    //the file name should depend upon userId
    //every time we download a file a new file should be uploaded to S3(based on date)

    const uploadedFileURL = await uploadToS3(stringifiedExpenses, filename);

    //storing the file URL in table
    const downloadedFile = await DownloadedFile.create(
      { fileURL: uploadedFileURL, user: req.user.id },
      { session: session }
    );
    await session.commitTransaction();
    session.endSession();
    console.log('hi everyone*****************************************');

    return res.status(201).json({ fileURL: uploadedFileURL, success: true });
  }
  catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.log(err);
    res.status(500).json({ fileURL: '', success: false, err: err });
  }

})




function uploadToS3(data, filename) {
  return new Promise((resolve, reject) => {
    const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
    const IAM_USER_KEY = process.env.AWS_IAM_USER_KEY;
    const IAM_USER_SECRET = process.env.AWS_IAM_USER_SECRET;

    let s3bucket = new AWS.S3({
      accessKeyId: IAM_USER_KEY,
      secretAccessKey: IAM_USER_SECRET,
    })


    var params = {
      Bucket: BUCKET_NAME,
      Key: filename,
      Body: data,
      ACL: 'public-read' //making your files publically visible
    }

    s3bucket.upload(params, (err, s3response) => {
      if (err) {
        reject(err);
      }
      else {
        console.log(s3response);
        console.log('@#@#@#@#@#@#@#@#@#');
        console.log(s3response.Location);
        resolve(s3response.Location);
      }
    })
  });
}



























// const Expense = require('../models/expense');
// const DownloadedFile = require('../models/downloadedFile');
 
// const User = require('../models/user');
// const sequelize = require('../util/database');
// const AWS = require('aws-sdk');
// const { Op } = require("sequelize");
// const moment = require('moment');
// require('dotenv').config();







// exports.getExpenses = (async (req, res, next) => {
//   const pageNo = req.params.pageNo;
//   const userID = req.user.id;
//   const ITEMS_PER_PAGE = Number(req.params.itemsPerPage);

//   try {
//     const expenseCountAndSum = await Expense.findAll({
//       attributes: [
//         [sequelize.fn('COUNT', sequelize.col('id')), 'rowCount'], // Count the rows
//         [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
//       ], where: { userId: userID }
//     })
//     let totalItemsAndSum = expenseCountAndSum;


//     const expenses = await Expense.findAll({
//       where: { userId: userID },
//       offset: (pageNo - 1) * ITEMS_PER_PAGE,
//       limit: ITEMS_PER_PAGE
//     })
//     console.log(expenses);
//     return res.status(200).json({ expenses: expenses, totalItemsAndSum: totalItemsAndSum, success: true });
//   }
//   catch (err) {
//     console.log(err);
//     return res.status(500).json({ err: err, success: false });
//   }
// })


// exports.getDailyExpenses = (async (req, res, next) => {
//   const pageNo = req.params.pageNo;
//   const userID = req.user.id;
//   const ITEMS_PER_PAGE = Number(req.params.itemsPerPage);

//   const today = moment().startOf('day');
//   const tomorrow = moment(today).endOf('day');

//   try {
//     const expenseCountAndSum = await Expense.findAll({
//       attributes: [
//         [sequelize.fn('COUNT', sequelize.col('id')), 'rowCount'], // Count the rows
//         [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
//       ],
//       where: { userId: userID, createdAt: { [Op.between]: [today, tomorrow] } }
//     })
//     let totalItemsAndSum = expenseCountAndSum;


//     const expenses = await Expense.findAll({
//       where: { userId: userID, createdAt: { [Op.between]: [today, tomorrow] } },
//       offset: (pageNo - 1) * ITEMS_PER_PAGE,
//       limit: ITEMS_PER_PAGE
//     })
//     console.log(expenses);
//     return res.status(200).json({ expenses: expenses, totalItemsAndSum: totalItemsAndSum, success: true });
//   }
//   catch (err) {
//     console.log(err);
//     return res.status(500).json({ err: err, success: false });
//   }
// })




// exports.getWeeklyExpenses = (async (req, res, next) => {
//   const pageNo = req.params.pageNo;
//   const userID = req.user.id;
//   const ITEMS_PER_PAGE = Number(req.params.itemsPerPage);

//   const today = moment();
//   const currentWeekEnd = moment(today).endOf('day');
//   const lastWeekStart = currentWeekEnd.clone().subtract(1, 'weeks');

//   // console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$');
//   // console.log(currentWeekEnd);
//   // console.log(lastWeekStart);
//   // console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$');

//   try {
//     const expenseCountAndSum = await Expense.findAll({
//       attributes: [
//         [sequelize.fn('COUNT', sequelize.col('id')), 'rowCount'], // Count the rows
//         [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
//       ],
//       where: { userId: userID, createdAt: { [Op.between]: [lastWeekStart, currentWeekEnd] } }
//     })
//     let totalItemsAndSum = expenseCountAndSum;


//     const expenses = await Expense.findAll({
//       where: { userId: userID, createdAt: { [Op.between]: [lastWeekStart, currentWeekEnd] } },
//       offset: (pageNo - 1) * ITEMS_PER_PAGE,
//       limit: ITEMS_PER_PAGE
//     })
//     console.log(expenses);
//     return res.status(200).json({ expenses: expenses, totalItemsAndSum: totalItemsAndSum, success: true });
//   }
//   catch (err) {
//     console.log(err);
//     return res.status(500).json({ err: err, success: false });
//   }
// })





// exports.getMonthlyExpenses = (async (req, res, next) => {
//   const pageNo = req.params.pageNo;
//   const userID = req.user.id;
//   const ITEMS_PER_PAGE = Number(req.params.itemsPerPage);

//   const startOfMonth = moment().startOf('month');
//   const endOfMonth = moment(startOfMonth).endOf('month');

//   try {
//     const expenseCountAndSum = await Expense.findAll({
//       attributes: [
//         [sequelize.fn('COUNT', sequelize.col('id')), 'rowCount'], // Count the rows
//         [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
//       ],
//       where: { userId: userID, createdAt: { [Op.between]: [startOfMonth, endOfMonth] } }
//     })

//     let totalItemsAndSum = expenseCountAndSum;

//     const expenses = await Expense.findAll(
//       {
//         where: { userId: userID, createdAt: { [Op.between]: [startOfMonth, endOfMonth] } },
//         offset: (pageNo - 1) * ITEMS_PER_PAGE,
//         limit: ITEMS_PER_PAGE
//       })

//     return res.status(200).json({ expenses: expenses, totalItemsAndSum: totalItemsAndSum, success: true });
//   }
//   catch (err) {
//     console.log(err);
//     return res.status(500).json({ err: err, success: false });
//   }
// })










// exports.addExpense = (async (req, res, next) => {
//   const t = await sequelize.transaction();
//   try {
//     const amount = req.body.amount;
//     console.log(amount);
//     const description = req.body.description;
//     console.log(description);
//     const category = req.body.category;
//     console.log(category);

//     //Expense.create({amount: amount, description: description, category: category, userId: req.user.id}) == req.user.createExpense({amount: amount, description: description, category: category})
//     const expense = await req.user.createExpense(
//       {
//         amount: amount,
//         description: description,
//         category: category
//       },

//       {
//         transaction: t,
//       }
//     );

//     const updatedUser = await User.update(
//       {
//         totalExpense: Number(req.user.totalExpense) + Number(amount)
//       },
//       {
//         where: { id: req.user.id },
//         transaction: t
//       }
//     );
//     await t.commit();
//     res.status(201).json({ expense: expense, message: 'Expense created successfully', success: true });
//   } catch (error) {
//     await t.rollback();
//     console.log(error);
//     return res.status(500).json({ err: error, success: false });
//   }
// })






// exports.deleteExpense = (async (req, res, next) => {
//   const t = await sequelize.transaction();
//   const expenseId = req.params.expenseID;
//   console.log('expense id to delete expense is: ')
//   console.log(expenseId);
//   try {
//     const expenseToDelete = await Expense.findAll({ where: { id: expenseId, userId: req.user.id } })
//     const amount = expenseToDelete[0].amount;

//     const updatedUser = await User.update(
//       { totalExpense: Number(req.user.totalExpense) - Number(amount) },
//       { where: { id: req.user.id }, transaction: t }
//     );


//     let noOfRecords = await Expense.destroy({
//       where: { id: expenseId, userId: req.user.id },
//       transaction: t
//     })
//     console.log(noOfRecords);

//     if (noOfRecords !== 0) {
//       await t.commit();
//       return res.status(200).json({ message: 'record deleted successfully', success: true });
//     }
//     await t.rollback();
//     return res.status(200).json({ message: 'expense doesn\'t belong to user', success: false });
//   }
//   catch (err) {
//     await t.rollback();
//     console.log(err);
//     return res.status(500).json({ err: err, success: false });
//   }
// })





// exports.downloadExpenses = (async (req, res, next) => {
//   const t = await sequelize.transaction();
//   try {
//     const expenses = await req.user.getExpenses();
//     console.log(expenses);

//     const stringifiedExpenses = JSON.stringify(expenses);
//     const userId = req.user.id;
//     const filename = `Expense${userId}/${new Date()}.txt`;
//     //the file name should depend upon userId
//     //every time we download a file a new file should be uploaded to S3(based on date)

//     const uploadedFileURL = await uploadToS3(stringifiedExpenses, filename);

//     //storing the file URL in table
//     const downloadedFile = await req.user.createDownloadedFile({ fileURL: uploadedFileURL }, { transaction: t });
//     await t.commit();
//     console.log('hi everyone*****************************************');

//     return res.status(201).json({ fileURL: uploadedFileURL, success: true });
//   }
//   catch (err) {
//     await t.rollback();
//     console.log(err);
//     res.status(500).json({ fileURL: '', success: false, err: err });
//   }

// })




// function uploadToS3(data, filename) {
//   return new Promise((resolve, reject) => {
//     const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
//     const IAM_USER_KEY = process.env.AWS_IAM_USER_KEY;
//     const IAM_USER_SECRET = process.env.AWS_IAM_USER_SECRET;

//     let s3bucket = new AWS.S3({
//       accessKeyId: IAM_USER_KEY,
//       secretAccessKey: IAM_USER_SECRET,
//     })


//     var params = {
//       Bucket: BUCKET_NAME,
//       Key: filename,
//       Body: data,
//       ACL: 'public-read' //making your files publically visible
//     }

//     s3bucket.upload(params, (err, s3response) => {
//       if (err) {
//         reject(err);
//       }
//       else {
//         console.log(s3response);
//         console.log('@#@#@#@#@#@#@#@#@#');
//         console.log(s3response.Location);
//         resolve(s3response.Location);
//       }
//     })
//   });
// }


// const Expense = require('../models/expense');
// const DownloadedFile = require('../models/downloadedFile');
 
// const User = require('../models/user');
// const sequelize = require('../util/database');
// const AWS = require('aws-sdk');
// const { Op } = require("sequelize");
// const moment = require('moment');
// require('dotenv').config();







// exports.getExpenses = (async (req, res, next) => {
//   const pageNo = req.params.pageNo;
//   const userID = req.user.id;
//   const ITEMS_PER_PAGE = Number(req.params.itemsPerPage);

//   try {
//     const expenseCountAndSum = await Expense.findAll({
//       attributes: [
//         [sequelize.fn('COUNT', sequelize.col('id')), 'rowCount'], // Count the rows
//         [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
//       ], where: { userId: userID }
//     })
//     let totalItemsAndSum = expenseCountAndSum;


//     const expenses = await Expense.findAll({
//       where: { userId: userID },
//       offset: (pageNo - 1) * ITEMS_PER_PAGE,
//       limit: ITEMS_PER_PAGE
//     })
//     console.log(expenses);
//     return res.status(200).json({ expenses: expenses, totalItemsAndSum: totalItemsAndSum, success: true });
//   }
//   catch (err) {
//     console.log(err);
//     return res.status(500).json({ err: err, success: false });
//   }
// })


// exports.getDailyExpenses = (async (req, res, next) => {
//   const pageNo = req.params.pageNo;
//   const userID = req.user.id;
//   const ITEMS_PER_PAGE = Number(req.params.itemsPerPage);

//   const today = moment().startOf('day');
//   const tomorrow = moment(today).endOf('day');

//   try {
//     const expenseCountAndSum = await Expense.findAll({
//       attributes: [
//         [sequelize.fn('COUNT', sequelize.col('id')), 'rowCount'], // Count the rows
//         [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
//       ],
//       where: { userId: userID, createdAt: { [Op.between]: [today, tomorrow] } }
//     })
//     let totalItemsAndSum = expenseCountAndSum;


//     const expenses = await Expense.findAll({
//       where: { userId: userID, createdAt: { [Op.between]: [today, tomorrow] } },
//       offset: (pageNo - 1) * ITEMS_PER_PAGE,
//       limit: ITEMS_PER_PAGE
//     })
//     console.log(expenses);
//     return res.status(200).json({ expenses: expenses, totalItemsAndSum: totalItemsAndSum, success: true });
//   }
//   catch (err) {
//     console.log(err);
//     return res.status(500).json({ err: err, success: false });
//   }
// })




// exports.getWeeklyExpenses = (async (req, res, next) => {
//   const pageNo = req.params.pageNo;
//   const userID = req.user.id;
//   const ITEMS_PER_PAGE = Number(req.params.itemsPerPage);

//   const today = moment();
//   const currentWeekEnd = moment(today).endOf('day');
//   const lastWeekStart = currentWeekEnd.clone().subtract(1, 'weeks');

//   // console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$');
//   // console.log(currentWeekEnd);
//   // console.log(lastWeekStart);
//   // console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$');

//   try {
//     const expenseCountAndSum = await Expense.findAll({
//       attributes: [
//         [sequelize.fn('COUNT', sequelize.col('id')), 'rowCount'], // Count the rows
//         [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
//       ],
//       where: { userId: userID, createdAt: { [Op.between]: [lastWeekStart, currentWeekEnd] } }
//     })
//     let totalItemsAndSum = expenseCountAndSum;


//     const expenses = await Expense.findAll({
//       where: { userId: userID, createdAt: { [Op.between]: [lastWeekStart, currentWeekEnd] } },
//       offset: (pageNo - 1) * ITEMS_PER_PAGE,
//       limit: ITEMS_PER_PAGE
//     })
//     console.log(expenses);
//     return res.status(200).json({ expenses: expenses, totalItemsAndSum: totalItemsAndSum, success: true });
//   }
//   catch (err) {
//     console.log(err);
//     return res.status(500).json({ err: err, success: false });
//   }
// })





// exports.getMonthlyExpenses = (async (req, res, next) => {
//   const pageNo = req.params.pageNo;
//   const userID = req.user.id;
//   const ITEMS_PER_PAGE = Number(req.params.itemsPerPage);

//   const startOfMonth = moment().startOf('month');
//   const endOfMonth = moment(startOfMonth).endOf('month');

//   try {
//     const expenseCountAndSum = await Expense.findAll({
//       attributes: [
//         [sequelize.fn('COUNT', sequelize.col('id')), 'rowCount'], // Count the rows
//         [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
//       ],
//       where: { userId: userID, createdAt: { [Op.between]: [startOfMonth, endOfMonth] } }
//     })

//     let totalItemsAndSum = expenseCountAndSum;

//     const expenses = await Expense.findAll(
//       {
//         where: { userId: userID, createdAt: { [Op.between]: [startOfMonth, endOfMonth] } },
//         offset: (pageNo - 1) * ITEMS_PER_PAGE,
//         limit: ITEMS_PER_PAGE
//       })

//     return res.status(200).json({ expenses: expenses, totalItemsAndSum: totalItemsAndSum, success: true });
//   }
//   catch (err) {
//     console.log(err);
//     return res.status(500).json({ err: err, success: false });
//   }
// })










// exports.addExpense = (async (req, res, next) => {
//   const t = await sequelize.transaction();
//   try {
//     const amount = req.body.amount;
//     console.log(amount);
//     const description = req.body.description;
//     console.log(description);
//     const category = req.body.category;
//     console.log(category);

//     //Expense.create({amount: amount, description: description, category: category, userId: req.user.id}) == req.user.createExpense({amount: amount, description: description, category: category})
//     const expense = await req.user.createExpense(
//       {
//         amount: amount,
//         description: description,
//         category: category
//       },

//       {
//         transaction: t,
//       }
//     );

//     const updatedUser = await User.update(
//       {
//         totalExpense: Number(req.user.totalExpense) + Number(amount)
//       },
//       {
//         where: { id: req.user.id },
//         transaction: t
//       }
//     );
//     await t.commit();
//     res.status(201).json({ expense: expense, message: 'Expense created successfully', success: true });
//   } catch (error) {
//     await t.rollback();
//     console.log(error);
//     return res.status(500).json({ err: error, success: false });
//   }
// })






// exports.deleteExpense = (async (req, res, next) => {
//   const t = await sequelize.transaction();
//   const expenseId = req.params.expenseID;
//   console.log('expense id to delete expense is: ')
//   console.log(expenseId);
//   try {
//     const expenseToDelete = await Expense.findAll({ where: { id: expenseId, userId: req.user.id } })
//     const amount = expenseToDelete[0].amount;

//     const updatedUser = await User.update(
//       { totalExpense: Number(req.user.totalExpense) - Number(amount) },
//       { where: { id: req.user.id }, transaction: t }
//     );


//     let noOfRecords = await Expense.destroy({
//       where: { id: expenseId, userId: req.user.id },
//       transaction: t
//     })
//     console.log(noOfRecords);

//     if (noOfRecords !== 0) {
//       await t.commit();
//       return res.status(200).json({ message: 'record deleted successfully', success: true });
//     }
//     await t.rollback();
//     return res.status(200).json({ message: 'expense doesn\'t belong to user', success: false });
//   }
//   catch (err) {
//     await t.rollback();
//     console.log(err);
//     return res.status(500).json({ err: err, success: false });
//   }
// })





// exports.downloadExpenses = (async (req, res, next) => {
//   const t = await sequelize.transaction();
//   try {
//     const expenses = await req.user.getExpenses();
//     console.log(expenses);

//     const stringifiedExpenses = JSON.stringify(expenses);
//     const userId = req.user.id;
//     const filename = `Expense${userId}/${new Date()}.txt`;
//     //the file name should depend upon userId
//     //every time we download a file a new file should be uploaded to S3(based on date)

//     const uploadedFileURL = await uploadToS3(stringifiedExpenses, filename);

//     //storing the file URL in table
//     const downloadedFile = await req.user.createDownloadedFile({ fileURL: uploadedFileURL }, { transaction: t });
//     await t.commit();
//     console.log('hi everyone*****************************************');

//     return res.status(201).json({ fileURL: uploadedFileURL, success: true });
//   }
//   catch (err) {
//     await t.rollback();
//     console.log(err);
//     res.status(500).json({ fileURL: '', success: false, err: err });
//   }

// })




// function uploadToS3(data, filename) {
//   return new Promise((resolve, reject) => {
//     const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
//     const IAM_USER_KEY = process.env.AWS_IAM_USER_KEY;
//     const IAM_USER_SECRET = process.env.AWS_IAM_USER_SECRET;

//     let s3bucket = new AWS.S3({
//       accessKeyId: IAM_USER_KEY,
//       secretAccessKey: IAM_USER_SECRET,
//     })


//     var params = {
//       Bucket: BUCKET_NAME,
//       Key: filename,
//       Body: data,
//       ACL: 'public-read' //making your files publically visible
//     }

//     s3bucket.upload(params, (err, s3response) => {
//       if (err) {
//         reject(err);
//       }
//       else {
//         console.log(s3response);
//         console.log('@#@#@#@#@#@#@#@#@#');
//         console.log(s3response.Location);
//         resolve(s3response.Location);
//       }
//     })
//   });
// }



























// // const Expense = require('../models/expense');
// // const DownloadedFile = require('../models/downloadedFile');
 
// // const User = require('../models/user');
// // const sequelize = require('../util/database');
// // const AWS = require('aws-sdk');
// // const { Op } = require("sequelize");
// // const moment = require('moment');
// // require('dotenv').config();







// // exports.getExpenses = (async (req, res, next) => {
// //   const pageNo = req.params.pageNo;
// //   const userID = req.user.id;
// //   const ITEMS_PER_PAGE = Number(req.params.itemsPerPage);

// //   try {
// //     const expenseCountAndSum = await Expense.findAll({
// //       attributes: [
// //         [sequelize.fn('COUNT', sequelize.col('id')), 'rowCount'], // Count the rows
// //         [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
// //       ], where: { userId: userID }
// //     })
// //     let totalItemsAndSum = expenseCountAndSum;


// //     const expenses = await Expense.findAll({
// //       where: { userId: userID },
// //       offset: (pageNo - 1) * ITEMS_PER_PAGE,
// //       limit: ITEMS_PER_PAGE
// //     })
// //     console.log(expenses);
// //     return res.status(200).json({ expenses: expenses, totalItemsAndSum: totalItemsAndSum, success: true });
// //   }
// //   catch (err) {
// //     console.log(err);
// //     return res.status(500).json({ err: err, success: false });
// //   }
// // })


// // exports.getDailyExpenses = (async (req, res, next) => {
// //   const pageNo = req.params.pageNo;
// //   const userID = req.user.id;
// //   const ITEMS_PER_PAGE = Number(req.params.itemsPerPage);

// //   const today = moment().startOf('day');
// //   const tomorrow = moment(today).endOf('day');

// //   try {
// //     const expenseCountAndSum = await Expense.findAll({
// //       attributes: [
// //         [sequelize.fn('COUNT', sequelize.col('id')), 'rowCount'], // Count the rows
// //         [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
// //       ],
// //       where: { userId: userID, createdAt: { [Op.between]: [today, tomorrow] } }
// //     })
// //     let totalItemsAndSum = expenseCountAndSum;


// //     const expenses = await Expense.findAll({
// //       where: { userId: userID, createdAt: { [Op.between]: [today, tomorrow] } },
// //       offset: (pageNo - 1) * ITEMS_PER_PAGE,
// //       limit: ITEMS_PER_PAGE
// //     })
// //     console.log(expenses);
// //     return res.status(200).json({ expenses: expenses, totalItemsAndSum: totalItemsAndSum, success: true });
// //   }
// //   catch (err) {
// //     console.log(err);
// //     return res.status(500).json({ err: err, success: false });
// //   }
// // })




// // exports.getWeeklyExpenses = (async (req, res, next) => {
// //   const pageNo = req.params.pageNo;
// //   const userID = req.user.id;
// //   const ITEMS_PER_PAGE = Number(req.params.itemsPerPage);

// //   const today = moment();
// //   const currentWeekEnd = moment(today).endOf('day');
// //   const lastWeekStart = currentWeekEnd.clone().subtract(1, 'weeks');

// //   // console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$');
// //   // console.log(currentWeekEnd);
// //   // console.log(lastWeekStart);
// //   // console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$');

// //   try {
// //     const expenseCountAndSum = await Expense.findAll({
// //       attributes: [
// //         [sequelize.fn('COUNT', sequelize.col('id')), 'rowCount'], // Count the rows
// //         [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
// //       ],
// //       where: { userId: userID, createdAt: { [Op.between]: [lastWeekStart, currentWeekEnd] } }
// //     })
// //     let totalItemsAndSum = expenseCountAndSum;


// //     const expenses = await Expense.findAll({
// //       where: { userId: userID, createdAt: { [Op.between]: [lastWeekStart, currentWeekEnd] } },
// //       offset: (pageNo - 1) * ITEMS_PER_PAGE,
// //       limit: ITEMS_PER_PAGE
// //     })
// //     console.log(expenses);
// //     return res.status(200).json({ expenses: expenses, totalItemsAndSum: totalItemsAndSum, success: true });
// //   }
// //   catch (err) {
// //     console.log(err);
// //     return res.status(500).json({ err: err, success: false });
// //   }
// // })





// // exports.getMonthlyExpenses = (async (req, res, next) => {
// //   const pageNo = req.params.pageNo;
// //   const userID = req.user.id;
// //   const ITEMS_PER_PAGE = Number(req.params.itemsPerPage);

// //   const startOfMonth = moment().startOf('month');
// //   const endOfMonth = moment(startOfMonth).endOf('month');

// //   try {
// //     const expenseCountAndSum = await Expense.findAll({
// //       attributes: [
// //         [sequelize.fn('COUNT', sequelize.col('id')), 'rowCount'], // Count the rows
// //         [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
// //       ],
// //       where: { userId: userID, createdAt: { [Op.between]: [startOfMonth, endOfMonth] } }
// //     })

// //     let totalItemsAndSum = expenseCountAndSum;

// //     const expenses = await Expense.findAll(
// //       {
// //         where: { userId: userID, createdAt: { [Op.between]: [startOfMonth, endOfMonth] } },
// //         offset: (pageNo - 1) * ITEMS_PER_PAGE,
// //         limit: ITEMS_PER_PAGE
// //       })

// //     return res.status(200).json({ expenses: expenses, totalItemsAndSum: totalItemsAndSum, success: true });
// //   }
// //   catch (err) {
// //     console.log(err);
// //     return res.status(500).json({ err: err, success: false });
// //   }
// // })










// // exports.addExpense = (async (req, res, next) => {
// //   const t = await sequelize.transaction();
// //   try {
// //     const amount = req.body.amount;
// //     console.log(amount);
// //     const description = req.body.description;
// //     console.log(description);
// //     const category = req.body.category;
// //     console.log(category);

// //     //Expense.create({amount: amount, description: description, category: category, userId: req.user.id}) == req.user.createExpense({amount: amount, description: description, category: category})
// //     const expense = await req.user.createExpense(
// //       {
// //         amount: amount,
// //         description: description,
// //         category: category
// //       },

// //       {
// //         transaction: t,
// //       }
// //     );

// //     const updatedUser = await User.update(
// //       {
// //         totalExpense: Number(req.user.totalExpense) + Number(amount)
// //       },
// //       {
// //         where: { id: req.user.id },
// //         transaction: t
// //       }
// //     );
// //     await t.commit();
// //     res.status(201).json({ expense: expense, message: 'Expense created successfully', success: true });
// //   } catch (error) {
// //     await t.rollback();
// //     console.log(error);
// //     return res.status(500).json({ err: error, success: false });
// //   }
// // })






// // exports.deleteExpense = (async (req, res, next) => {
// //   const t = await sequelize.transaction();
// //   const expenseId = req.params.expenseID;
// //   console.log('expense id to delete expense is: ')
// //   console.log(expenseId);
// //   try {
// //     const expenseToDelete = await Expense.findAll({ where: { id: expenseId, userId: req.user.id } })
// //     const amount = expenseToDelete[0].amount;

// //     const updatedUser = await User.update(
// //       { totalExpense: Number(req.user.totalExpense) - Number(amount) },
// //       { where: { id: req.user.id }, transaction: t }
// //     );


// //     let noOfRecords = await Expense.destroy({
// //       where: { id: expenseId, userId: req.user.id },
// //       transaction: t
// //     })
// //     console.log(noOfRecords);

// //     if (noOfRecords !== 0) {
// //       await t.commit();
// //       return res.status(200).json({ message: 'record deleted successfully', success: true });
// //     }
// //     await t.rollback();
// //     return res.status(200).json({ message: 'expense doesn\'t belong to user', success: false });
// //   }
// //   catch (err) {
// //     await t.rollback();
// //     console.log(err);
// //     return res.status(500).json({ err: err, success: false });
// //   }
// // })





// // exports.downloadExpenses = (async (req, res, next) => {
// //   const t = await sequelize.transaction();
// //   try {
// //     const expenses = await req.user.getExpenses();
// //     console.log(expenses);

// //     const stringifiedExpenses = JSON.stringify(expenses);
// //     const userId = req.user.id;
// //     const filename = `Expense${userId}/${new Date()}.txt`;
// //     //the file name should depend upon userId
// //     //every time we download a file a new file should be uploaded to S3(based on date)

// //     const uploadedFileURL = await uploadToS3(stringifiedExpenses, filename);

// //     //storing the file URL in table
// //     const downloadedFile = await req.user.createDownloadedFile({ fileURL: uploadedFileURL }, { transaction: t });
// //     await t.commit();
// //     console.log('hi everyone*****************************************');

// //     return res.status(201).json({ fileURL: uploadedFileURL, success: true });
// //   }
// //   catch (err) {
// //     await t.rollback();
// //     console.log(err);
// //     res.status(500).json({ fileURL: '', success: false, err: err });
// //   }

// // })




// // function uploadToS3(data, filename) {
// //   return new Promise((resolve, reject) => {
// //     const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
// //     const IAM_USER_KEY = process.env.AWS_IAM_USER_KEY;
// //     const IAM_USER_SECRET = process.env.AWS_IAM_USER_SECRET;

// //     let s3bucket = new AWS.S3({
// //       accessKeyId: IAM_USER_KEY,
// //       secretAccessKey: IAM_USER_SECRET,
// //     })


// //     var params = {
// //       Bucket: BUCKET_NAME,
// //       Key: filename,
// //       Body: data,
// //       ACL: 'public-read' //making your files publically visible
// //     }

// //     s3bucket.upload(params, (err, s3response) => {
// //       if (err) {
// //         reject(err);
// //       }
// //       else {
// //         console.log(s3response);
// //         console.log('@#@#@#@#@#@#@#@#@#');
// //         console.log(s3response.Location);
// //         resolve(s3response.Location);
// //       }
// //     })
// //   });
// // }
