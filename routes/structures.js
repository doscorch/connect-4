////////////////////////////////
/// Connect 4 Structures
////////////////////////////////

////////////////////////////////
/// Guid
////////////////////////////////
const GUID = new class Guid {
  constructor() {
    this.id = 0;
  }
  create() {
    return ++this.id;
  }
}

class User {
  constructor(id, username, password, defaultTheme) {
    this._id = id;
    this.username = username;
    this.password = password;
    this.default = defaultTheme;
  }
};

//to use User = require('./userModel');
// new User(username, password);

////////////////////////////////
/// Token
////////////////////////////////
class Token {
  constructor(name, url) {
    this.id = GUID.create(); // A string denoting a unique id of the token.
    this.name = name; // A string that describes the tokens appearance.
    this.url = url; // A string giving the URL of the tokens image in either PNG, GIF, or JPEG format.
  }
};

const _doscorch = new Token("doscorch", "https://scontent-ort2-1.xx.fbcdn.net/v/t1.0-9/52002811_2358705634348803_6936934119381139456_o.jpg?_nc_cat=111&_nc_ht=scontent-ort2-1.xx&oh=b2c2c955523fc462e3a832650b1adf35&oe=5CDB8BEE");
const _computer = new Token("computer", "http://i.stack.imgur.com/MAdZq.gif");
const _deadmau5 = new Token("deadmau5", "http://s3.amazonaws.com/lntv-beta/Relevant%20Galleries/Deadmau5_101.jpg");
const _shelby = new Token("Thomas Shelby", "http://img02.deviantart.net/b34e/i/2015/149/4/f/thomas_shelby_by_junowski-d8v6vgs.jpg");
const _adama = new Token("Adama", "https://1.bp.blogspot.com/-PyqKCyorSGk/V-VL0uoKKVI/AAAAAAAAixk/wDh4va5oDsg4hmwH145Ue1nhS6jb61q5ACEw/s1600/adama.jpg");
const _cartman = new Token("Cartman", "http://silveiraneto.net/wp-content/uploads/2008/01/screw_you_guys_im_going_home.gif");

const _tokenlist = [_doscorch, _computer, _deadmau5, _shelby, _adama, _cartman];

////////////////////////////////
/// Theme
////////////////////////////////
class Theme {
  constructor(color, playerToken, computerToken) {
    this.color = color; // A string denoting the #DDDDDD formatted game color
    this.playerToken = playerToken; // A token object denoting the player.
    this.computerToken = computerToken; // A token object denoting the computer.
  }
}

const _defaultTheme = new Theme("#ff0000", _doscorch, _computer)

////////////////////////////////
/// Metadata
////////////////////////////////
class Metadata {
  constructor(tokens, def) {
    this.tokens = tokens; // A list of all token objects supported by the app.
    this.def = def; // A theme object denoting the default theme for new game creation.
  }
}

const _metadata = new Metadata(_tokenlist, _defaultTheme);

////////////////////////////////
/// Game
////////////////////////////////
const _gameStatuses = { unfinished: "UNFINISHED", loss: "LOSS", victory: "VICTORY", tie: "TIE" }
class Game {
  constructor(userId, theme) {
    this.userId = userId;
    this.theme = theme; // A theme object denoting the games theme.
    this.status = _gameStatuses.unfinished; // A string denoting the game status. This string will be one of UNFINISHED, LOSS, VICTORY or TIE.
    this.start = new Date().toDateString(); // A date denoting the time of game creation.
    this.finish = undefined; // A date denoting the time at which the game was completed. This property is only present on a finished game.
    this.grid = [
      [" ", " ", " ", " ", " ", " ", " "],
      [" ", " ", " ", " ", " ", " ", " "],
      [" ", " ", " ", " ", " ", " ", " "],
      [" ", " ", " ", " ", " ", " ", " "],
      [" ", " ", " ", " ", " ", " ", " "]
    ]; // A list of lists denoting the game cells. The list is returned in row-major order. Each cell contains either an X (for a cell the player occupies) or a O (for a cell the computer occupies) or a single space for an unoccupied cell.
  }
}

////////////////////////////////
/// Error
////////////////////////////////
class Error {
  constructor(msg) {
    this.msg = msg; // A string describing the error that occured.
  }
}

class CSRF{
  constructor() {
    this.value = GUID.create();
  }
}

module.exports = {
  GUID: GUID, 
  User: User, 
  Token: Token, 
  Theme: Theme, 
  Metadata: Metadata, 
  Game: Game, 
  Error: Error,
  CSRF: CSRF,
  _metadata: _metadata,
  _gameStatuses: _gameStatuses,
  _defaultTheme: _defaultTheme
};