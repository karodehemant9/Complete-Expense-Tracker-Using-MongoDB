const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    paymentId: {
        type: String
    },
    orderId: {
        type: String
    },
    status: {
        type: String
    },
    //added due to one to many relationship between user and order
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true // The timestamps option is added to automatically include createdAt and updatedAt fields in each document. If you don't need these fields, you can remove this option.
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;


















// const Sequelize = require('sequelize');

// const sequelize = require('../util/database');

// const Order  = sequelize.define('order',{
//   id: {type: Sequelize.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true},
//   paymentid: {type: Sequelize.STRING},
//   orderid: {type: Sequelize.STRING},
//   status: {type: Sequelize.STRING}
// });

// module.exports = Order; 
  