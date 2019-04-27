const app = new class Connect4App {
    constructor() {
        this.session = {
            uid: -1,
            user: {},
            sid: -1,
            games: {}
        };
        this.metadata = {};
    }

    ////////////////////////////////
    //// FETCH
    ////////////////////////////////
    postUser = function (email, password) {
        let user = { email: email, password: password, defaults: null }
        fetch('/connectfour/api/v2/users', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(user)
        }).then(function (res) {
            return res.json();
        }).then(user => {
            console.log(user);
        }).catch(function (err) {
            alert("failed to post user: " + err);
        });
    };

    auth = function(){
        fetch('/connectfour/api/v2/auth', {
            method: 'GET'
        }).then(function (res) {
            return res.json();
        }).then(body => {
            if('msg' in user){
                throw user.msg;
            }
            if(body.status){
                app.setupUser(body.user);
                app.viewGameList();
            } else {
                app.viewLogin();
                CSRF.set(null);
            }
        }).catch(function (err) {
            alert("login invalid: " + err);
        });
    }

    login = function () {
        // let formData = new FormData($('#login-form')[0]); 
        let email = $('#email-input').val();
        let password = $('#password-input').val();
        fetch('/connectfour/api/v2/login', {
            method: 'POST',
            headers: {
                // "Content-Type": "application/x-www-form-urlencoded",
                "Content-Type": "application/json",
            },
            // body: formData
            body: JSON.stringify({ email: email, password: password }),
        }).then(function (res) {
            CSRF.set(res.headers.get('X-CSRF'));
            return res.json();
        }).then(user => {
            if('msg' in user){
                throw user.msg;
            }
            app.setupUser(user);
            app.viewGameList();
        }).catch(function (err) {
            alert("login invalid: " + err);
        });

        $('#email-input').val('');
        $('#password-input').val('');
    }

    logout = function(){
        fetch('/connectfour/api/v2/logout', {
            method: 'POST',
        }).then(function (res) {
            CSRF.set(null);
            $('#user-menu').addClass('d-none');
            $('#user').html('');
            CSRF.set(null);
            app.viewLogin();
            app.clearGameList();
            app.clearGameboard();
        }).catch(function (err) {
            alert("logout invalid: " + err);
        });
    }

    putUser = function(def) {
        fetch('/connectfour/api/v2/users/'+app.session.uid+'/default', {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
                "X-CSRF": CSRF.get()
            },
            body: JSON.stringify(def)
        }).then(function (res) {
            return res.json();
        }).then(def => {
            if('msg' in def){
                throw def.msg;
            }
            console.log(def);
            location.reload();
        }).catch(function (err) {
            alert("failed to post user: " + err);
        });
    }

    postGame = function () {
        let data = {
            color: $('#color-input').val(),
            playerToken: app.metadata.tokens.filter(token => token.id == $('#player-input').val())[0],
            computerToken: app.metadata.tokens.filter(token => token.id == $('#computer-input').val())[0],
        };

        fetch('/connectfour/api/v2/users/' + app.session.uid, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "X-CSRF": CSRF.get()
            },
            body: JSON.stringify(data)
        }).then(res => {
            return res.json()
        }).then(game => {
            if ("msg" in game) {
                throw game.msg;
            }
            app.session.games[game.id] = game;
            app.loadGame(game);
            app.playGame(game);
        }).catch(function (err) {
            alert("failed to post game: " + err);
        });
    };

    getMetadata = function () {
        fetch('/connectfour/api/v2/meta', {
            method: 'GET'
        }).then(res => {
            return res.json()
        }).then(metadata => {
            if ("msg" in metadata) {
                throw metadata.msg;
            }

            app.metadata = metadata;
            app.loadMetadata(metadata);
        }).catch(function (err) {
            alert("failed to get metadata: " + err);
        });
    };

    getGames = function () {
        fetch('/connectfour/api/v2/users/' + app.session.uid, {
            method: 'GET',
            headers: {
                "X-CSRF": CSRF.get()
            }
        }).then(res => {
            return res.json()
        }).then(games => {
            if ("msg" in games) {
                throw games;
            }

            app.session.games = games;
            $.each(games, (gameid, game) => {
                app.loadGame(game);
            });
        }).catch(function (err) {
            alert("failed to get games: " + err);
        });
    };

    getGame = function (gid) {
        fetch('/connectfour/api/v2/users/' + app.session.uid + '/gids/' + gid, {
            method: 'GET',
            headers: {
                "X-CSRF": CSRF.get()
            }
        }).then(res => {
            return res.json()
        }).then(game => {
            if ("msg" in game) {
                throw game.msg;
            }

            app.playGame(game);
        }).catch(function (err) {
            alert("failed to get game: " + err);
        });
    };

    postMove = function (gid, position) {
        fetch('/connectfour/api/v2/users/' + app.session.uid + '/gids/' + gid, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "X-CSRF": CSRF.get()
            },
            body: JSON.stringify({ "position": position })
        }).then(res => {
            return res.json()
        }).then(game => {
            if ("msg" in game) {
                throw game;
            }

            app.renderGame(game);
        }).catch(function (err) {
            alert("failed to post move: " + err);
        });
    };

    ////////////////////////////////
    //// DOM MANIPULATION
    ////////////////////////////////
    loadMetadata = function (metadata) {
        let playerInput = $('#player-input');
        let computerInput = $('#computer-input');
        metadata.tokens.forEach(token => {
            playerInput.append(new Option(token.name, token.id));
        });
        playerInput.val(metadata.def.playerToken.id);

        metadata.tokens.forEach(token => {
            computerInput.append(new Option(token.name, token.id));
        });
        computerInput.val(metadata.def.computerToken.id);

        $('#color-input').val(metadata.def.color);
    }

    loadGame = function (game) {
        let gameid = "'" + game.id + "'";
        $('#game-list').append($('<tr>')
            .append($('<td id="status-' + game.id + '">').html(game.status))
            .append($('<td>').html('<img src="' + game.theme.playerToken.url + '"class="img-circle prof-img" alt="' + game.theme.playerToken.name + '">'))
            .append($('<td>').html('<img src="' + game.theme.computerToken.url + '"class="img-circle prof-img" alt="' + game.theme.computerToken.name + '">'))
            .append($('<td>').html(game.start))
            .append($('<td id="finish-time-' + game.id + '">').html(game.finish))
            .append($('<td>').html('<span class="btn" style="background-color:' + game.theme.color + ';" onclick="app.getGame(' + gameid + ')">view</span>')));
    }

    playGame = function (game) {
        app.renderGame(game);
        app.viewGame();
    }

    renderGame = function (game) {
        $('#checkerboard-hover').html("").css("height", "110px");
        app.clearGameboard();
        $('#checkerboard').css("background-color", game.theme.color);
        $('#status-' + game.id).html(game.status);
        $('#finish-time-' + game.id).html(game.finish);

        let grid = game.grid;
        let checkerboardHover = $('#checkerboard-hover');
        let gameid = "'" + game.id + "'";
        for (var i = 0; i < 7; i++) {
            checkerboardHover.append($('<th class="move-position" onclick="app.postMove(' + gameid + ', ' + i + ')"></th>'));
        }

        if (game.status == "VICTORY") {
            checkerboardHover.html("").css("height", "0px");
            $('#end-game').html('<img src="http://charity.cs.uwlax.edu/views/cs402/homeworks/hw2/images/winner.gif" id="end-game-image" alt="fireworks">');
        }
        if (game.status == "LOSS") {
            checkerboardHover.html("").css("height", "0px");
            $('#end-game').html('<img src="http://charity.cs.uwlax.edu/views/cs402/homeworks/hw2/images/cry.gif" id="end-game-image" alt="sad day">');
        }
        if (game.status == "TIE") {
            checkerboardHover.html("").css("height", "0px");
            $('#end-game').html('<img src="https://i.stack.imgur.com/jdhVC.png" id="end-game-image" alt="sad day">');
        }



        let checkerboard = $("#checkerboard");
        grid.forEach(row => {
            let rowHtml = $('<tr>');
            row.forEach(cell => {
                let cellHtml = $('<td>');
                if (cell == ' ') {
                    cellHtml.html('<span class="empty-cell"></span>');
                } else if (cell == 'X') {
                    cellHtml.html('<img src="' + game.theme.playerToken.url + '"class="img-circle taken-cell" alt="' + game.theme.playerToken.name + '">');
                } else {
                    cellHtml.html('<img src="' + game.theme.computerToken.url + '"class="img-circle taken-cell" alt="' + game.theme.computerToken.name + '">');
                }
                rowHtml.append(cellHtml);
            })
            checkerboard.append(rowHtml);
        });
        $("#game-status").html(game.status);

        $(".move-position").hover(function () {
            $(this).html('<img src="' + game.theme.playerToken.url + '"class="img-circle taken-cell" alt="' + game.theme.playerToken.name + '">');
        });

        $(".move-position").mouseleave(function () {
            $(this).html('');
        });
    }

    viewLogin = function () {
        app.clearGameboard();
        app.renderView('login');
    }

    viewGameList = function (game) {
        app.clearGameboard();
        app.renderView('gamelist');
    }

    viewGame = function () {
        app.renderView('game');
    }

    renderView = function (view) {
        let loginView = $('#login-view');
        let gameView = $('#game-view');
        let gameListView = $('#game-list-view');
        if (view == 'gamelist') {
            loginView.addClass('d-none');
            gameListView.removeClass('d-none');
            gameView.addClass('d-none');
        } else if (view == 'game') {
            loginView.addClass('d-none');
            gameListView.addClass('d-none');
            gameView.removeClass('d-none');
        } else {
            loginView.removeClass('d-none');
            gameListView.addClass('d-none');
            gameView.addClass('d-none');
        }
    }

    clearGameboard = function(){
        $("#checkerboard").html("");
        $('#end-game').html("");
    }

    clearGameList = function(){
        $("#game-list").html("");
    }

    setupUser = function(user){
        app.session.user = user;
        app.session.uid = user.id;
        app.clearGameList();
        app.clearGameboard();
        app.getGames();
        if(user.default){
            $('#player-input').val(user.default.playerToken.id);
            $('#computer-input').val(user.default.computerToken.id);
            $('#color-input').val(user.default.color);
        } else {
            $('#player-input').val(app.metadata.def.playerToken.id);
            $('#computer-input').val(app.metadata.def.computerToken.id);
            $('#color-input').val(app.metadata.def.color);
        }
        $('#user').html(user.email);
        $('#user-menu').removeClass('d-none');
    }
}
// CSRF
const CSRF = new class CSRF{
    constuctor(){
        this.value = sessionStorage.getItem('X-CSRF');
    }
    get = function(){
        CSRF.value = sessionStorage.getItem('X-CSRF');
        return CSRF.value;
    }
    
    set = function(value){
        sessionStorage.setItem('X-CSRF', value)
        CSRF.value = value;
        return value;
    }
}

// fire onload
$(document).ready(function () {
    app.getMetadata();
    app.auth();
});
