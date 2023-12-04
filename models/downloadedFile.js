const mongoose = require('mongoose');

const downloadedFileSchema = new mongoose.Schema({
    fileURL: {
        type: String
    },
    //added due to one to many relationship between user and downloadedFiles
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true // The timestamps option is added to automatically include createdAt and updatedAt fields in each document. If you don't need these fields, you can remove this option.
});

const DownloadedFile = mongoose.model('DownloadedFile', downloadedFileSchema);

module.exports = DownloadedFile;




// const Sequelize = require('sequelize');
// const sequelize = require('../util/database');

// const DownloadedFile  = sequelize.define('downloadedFile',{
//   id: {type: Sequelize.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true},
//   fileURL: {type: Sequelize.STRING}
// });

// module.exports = DownloadedFile; 
  