const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    //added due to one to many relationship between user and Expenses
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }

}, {
    timestamps: true // The timestamps option is added to automatically include createdAt and updatedAt fields in each document. If you don't need these fields, you can remove this option.
});

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
















// const Sequelize = require('sequelize');

// const sequelize = require('../util/database');

// const Expense  = sequelize.define('expense',{
//   id: {type: Sequelize.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true},
//   amount: {type: Sequelize.FLOAT, allowNull: false},
//   description: {type: Sequelize.STRING, allowNull: false},
//   category: {type: Sequelize.STRING, allowNull: false}
// });

// module.exports = Expense; 
  