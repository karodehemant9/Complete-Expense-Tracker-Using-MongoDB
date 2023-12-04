const mongoose = require('mongoose');

const forgetPasswordRequestSchema = new mongoose.Schema({
    uuid: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        required: true,
        default: true
    },
    //added due to one to many relationship between user and forgetPasswordRequest
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true // The timestamps option is added to automatically include createdAt and updatedAt fields in each document. If you don't need these fields, you can remove this option.
});

const ForgetPasswordRequest = mongoose.model('ForgetPasswordRequest', forgetPasswordRequestSchema);

module.exports = ForgetPasswordRequest;




















// const Sequelize = require('sequelize');

// const sequelize = require('../util/database');

// const ForgetPasswordRequest  = sequelize.define('forgetPasswordRequest',{
//   uuid: {type: Sequelize.STRING, allowNull: false, primaryKey: true},
//   userId: {type: Sequelize.INTEGER, allowNull: false},
//   isActive: {type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true},
// });

// module.exports = ForgetPasswordRequest; 
  