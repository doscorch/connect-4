var express = require('express');
var router = express.Router();
var structures = require('./structures');
var users = require('./users');
var games = require('./games');

////////////////////////////////
/// Setup Routes
////////////////////////////////
/* GET connectfour app */
router.get('/connectfour', function (req, res, next) {
  res.sendFile("index.html", { root: __dirname + "/../public" });
});

/* GET game metadata */
router.get('/connectfour/api/v2/meta', function (req, res, next) {
  res.send(structures._metadata);
});

////////////////////////////////
/// Authentication Routes
////////////////////////////////
router.get('/connectfour/api/v2/auth', function (req, res, next) {
  let user = req.session.user;
  let status = user ? true : false;
  res.send({status: status, user: user});
});

// POST new user
router.post('/connectfour/api/v2/users', function (req, res, next) {
  if (!validateEmail(req.body.email)) {
    res.status('400').send(new structures.Error('invalid email'));
    return;
  }
  if (!validatePassword(req.body.password)) {
    res.status('400').send(new structures.Error('invalid password'));
    return;
  }
  users.createUser(req.body, function (err, user) {
    if (err) {
      res.status('500').send(new structures.Error('mongo insert failed'));
      return;
    }
    delete user.password;
    res.send(user);
  });
});

// Login user
router.post('/connectfour/api/v2/login', function (req, res, next) {
  if (!validateEmail(req.body.email)) {
    res.status('400').send(new structures.Error('invalid email'));
    return;
  }
  if (!validatePassword(req.body.password)) {
    res.status('400').send(new structures.Error('invalid password'));
    return;
  }
  users.getUser(req.body, function (err, user) {
    if (err) {
      res.status('500').send(new structures.Error('mongo find failed'));
      return;
    }
    req.session.regenerate(function (err) {
      if (err) {
        res.status('500').send(new structures.Error('session regenerate failed'));
        return;
      }
      if (!user) {
        res.status('400').send(new structures.Error('invalid email or password'));
        return;
      }
      delete user.password;
      req.session.user = user;
      let csrf = new structures.CSRF().value;
      req.session.csrf = csrf;
      res.setHeader('X-CSRF', csrf);
      res.send(user);
    });
  });
});

// Logout user
router.post('/connectfour/api/v2/logout', function (req, res, next) {
  req.session.regenerate(function (err) {
    res.redirect('/');
  });
});

////////////////////////////////
/// Application Routes
////////////////////////////////
// path and cookie user matches
router.all('/connectfour/api/v2/users/:uid/*', function (req, res, next) {
  let authUser = req.session.user;
  if (authUser && authUser.id == req.params.uid && req.headers['x-csrf'] && req.headers['x-csrf'] == req.session.csrf) {
    next();
  } else {
    req.session.regenerate(function(err){
      res.redirect('/');
    });
  }
});

router.all('/connectfour/api/v2/users/:uid', function (req, res, next) {
  let authUser = req.session.user;
  if (authUser && authUser.id == req.params.uid && req.headers['x-csrf'] && req.headers['x-csrf'] == req.session.csrf) {
    next();
  } else {
    req.session.regenerate(function(err){
      res.redirect('/');
    });
  }
});

// PUT user default
router.put('/connectfour/api/v2/users/:uid/default', function (req, res, next) {
  if (!validateDefaults(req.body)) {
    res.status('400').send(new structures.Error('invalid defaults'));
    return;
  }
  let user = req.session.user;
  user.default = req.body;
  users.updateUser(user, function (err) {
    if (err) {
      res.status('500').send(new structures.Error('mongo find update'));
      return;
    }
    res.send(user.default);
  });
});

/* GET list of games */
router.get('/connectfour/api/v2/users/:uid', function (req, res, next) {
  let uid = req.params.uid;
  games.getGames(uid, function(err, games){
    if(err){
      res.status('500').send(new structures.Error('mongo find games'));
      return;
    }
    res.send(games);
  });
});

/* POST new game */
router.post('/connectfour/api/v2/users/:uid', function (req, res, next) {
  let uid = req.params.uid;
  let game = new structures.Game(uid, req.body);
  if (game.theme.playerToken.id == game.theme.computerToken.id) {
    res.send(new structures.Error("Derp... something is wrong with params!"));
    return;
  }

  games.createGame(game, function(err, game){
    if(err){
      res.status('500').send(new structures.Error('mongo create game'));
      return;
    }
    res.send(game);
  });
});

/* GET sends a game */
router.get('/connectfour/api/v2/users/:uid/gids/:gid', function (req, res, next) {
  let gid = req.params.gid;
  let uid = req.params.uid;
  games.getGame(gid, function(err, game){
    if(err){
      res.status('500').send(new structures.Error('mongo get game'));
      return;
    }
    if (!game) {
      res.status('400').send(new structures.Error('game doesnt exist'));
      return;
    }
    if (game.userId != uid) {
      res.status('400').send(new structures.Error('game doesnt belong to you!'));
      return;
    }
    res.send(game);
  });
});

/* POST Make a move */
router.post('/connectfour/api/v2/users/:uid/gids/:gid', function (req, res, next) {
  let position = req.body.position;
  let uid = req.params.uid;
  let gid = req.params.gid;
  if (position < 0 || position > 6) {
    res.send(new structures.Error("Derp... something is wrong with move!"));
    return;
  }

  games.getGame(gid, function(err, game){
    if(err){
      res.status('500').send(new structures.Error('mongo get game'));
      return;
    }
    if (!game) {
      res.status('400').send(new structures.Error('game doesnt exist'));
      return;
    }
    if (game.userId != uid) {
      res.status('400').send(new structures.Error('game doesnt belong to you!'));
      return;
    }

    if (game.status == "UNFINISHED") {
      makeMove(game, position);
    }
    games.updateGame(game, function(err){
      if(err){
        res.status('500').send(new structures.Error('mongo update game'));
        return;
      }
      res.send(game);
    });
  });
});



function makeMove(game, position) {
  let success = playerMove(game, position);
  if (testSuccess(game, 'X')) {
    game.finish = new Date().toDateString();
    game.status = structures._gameStatuses.victory
    return;
  }

  if (testFull(game)) {
    game.finish = new Date().toDateString();
    game.status = structures._gameStatuses.tie;
    return;
  }

  if (success) {
    computerMove(game)
  }

  if (testSuccess(game, '0')) {
    game.finish = new Date().toDateString();
    game.status = structures._gameStatuses.loss;
    return;
  }

}

////////////////////////////////
/// Utility Functions
////////////////////////////////
function playerMove(game, position) {
  let success = false;
  //player move
  for (var y = 4; y >= 0; y--) {
    if (game.grid[y][position] == ' ') {
      success = true;
      game.grid[y][position] = 'X';
      break;
    }
  }
  return success;
}

function computerMove(game) {
  let success = false;
  while (!success) {
    var xInt = parseInt((Math.random() * 7), 10);
    for (var y = 4; y >= 0; y--) {
      if (game.grid[y][xInt] == ' ') {
        success = true;
        game.grid[y][xInt] = '0';
        break;
      }
    }
  }
}

function testSuccess(game, symbol) {
  let gg = game.grid;
  for (var y = 4; y >= 0; y--) {
    for (var x = 6; x >= 0; x--) {
      // test all posibilites for success
      //right
      if (x < 4) {
        if (gg[y][x] == symbol && gg[y][x + 1] == symbol && gg[y][x + 2] == symbol && gg[y][x + 3] == symbol) {
          return true;
        }
      }
      //up
      if (y > 2) {
        if (gg[y][x] == symbol && gg[y - 1][x] == symbol && gg[y - 2][x] == symbol && gg[y - 3][x] == symbol) {
          return true;
        }
      }
      //left
      if (x > 2) {
        if (gg[y][x] == symbol && gg[y][x - 1] == symbol && gg[y][x - 2] == symbol && gg[y][x - 3] == symbol) {
          return true;
        }
      }
      //down
      if (y < 2) {
        if (gg[y][x] == symbol && gg[y + 1][x] == symbol && gg[y + 2][x] == symbol && gg[y + 3][x] == symbol) {
          return true;
        }
      }
      //up right
      if (x < 4 && y > 2) {
        if (gg[y][x] == symbol && gg[y - 1][x + 1] == symbol && gg[y - 2][x + 2] == symbol && gg[y - 3][x + 3] == symbol) {
          return true;
        }
      }
      //up left
      if (y > 2 && x > 2) {
        if (gg[y][x] == symbol && gg[y - 1][x - 1] == symbol && gg[y - 2][x - 2] == symbol && gg[y - 3][x - 3] == symbol) {
          return true;
        }
      }
      //down right
      if (x < 4 && y < 2) {
        if (gg[y][x] == symbol && gg[y + 1][x + 1] == symbol && gg[y + 2][x + 2] == symbol && gg[y + 3][x + 3] == symbol) {
          return true;
        }
      }
      //down left
      if (y < 2 && x > 2) {
        if (gg[y][x] == symbol && gg[y + 1][x - 1] == symbol && gg[y + 2][x - 2] == symbol && gg[y + 3][x - 3] == symbol) {
          return true;
        }
      }
    }
  }
  return false;
}

function testFull(game, symbol) {
  for (var x = 0; x < 7; x++) {
    for (var y = 0; y < 5; y++) {
      if (game.grid[y][x] == ' ') {
        return false;
      }
    }
  }
  return true;
}

function validateEmail(email) {
  if (email && /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    return true;
  }
  return false;
}

function validatePassword(password) {
  if (password && password.length >= 8 && /\d/.test(password)) {
    return true;
  }
  return false;
}

function validateDefaults(defaults) {
  if (('color' in defaults) && ('playerToken' in defaults) && ('computerToken' in defaults)) {
    return true;
  }
  return false;
}

module.exports = router;
