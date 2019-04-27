var db = require('./db');
var structures = require('./structures');
var mongo = require('mongodb');

////////////////////////////////
/// Exports
////////////////////////////////
function createUser(user, cb){
    db.collection('users').insertOne(user, function( err, writeResult ) {
        cb(err, writeResult.ops[0])
    } );
}

module.exports.createUser = createUser;

function updateUser(user, cb){
    let userCopy = JSON.parse(JSON.stringify(user));
    delete userCopy.id;
    let query = { _id: new mongo.ObjectId(user.id) };
    let values = { $set: userCopy };
    db.collection('users').updateOne(query, values, function(err, writeResult){
        cb(err);
    });
}

module.exports.updateUser = updateUser;

function getUser(user, cb){
    db.collection('users').findOne(user, function(err, user){
        cb(err, transform(user));
    });
}

module.exports.getUser = getUser;


////////////////////////////////
/// Utility
////////////////////////////////
function transform(user){
    if(user){
        user.id = user._id.toString();
        delete user._id;
    }
    return user;
}
