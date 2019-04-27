var db = require('./db');
var structures = require('./structures');
var mongo = require('mongodb');

////////////////////////////////
/// Exports
////////////////////////////////
function createGame(game, cb){
    db.collection('games').insertOne(game, function( err, writeResult ) {
        let game = transform(writeResult.ops[0]);
        cb(err, game);
    } );
}

module.exports.createGame = createGame;

function updateGame(game, cb){
    let gameCopy = JSON.parse(JSON.stringify(game));
    delete gameCopy.id;
    let query = { _id: new mongo.ObjectId(game.id) };
    let values = { $set: gameCopy };
    db.collection('games').updateOne(query, values, function(err, res){
        if(err) throw err
        cb(err);
    })
}

module.exports.updateGame = updateGame;

function getGame(gid, cb){
    console.log('find');
    db.collection('games').findOne({_id: new mongo.ObjectID(gid)}, function(err, game){
        console.log('transform');
        cb(err, transform(game));
    });
}

module.exports.getGame = getGame;

function getGames(uid, cb){
    console.log('Games:');
    db.collection('games').find({userId: uid}).toArray(function(err, results){
        console.log(results);
        results.forEach(result => transform(result));
        cb(err, results);
    });
}

module.exports.getGames = getGames;


////////////////////////////////
/// Utility
////////////////////////////////
function transform(game){
    if(game){
        game.id = game._id.toString();
        delete game._id;
    }
    return game;
}
