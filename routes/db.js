var MongoClient = require('mongodb').MongoClient;
var structures = require('./structures');
var db;
var dbName = 'connectfour';
var url = "mongodb://localhost:27017/" + dbName;

////////////////////////////////
/// Exports
////////////////////////////////
MongoClient.connect(url, function(err, database){
    if(err) throw err;
    db = database.db(dbName);
    db.collection("users").drop(function(err, delOK) {
        db.createCollection("users", function(err, res) {
            if (err) throw err;
            createUser({ email : 'bilbo@mordor.org', password : '123123123', default : structures._defaultTheme }, function(err, user){});
            createUser({ email : 'frodo@mordor.org', password : '234234234', default : structures._defaultTheme }, function(err, user){});
            createUser({ email : 'samwise@mordor.org', password : '345345345', default : structures._defaultTheme }, function(err, user){});
        });
    });

    db.collection("games").drop(function(err, delOK) {
        db.createCollection("games", function(err, res) {
            if (err) throw err;
        });
    });   
});

module.exports = { collection : (name) => db.collection(name) };

////////////////////////////////
/// Utiltity Functions
////////////////////////////////
function createUser(user, cb){
    db.collection('users').insertOne(user, function( err, writeResult ) {
        cb(err, writeResult.ops[0])
    } );
}
