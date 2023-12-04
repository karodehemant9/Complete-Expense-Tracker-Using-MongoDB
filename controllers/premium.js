const User = require('../models/user');
const Expense = require('../models/expense');
const mongoose = require('mongoose');

exports.getLeaderboardData = (async (req, res, next) => {
  
    try {
        // aggregate method is used to perform aggregation on the User collection.
        const leaderboardUsers = await User.aggregate([
            {
                //The $lookup stage is used to perform a left outer join between the User collection and the Expense collection based on the userId field.
                $lookup: {
                    from: 'expenses', // name of the Expense collection in MongoDB
                    localField: '_id', // field from the User collection
                    foreignField: 'user', // field from the Expense collection
                    as: 'expenses' // alias for the joined array
                }
            },
            {
                //The $project stage is used to include only the specified fields (id, name, totalExpense) in the result.
                $project: {
                    id: 1,
                    name: 1,
                    //The $sum operator is used to calculate the totalExpense by summing the amount field from the expenses array.
                    totalExpense: { $sum: '$expenses.amount' } // calculate totalExpense using $sum
                }
            },
            {
                //The $sort stage is used to sort the result based on the totalExpense field in descending order.
                $sort: { totalExpense: -1 }
            }
        ]);

        return res.status(200).json({ leaderboardData: leaderboardUsers, success: true });

    } catch (error) {
        console.log(error);
        return res.status(500).json(error);
    }
})




































// const User = require('../models/user');
// const sequelize = require('../util/database');

// exports.getLeaderboardData = (async (req, res, next) => {
  
//     //way 5:
//     try {
//         const leaderboardUsers = await User.findAll({

//             attributes: ['id', 'name', 'totalExpense'],
//             order: [[sequelize.col('totalExpense'), 'DESC']] //take only necessary fields from table
//         });

//         return res.status(200).json({ leaderboardData: leaderboardUsers, success: true });

//     } catch (error) {
//         console.log(error);
//         return res.status(500).json(error);
//     }
// })




//   //way 2 : optimized
//     // try {
//     //     const users = await User.findAll({

//     //         attributes: ['id', 'name'] //take only necessary fields from table
//     //     });

//     //     const userAggregatedExpenses = await Expense.findAll({
//     //         //attributes: ['userId', 'amount']   //take only necessary fields from table
//     //         attributes: ['userId', [sequelize.fn('sum', sequelize.col('amount')), 'totalExpense']],
//     //         group: ['userId']
//     //     });


//     //     console.log('-----------------------------');
//     //     console.log(users);
//     //     console.log('-----------------------------');

//     //     console.log('-----------------------------');
//     //     console.log(JSON.stringify(userAggregatedExpenses, null, 2));
//     //     console.log('-----------------------------');


//     //     console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');
//     //     console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');
//     //     console.log('##############################');
//     //     console.log('##############################');



//     //     var leaderboardData = [];

//     //     // ************* this code is not working *****************
//     //     users.forEach((user) => {
//     //         console.log('##############################');
//     //         console.log('##############################');
//     //         leaderboardData.push({id: user.id, name: user.name, totalExpense: userAggregatedExpenses});
//     //     })
//     //     // ************* ask the mentor*****************************

//     //     console.log(leaderboardData);
//     //     leaderboardData.sort((user1, user2) => user2.totalExpense - user1.totalExpense);
//     //     console.log(`sorted leaderboard data ${leaderboardData}`);
//     //     return res.status(200).json({ leaderboardData: leaderboardData, success: true });

//     // } catch (error) {
//     //     console.log(error);
//     //     res.status(500).json(error);
//     // }
    





//     //way 1 : brute force
//     // try {
//     //     const users = await User.findAll();
//     //     const expenses = await Expense.findAll();
//     //     const userAggregatedExpenses = {};
//     //     console.log(expenses);

//     //     expenses.forEach((expense)=> {
//     //         if(userAggregatedExpenses[expense.userId]){
//     //             userAggregatedExpenses[expense.userId] = userAggregatedExpenses[expense.userId] + expense.amount;
//     //         }
//     //         else{
//     //             userAggregatedExpenses[expense.userId] = expense.amount;
//     //         }

//     //     })

//     //     var leaderboardData = [];

//     //     users.forEach((user)=>{
//     //         leaderboardData.push({name: user.name, totalExpense: userAggregatedExpenses[user.id] || 0});
//     //     })

//     //     console.log(leaderboardData);
//     //     leaderboardData.sort((user1, user2)=> user2.totalExpense - user1.totalExpense);
//     //     console.log(`sorted leaderboard data ${leaderboardData}`);
//     //     return res.status(200).json({leaderboardData: leaderboardData, success: true});

//     // } catch (error) {
//     //     console.log(error);
//     //     res.status(500).json(error);
//     // }



//     //way 3:
//     // try {
//     //     const leaderboardUsers = await User.findAll({

//     //         attributes: ['id', 'name', [sequelize.fn('sum', sequelize.col('amount')), 'totalExpense']],
//     //         include: [
//     //             {
//     //                 model: Expense,
//     //                 attributes: []
//     //             }
//     //         ],
//     //         group: ['id'],
//     //         order: [[sequelize.col('totalExpense'), 'DESC']] //take only necessary fields from table
//     //     });

//     //     return res.status(200).json({ leaderboardData: leaderboardUsers, success: true });

//     // } catch (error) {
//     //     console.log(error);
//     //     res.status(500).json(error);
//     // }





//     //way 4:    
//     // const result = await sequelize.query('SELECT sum(e.amount) as totalExpense, u.id, u.name from users as u INNER JOIN expenses as e ON u.id = e.userId GROUP BY e.userId ORDER BY sum(e.amount) DESC');
//     // console.log(result);
//     // return res.json({leaderboardData: result[0], success: true});