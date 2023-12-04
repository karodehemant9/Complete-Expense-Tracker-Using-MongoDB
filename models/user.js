const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    totalExpense: {
        type: Number,
        default: 0
    },
    isPremiumUser: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true // The timestamps option is added to automatically include createdAt and updatedAt fields in each document. If you don't need these fields, you can remove this option.
});

const User = mongoose.model('User', userSchema);

module.exports = User;




















// const Sequelize = require('sequelize');

// const sequelize = require('../util/database');

// const User  = sequelize.define('user',{
//   id: {type: Sequelize.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true},
//   name: {type: Sequelize.STRING, allowNull: false},
//   email: {type: Sequelize.STRING, allowNull: false},
//   password: {type: Sequelize.STRING, allowNull: false},
//   totalExpense: {type: Sequelize.FLOAT, defaultValue: 0},
//   isPremiumUser: {type: Sequelize.BOOLEAN , defaultValue: false}
// });

// module.exports = User; 
