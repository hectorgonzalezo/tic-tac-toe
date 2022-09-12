/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/pubsub-js/src/pubsub.js":
/*!**********************************************!*\
  !*** ./node_modules/pubsub-js/src/pubsub.js ***!
  \**********************************************/
/***/ (function(module, exports, __webpack_require__) {

/* module decorator */ module = __webpack_require__.nmd(module);
/**
 * Copyright (c) 2010,2011,2012,2013,2014 Morgan Roderick http://roderick.dk
 * License: MIT - http://mrgnrdrck.mit-license.org
 *
 * https://github.com/mroderick/PubSubJS
 */

(function (root, factory){
    'use strict';

    var PubSub = {};

    if (root.PubSub) {
        PubSub = root.PubSub;
        console.warn("PubSub already loaded, using existing version");
    } else {
        root.PubSub = PubSub;
        factory(PubSub);
    }
    // CommonJS and Node.js module support
    if (true){
        if (module !== undefined && module.exports) {
            exports = module.exports = PubSub; // Node.js specific `module.exports`
        }
        exports.PubSub = PubSub; // CommonJS module 1.1.1 spec
        module.exports = exports = PubSub; // CommonJS
    }
    // AMD support
    /* eslint-disable no-undef */
    else {}

}(( typeof window === 'object' && window ) || this, function (PubSub){
    'use strict';

    var messages = {},
        lastUid = -1,
        ALL_SUBSCRIBING_MSG = '*';

    function hasKeys(obj){
        var key;

        for (key in obj){
            if ( Object.prototype.hasOwnProperty.call(obj, key) ){
                return true;
            }
        }
        return false;
    }

    /**
     * Returns a function that throws the passed exception, for use as argument for setTimeout
     * @alias throwException
     * @function
     * @param { Object } ex An Error object
     */
    function throwException( ex ){
        return function reThrowException(){
            throw ex;
        };
    }

    function callSubscriberWithDelayedExceptions( subscriber, message, data ){
        try {
            subscriber( message, data );
        } catch( ex ){
            setTimeout( throwException( ex ), 0);
        }
    }

    function callSubscriberWithImmediateExceptions( subscriber, message, data ){
        subscriber( message, data );
    }

    function deliverMessage( originalMessage, matchedMessage, data, immediateExceptions ){
        var subscribers = messages[matchedMessage],
            callSubscriber = immediateExceptions ? callSubscriberWithImmediateExceptions : callSubscriberWithDelayedExceptions,
            s;

        if ( !Object.prototype.hasOwnProperty.call( messages, matchedMessage ) ) {
            return;
        }

        for (s in subscribers){
            if ( Object.prototype.hasOwnProperty.call(subscribers, s)){
                callSubscriber( subscribers[s], originalMessage, data );
            }
        }
    }

    function createDeliveryFunction( message, data, immediateExceptions ){
        return function deliverNamespaced(){
            var topic = String( message ),
                position = topic.lastIndexOf( '.' );

            // deliver the message as it is now
            deliverMessage(message, message, data, immediateExceptions);

            // trim the hierarchy and deliver message to each level
            while( position !== -1 ){
                topic = topic.substr( 0, position );
                position = topic.lastIndexOf('.');
                deliverMessage( message, topic, data, immediateExceptions );
            }

            deliverMessage(message, ALL_SUBSCRIBING_MSG, data, immediateExceptions);
        };
    }

    function hasDirectSubscribersFor( message ) {
        var topic = String( message ),
            found = Boolean(Object.prototype.hasOwnProperty.call( messages, topic ) && hasKeys(messages[topic]));

        return found;
    }

    function messageHasSubscribers( message ){
        var topic = String( message ),
            found = hasDirectSubscribersFor(topic) || hasDirectSubscribersFor(ALL_SUBSCRIBING_MSG),
            position = topic.lastIndexOf( '.' );

        while ( !found && position !== -1 ){
            topic = topic.substr( 0, position );
            position = topic.lastIndexOf( '.' );
            found = hasDirectSubscribersFor(topic);
        }

        return found;
    }

    function publish( message, data, sync, immediateExceptions ){
        message = (typeof message === 'symbol') ? message.toString() : message;

        var deliver = createDeliveryFunction( message, data, immediateExceptions ),
            hasSubscribers = messageHasSubscribers( message );

        if ( !hasSubscribers ){
            return false;
        }

        if ( sync === true ){
            deliver();
        } else {
            setTimeout( deliver, 0 );
        }
        return true;
    }

    /**
     * Publishes the message, passing the data to it's subscribers
     * @function
     * @alias publish
     * @param { String } message The message to publish
     * @param {} data The data to pass to subscribers
     * @return { Boolean }
     */
    PubSub.publish = function( message, data ){
        return publish( message, data, false, PubSub.immediateExceptions );
    };

    /**
     * Publishes the message synchronously, passing the data to it's subscribers
     * @function
     * @alias publishSync
     * @param { String } message The message to publish
     * @param {} data The data to pass to subscribers
     * @return { Boolean }
     */
    PubSub.publishSync = function( message, data ){
        return publish( message, data, true, PubSub.immediateExceptions );
    };

    /**
     * Subscribes the passed function to the passed message. Every returned token is unique and should be stored if you need to unsubscribe
     * @function
     * @alias subscribe
     * @param { String } message The message to subscribe to
     * @param { Function } func The function to call when a new message is published
     * @return { String }
     */
    PubSub.subscribe = function( message, func ){
        if ( typeof func !== 'function'){
            return false;
        }

        message = (typeof message === 'symbol') ? message.toString() : message;

        // message is not registered yet
        if ( !Object.prototype.hasOwnProperty.call( messages, message ) ){
            messages[message] = {};
        }

        // forcing token as String, to allow for future expansions without breaking usage
        // and allow for easy use as key names for the 'messages' object
        var token = 'uid_' + String(++lastUid);
        messages[message][token] = func;

        // return token for unsubscribing
        return token;
    };

    PubSub.subscribeAll = function( func ){
        return PubSub.subscribe(ALL_SUBSCRIBING_MSG, func);
    };

    /**
     * Subscribes the passed function to the passed message once
     * @function
     * @alias subscribeOnce
     * @param { String } message The message to subscribe to
     * @param { Function } func The function to call when a new message is published
     * @return { PubSub }
     */
    PubSub.subscribeOnce = function( message, func ){
        var token = PubSub.subscribe( message, function(){
            // before func apply, unsubscribe message
            PubSub.unsubscribe( token );
            func.apply( this, arguments );
        });
        return PubSub;
    };

    /**
     * Clears all subscriptions
     * @function
     * @public
     * @alias clearAllSubscriptions
     */
    PubSub.clearAllSubscriptions = function clearAllSubscriptions(){
        messages = {};
    };

    /**
     * Clear subscriptions by the topic
     * @function
     * @public
     * @alias clearAllSubscriptions
     * @return { int }
     */
    PubSub.clearSubscriptions = function clearSubscriptions(topic){
        var m;
        for (m in messages){
            if (Object.prototype.hasOwnProperty.call(messages, m) && m.indexOf(topic) === 0){
                delete messages[m];
            }
        }
    };

    /**
       Count subscriptions by the topic
     * @function
     * @public
     * @alias countSubscriptions
     * @return { Array }
    */
    PubSub.countSubscriptions = function countSubscriptions(topic){
        var m;
        // eslint-disable-next-line no-unused-vars
        var token;
        var count = 0;
        for (m in messages) {
            if (Object.prototype.hasOwnProperty.call(messages, m) && m.indexOf(topic) === 0) {
                for (token in messages[m]) {
                    count++;
                }
                break;
            }
        }
        return count;
    };


    /**
       Gets subscriptions by the topic
     * @function
     * @public
     * @alias getSubscriptions
    */
    PubSub.getSubscriptions = function getSubscriptions(topic){
        var m;
        var list = [];
        for (m in messages){
            if (Object.prototype.hasOwnProperty.call(messages, m) && m.indexOf(topic) === 0){
                list.push(m);
            }
        }
        return list;
    };

    /**
     * Removes subscriptions
     *
     * - When passed a token, removes a specific subscription.
     *
	 * - When passed a function, removes all subscriptions for that function
     *
	 * - When passed a topic, removes all subscriptions for that topic (hierarchy)
     * @function
     * @public
     * @alias subscribeOnce
     * @param { String | Function } value A token, function or topic to unsubscribe from
     * @example // Unsubscribing with a token
     * var token = PubSub.subscribe('mytopic', myFunc);
     * PubSub.unsubscribe(token);
     * @example // Unsubscribing with a function
     * PubSub.unsubscribe(myFunc);
     * @example // Unsubscribing from a topic
     * PubSub.unsubscribe('mytopic');
     */
    PubSub.unsubscribe = function(value){
        var descendantTopicExists = function(topic) {
                var m;
                for ( m in messages ){
                    if ( Object.prototype.hasOwnProperty.call(messages, m) && m.indexOf(topic) === 0 ){
                        // a descendant of the topic exists:
                        return true;
                    }
                }

                return false;
            },
            isTopic    = typeof value === 'string' && ( Object.prototype.hasOwnProperty.call(messages, value) || descendantTopicExists(value) ),
            isToken    = !isTopic && typeof value === 'string',
            isFunction = typeof value === 'function',
            result = false,
            m, message, t;

        if (isTopic){
            PubSub.clearSubscriptions(value);
            return;
        }

        for ( m in messages ){
            if ( Object.prototype.hasOwnProperty.call( messages, m ) ){
                message = messages[m];

                if ( isToken && message[value] ){
                    delete message[value];
                    result = value;
                    // tokens are unique, so we can just stop here
                    break;
                }

                if (isFunction) {
                    for ( t in message ){
                        if (Object.prototype.hasOwnProperty.call(message, t) && message[t] === value){
                            delete message[t];
                            result = true;
                        }
                    }
                }
            }
        }

        return result;
    };
}));


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.nmd = (module) => {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!*******************!*\
  !*** ./script.js ***!
  \*******************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var pubsub_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! pubsub-js */ "./node_modules/pubsub-js/src/pubsub.js");
/* harmony import */ var pubsub_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(pubsub_js__WEBPACK_IMPORTED_MODULE_0__);

;

const gameBoard = (
    function () {
        let _board;

        const _checkWinHorizontal = function (mark, board = _board) {
            //check if any line has three consecutive marks of any kind
            const win = board.slice(0, 7).some((cell, i) => {
                //check only every three marks if the next two are the same
                return cell === mark && i % 3 === 0 && cell === board[i + 1] && cell === board[i + 2]
            })
            return win
        }

        const _checkWinVertical = function (mark, board = _board) {
            //check vertical lines
            const win = board.slice(0, 3).some((cell, i) => {
                //check in the first row if the two below are the same
                return cell === mark && cell === board[i + 3] && cell === board[i + 6]
            })
            return win
        }

        const _checkWinDiagonal = function (mark, board = _board) {
            const win = board.slice(0, 3).some((cell, i) => {
                //check every index 0 and 2
                if (i === 0 && cell === mark && cell === board[4]) {
                    return cell === board[8]
                } else if (i == 2 && cell === mark && cell === board[4]) {
                    return cell === board[6]
                } else {
                    return false
                }
            })
            return win
        }

        const checkTie = function (board = _board) {
            return board.every((cell) => cell != '')
        }

        const checkWin = function (mark, board = _board) {
            return _checkWinHorizontal(mark, board) || _checkWinVertical(mark, board) || _checkWinDiagonal(mark, board);

        }

        const _update = function (msg, data) {

            //extract data from PubSub
            const { cellNum, mark } = data;
            //don't update if cell has already been played
            if (!checkWin("x") && !checkWin("0")) {
              if (_board[cellNum] == "") {
                _board[cellNum] = mark;
              }
            }
        }

        const _restart = function () {
            _board = new Array(9).fill('');
        }

        pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('game-start', _restart);
        //subscribe to event triggered when player adds a mark
        pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('mark-added', _update);

        const getBoard = () => {
            return _board
        }
        return { checkTie, checkWin, getBoard }
    }
)();

const popUp = (
    function () {
        const _popup = document.querySelector('#pop-up');
        const _popupForm = document.querySelector('#form-player-names');
        const _popupButton = document.querySelector('#pop-up-button');
        const _choosePlayersButton = document.querySelector('#choose-players-button');
        const _visibleArea = document.querySelectorAll('#visible-area');
        const _stateDisplay = document.querySelector('#state-display');


        const _togglePopup = () => {
            _stateDisplay.style.color = '';
            _popup.classList.toggle('invisible');
            _visibleArea.forEach((area) => area.classList.toggle('invisible'));
        }

        _choosePlayersButton.addEventListener('click', _togglePopup);

        //show game after pressing start button in pop up
        _popupButton.addEventListener('click', (e) => {
            //used to display error if both players are AIs
            const alertArea = document.querySelector('#pop-up-alert')
            if (_popupForm.checkValidity()) {
                e.preventDefault();
                const formData = new FormData(_popupForm)
                const newPlayerData = Object.fromEntries(formData.entries())

                const player1Name = newPlayerData['player1Name'];
                const player2Name = newPlayerData['player2Name'];
                const player1Type = newPlayerData['player1Type'];
                const player2Type = newPlayerData['player2Type'];

                //stop game from starting if both are AIs
                if (player1Type != 'human' && player2Type != 'human') {
                    alertArea.innerText = 'At least one has to be human!';
                } else {
                    _togglePopup();

                    const player1 = (player1Type == 'human') ?
                        Player(player1Name, '0') :
                        AIPlayer(player1Name, '0', player1Type);//add difficulty

                    const player2 = (player2Type == 'human') ?
                        Player(player2Name, 'x') :
                        AIPlayer(player2Name, 'x', player2Type);//add difficulty

                    pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publish('game-start', { player1, player2 });
                    _popupForm.reset();
                }
            }
        });
    }
)()

//manages all game updates
const displayController = (
    function () {
        const _gameArea = document.querySelector('#game-area');
        const _gameCells = Array.from(_gameArea.children);
        const _stateDisplay = document.querySelector('#state-display');
        const _restartButton = document.querySelector('#restart-button');

        const _cellListenerFunc = function () {
            //send the cell as a number
            pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publish('cell-pressed', this.getAttribute('data'));
        };


        //restart with button
        _restartButton.addEventListener('click', () => {
            _stateDisplay.style.color = '';
            pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publish('game-start', { 'player1': game.getPlayer1(), 'cellNum': 9 })
        });


        const _restartCells = function () {
            _gameCells.forEach((cell) => {
                cell.children[0].classList.remove('chosen');
                cell.classList.remove('chosen');
                cell.classList.add('circle');
            }
            )
        };

        //updates DOM
        const _render = function (msg, data) {
            //_render if first player isn't AI.
            const board = gameBoard.getBoard();
            const { cellNum } = data;
            _gameCells.forEach((cell, i) => {
                let imagePath
                //_render images
                if (board[i] == '') {
                    imagePath = ''
                    cell.classList.remove('chosen')
                } else {
                    //deactivate cell    
                    cell.removeEventListener('click', _cellListenerFunc)
                    imagePath = board[i] == 'x' ?
                        './images/cross.png' :
                        './images/circle.png';

                    if (cellNum == i) {
                        cell.children[0].classList.add('chosen')
                        cell.classList.add('chosen')
                    }
                };
                //change img source
                cell.children[0].setAttribute('src', imagePath);
            })
        };


        const _changeStateDisplay = function (msg, data) {
            let text
            if (msg == 'turn-passed') {
                const { name, mark, nextPlayer } = data;
                const win = gameBoard.checkWin(mark);
                const tie = gameBoard.checkTie();

                //change class for div:hover
                _gameCells.forEach((cell) => cell.classList.toggle('circle'));

                //if the next player is AI
                if (nextPlayer.hasOwnProperty('addRandom')) {
                    //stop player from choosing for them
                    _gameCells.forEach((cell) => cell.classList.add('chosen'))
                }

                if (win) {
                    text = `${name} won!`
                    _stateDisplay.style.color = 'var(--color-complementary2-dark';
                    _deactivateCells();
                    _deactivateHover();
                } else if (tie) {
                    _stateDisplay.style.color = 'var(--color-complementary1-dark)';
                    text = `It's a tie!`
                } else {
                    text = `${nextPlayer.getName()}'s turn`
                }
            } else {
                const player1 = data['player1'];
                text = `${player1.getName()}'s turn`
            }
            _stateDisplay.innerText = text;
        };


        //add event listeners to cells to update when pressed by player
        const _activateCells = () => {
            _gameCells.forEach(
                (cell) => cell.addEventListener('click', _cellListenerFunc))
        };

        const _deactivateCells = () => {
            _gameCells.forEach(
                (cell) => cell.removeEventListener('click', _cellListenerFunc))
        }

        const _deactivateHover = () => {
            _gameCells.forEach((cell) => cell.classList.add('chosen'))
        }

        pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('mark-added', _render);
        pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('game-start', _restartCells);
        pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('game-start', _activateCells);
        pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('game-start', _changeStateDisplay);
        pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('game-start', _render);
        pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('ai-turn-start', _deactivateHover);
        pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('ai-turn-start', _deactivateCells)
        pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('ai-turn-end', _activateCells);

        pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('turn-passed', _changeStateDisplay);

    })();

//factory function to create a player
const Player = function (name, mark) {
    const _mark = mark;

    const addMark = function (cellNum) {//adds a mark on gameBoard
        pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publish('mark-added', { cellNum, mark: _mark, name })
    }

    const getName = function () {
        return name
    }

    const getMark = function () {
        return _mark
    }

    return { addMark, getName, getMark }
}

const AIPlayer = function (name, mark, difficulty) {
    //inherit from Player
    const prototype = Player(name, mark);
    const _AIMark = mark;

    const _extractEmptyIndexes = (board) => {
        const result = board.reduce((acc, cell, i) => {
            if (cell === '' || typeof (cell) === 'number') {
                acc.push(i)
            }
            return acc
        }, [])
        return result
    }

    //new methods
    const addRandom = () => {
        //check which cells are empty and extract their indexes
        const emptyCellsIndexes = _extractEmptyIndexes(gameBoard.getBoard())
        //choose at random from those indexes
        const randomEmptyIndex = emptyCellsIndexes[
            Math.floor(Math.random() * emptyCellsIndexes.length)
        ]
        //add mark there after random delay
        pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publish('ai-turn-end');
        //ya displayController.activateCells();
        prototype.addMark(randomEmptyIndex)

    };

    const addMiniMax = () => {
        //Original algorithm implementation by Ahmand ABdolsaheb
        //https://www.freecodecamp.org/news/how-to-make-your-tic-tac-toe-game-unbeatable-by-using-the-minimax-algorithm-9d690bad4b37/
        const _humanMark = mark === 'x' ? '0' : 'x';

        const _initialBoard = gameBoard.getBoard().map((x, i) => {
            if (x == '') {
                return i
            } else {
                return x
            }
        })//copy array

        const miniMax = function (newMark = _AIMark, newBoard = _initialBoard) {
            const emptyCellsIndexes = _extractEmptyIndexes(newBoard);
            const _opponentMark = newMark == 'x' ? '0' : 'x';

            if (gameBoard.checkWin(_humanMark, newBoard)) {
                return { score: -10 }
            } else if (gameBoard.checkWin(_AIMark, newBoard)) {
                return { score: 10 }
            } else if (emptyCellsIndexes.length == 0) {
                return { score: 0 }
            };

            // an array to collect all the objects
            let moves = [];

            // loop through available spots
            for (let i = 0; i < emptyCellsIndexes.length; i++) {
                //create an object for each and store the index of that spot 
                let move = {};
                move.index = newBoard[emptyCellsIndexes[i]];

                // set the empty spot to the current player
                newBoard[emptyCellsIndexes[i]] = newMark;

                /*collect the score resulted from calling minimax 
                  on the opponent of the current player*/
                let result = miniMax(_opponentMark, newBoard.map(x => x));
                move.score = result.score;

                // reset the spot to empty
                newBoard[emptyCellsIndexes[i]] = move.index;

                // push the object to the array
                moves.push(move);
            }

            // if it is the computer's turn loop over the moves and choose the move with the highest score
            let bestMove;

            if (newMark === _AIMark) {
                let bestScore = -10000;
                for (const [i, move] of moves.entries()) {
                    if (move.score > bestScore) {
                        bestScore = move.score;
                        bestMove = i;
                    } else if (move.score === bestScore) {//choose at random if its the same score
                        bestScore = move.score;
                        bestMove = [bestMove, i][Math.floor(Math.random() * 2)]
                    }
                }
            } else {

                // else loop over the moves and choose the move with the lowest score
                let bestScore = 10000;
                for (const [i, move] of moves.entries()) {
                    if (move.score < bestScore) {
                        bestScore = move.score;
                        bestMove = i;
                    } else if (move.score === bestScore) {//choose at random if its the same score
                        bestScore = move.score;
                        bestMove = [bestMove, i][Math.floor(Math.random() * 2)]
                    }
                }
            }
            return moves[bestMove]
        }

        const bestMove = miniMax(mark, _initialBoard);

        pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publish('ai-turn-end');
        prototype.addMark(bestMove.index);
    };

    const getDifficulty = () => {
        return difficulty;
    }
    return Object.assign({}, prototype, { addRandom, addMiniMax, getDifficulty })
}

//manages the flow of the game.
const game = (function () {
    let counter = 0;
    let _player1;
    let _player2;

    const getPlayer1 = function () {
        return _player1
    }

    const getPlayer2 = function () {
        return _player2
    }

    const _start = function (msg, data) {
        counter = 0;
        //when restarting, leave same players
        _player1 = data['player1'] ? data['player1'] : _player1;
        _player2 = data['player2'] ? data['player2'] : _player2;
        //if the first player is AI make it play
        _playAI(_player1, _player2);
    };

    const _publishTurnPassed = function (name, mark, nextPlayer) {
        pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publish('turn-passed', { name, mark, nextPlayer })
    }

    //plays a turn
    const _turn = function (msg, data) {
        const cellNum = data
        //alternate turns between players
        if (counter % 2 == 0) {
            _player1.addMark(cellNum);
            _publishTurnPassed(_player1.getName(), _player1.getMark(), _player2);
            counter++
            //check if player2 is AI
            _playAI(_player2, _player1)
        } else {
            _player2.addMark(cellNum);
            _publishTurnPassed(_player2.getName(), _player2.getMark(), _player1);
            counter++
            //check if player1 is AI
            _playAI(_player1, _player2)

        };
    }



    const _playAI = function (player, nextPlayer) {
        //delay allows for board to update, 
        const randomDelay = (Math.random() * 1000) + 1000;
        setTimeout(() => {
            if (player.hasOwnProperty('addRandom') && !gameBoard.checkWin('x') && !gameBoard.checkWin('0')) {
                console.log(gameBoard.getBoard())
    
                pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publish('ai-turn-start', '');
    
                //needed for lookup in addMiniMax and for checkWins
                    //check if player is AI
    
                    if (player.getDifficulty() == 'hard') {
                        player.addMiniMax();
                    } else { //if it's easy difficulty
                        player.addRandom()
                    }
                    _publishTurnPassed(player.getName(), player.getMark(), nextPlayer);
                    counter++
                }
        }, randomDelay)

    }

    pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('game-start', _start);
    pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('cell-pressed', _turn);

    return { getPlayer1, getPlayer2 }
}
)()
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQixlQUFlLHNDQUFzQztBQUNoRjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLFFBQVEsd0RBQWMsa0JBQWtCLHdCQUF3QjtBQUNoRTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7Ozs7QUFJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQix3REFBYztBQUM5QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzQkFBc0IsT0FBTztBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUzs7QUFFVDs7QUFFQSxJQUFJLDBEQUFnQjtBQUNwQixJQUFJLDBEQUFnQjs7QUFFcEIsYUFBYTtBQUNiO0FBQ0EsRyIsInNvdXJjZXMiOlsid2VicGFjazovL3RpYy10YWMtdG9lLy4vbm9kZV9tb2R1bGVzL3B1YnN1Yi1qcy9zcmMvcHVic3ViLmpzIiwid2VicGFjazovL3RpYy10YWMtdG9lL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL3RpYy10YWMtdG9lL3dlYnBhY2svcnVudGltZS9jb21wYXQgZ2V0IGRlZmF1bHQgZXhwb3J0Iiwid2VicGFjazovL3RpYy10YWMtdG9lL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly90aWMtdGFjLXRvZS93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL3RpYy10YWMtdG9lL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vdGljLXRhYy10b2Uvd2VicGFjay9ydW50aW1lL25vZGUgbW9kdWxlIGRlY29yYXRvciIsIndlYnBhY2s6Ly90aWMtdGFjLXRvZS8uL3NjcmlwdC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxMCwyMDExLDIwMTIsMjAxMywyMDE0IE1vcmdhbiBSb2RlcmljayBodHRwOi8vcm9kZXJpY2suZGtcbiAqIExpY2Vuc2U6IE1JVCAtIGh0dHA6Ly9tcmducmRyY2subWl0LWxpY2Vuc2Uub3JnXG4gKlxuICogaHR0cHM6Ly9naXRodWIuY29tL21yb2Rlcmljay9QdWJTdWJKU1xuICovXG5cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSl7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIFB1YlN1YiA9IHt9O1xuXG4gICAgaWYgKHJvb3QuUHViU3ViKSB7XG4gICAgICAgIFB1YlN1YiA9IHJvb3QuUHViU3ViO1xuICAgICAgICBjb25zb2xlLndhcm4oXCJQdWJTdWIgYWxyZWFkeSBsb2FkZWQsIHVzaW5nIGV4aXN0aW5nIHZlcnNpb25cIik7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcm9vdC5QdWJTdWIgPSBQdWJTdWI7XG4gICAgICAgIGZhY3RvcnkoUHViU3ViKTtcbiAgICB9XG4gICAgLy8gQ29tbW9uSlMgYW5kIE5vZGUuanMgbW9kdWxlIHN1cHBvcnRcbiAgICBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKXtcbiAgICAgICAgaWYgKG1vZHVsZSAhPT0gdW5kZWZpbmVkICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICAgICAgICBleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBQdWJTdWI7IC8vIE5vZGUuanMgc3BlY2lmaWMgYG1vZHVsZS5leHBvcnRzYFxuICAgICAgICB9XG4gICAgICAgIGV4cG9ydHMuUHViU3ViID0gUHViU3ViOyAvLyBDb21tb25KUyBtb2R1bGUgMS4xLjEgc3BlY1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBQdWJTdWI7IC8vIENvbW1vbkpTXG4gICAgfVxuICAgIC8vIEFNRCBzdXBwb3J0XG4gICAgLyogZXNsaW50LWRpc2FibGUgbm8tdW5kZWYgKi9cbiAgICBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpe1xuICAgICAgICBkZWZpbmUoZnVuY3Rpb24oKSB7IHJldHVybiBQdWJTdWI7IH0pO1xuICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIG5vLXVuZGVmICovXG4gICAgfVxuXG59KCggdHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcgJiYgd2luZG93ICkgfHwgdGhpcywgZnVuY3Rpb24gKFB1YlN1Yil7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIG1lc3NhZ2VzID0ge30sXG4gICAgICAgIGxhc3RVaWQgPSAtMSxcbiAgICAgICAgQUxMX1NVQlNDUklCSU5HX01TRyA9ICcqJztcblxuICAgIGZ1bmN0aW9uIGhhc0tleXMob2JqKXtcbiAgICAgICAgdmFyIGtleTtcblxuICAgICAgICBmb3IgKGtleSBpbiBvYmope1xuICAgICAgICAgICAgaWYgKCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpICl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IHRocm93cyB0aGUgcGFzc2VkIGV4Y2VwdGlvbiwgZm9yIHVzZSBhcyBhcmd1bWVudCBmb3Igc2V0VGltZW91dFxuICAgICAqIEBhbGlhcyB0aHJvd0V4Y2VwdGlvblxuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7IE9iamVjdCB9IGV4IEFuIEVycm9yIG9iamVjdFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHRocm93RXhjZXB0aW9uKCBleCApe1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gcmVUaHJvd0V4Y2VwdGlvbigpe1xuICAgICAgICAgICAgdGhyb3cgZXg7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2FsbFN1YnNjcmliZXJXaXRoRGVsYXllZEV4Y2VwdGlvbnMoIHN1YnNjcmliZXIsIG1lc3NhZ2UsIGRhdGEgKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHN1YnNjcmliZXIoIG1lc3NhZ2UsIGRhdGEgKTtcbiAgICAgICAgfSBjYXRjaCggZXggKXtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoIHRocm93RXhjZXB0aW9uKCBleCApLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNhbGxTdWJzY3JpYmVyV2l0aEltbWVkaWF0ZUV4Y2VwdGlvbnMoIHN1YnNjcmliZXIsIG1lc3NhZ2UsIGRhdGEgKXtcbiAgICAgICAgc3Vic2NyaWJlciggbWVzc2FnZSwgZGF0YSApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRlbGl2ZXJNZXNzYWdlKCBvcmlnaW5hbE1lc3NhZ2UsIG1hdGNoZWRNZXNzYWdlLCBkYXRhLCBpbW1lZGlhdGVFeGNlcHRpb25zICl7XG4gICAgICAgIHZhciBzdWJzY3JpYmVycyA9IG1lc3NhZ2VzW21hdGNoZWRNZXNzYWdlXSxcbiAgICAgICAgICAgIGNhbGxTdWJzY3JpYmVyID0gaW1tZWRpYXRlRXhjZXB0aW9ucyA/IGNhbGxTdWJzY3JpYmVyV2l0aEltbWVkaWF0ZUV4Y2VwdGlvbnMgOiBjYWxsU3Vic2NyaWJlcldpdGhEZWxheWVkRXhjZXB0aW9ucyxcbiAgICAgICAgICAgIHM7XG5cbiAgICAgICAgaWYgKCAhT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKCBtZXNzYWdlcywgbWF0Y2hlZE1lc3NhZ2UgKSApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAocyBpbiBzdWJzY3JpYmVycyl7XG4gICAgICAgICAgICBpZiAoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzdWJzY3JpYmVycywgcykpe1xuICAgICAgICAgICAgICAgIGNhbGxTdWJzY3JpYmVyKCBzdWJzY3JpYmVyc1tzXSwgb3JpZ2luYWxNZXNzYWdlLCBkYXRhICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVEZWxpdmVyeUZ1bmN0aW9uKCBtZXNzYWdlLCBkYXRhLCBpbW1lZGlhdGVFeGNlcHRpb25zICl7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBkZWxpdmVyTmFtZXNwYWNlZCgpe1xuICAgICAgICAgICAgdmFyIHRvcGljID0gU3RyaW5nKCBtZXNzYWdlICksXG4gICAgICAgICAgICAgICAgcG9zaXRpb24gPSB0b3BpYy5sYXN0SW5kZXhPZiggJy4nICk7XG5cbiAgICAgICAgICAgIC8vIGRlbGl2ZXIgdGhlIG1lc3NhZ2UgYXMgaXQgaXMgbm93XG4gICAgICAgICAgICBkZWxpdmVyTWVzc2FnZShtZXNzYWdlLCBtZXNzYWdlLCBkYXRhLCBpbW1lZGlhdGVFeGNlcHRpb25zKTtcblxuICAgICAgICAgICAgLy8gdHJpbSB0aGUgaGllcmFyY2h5IGFuZCBkZWxpdmVyIG1lc3NhZ2UgdG8gZWFjaCBsZXZlbFxuICAgICAgICAgICAgd2hpbGUoIHBvc2l0aW9uICE9PSAtMSApe1xuICAgICAgICAgICAgICAgIHRvcGljID0gdG9waWMuc3Vic3RyKCAwLCBwb3NpdGlvbiApO1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uID0gdG9waWMubGFzdEluZGV4T2YoJy4nKTtcbiAgICAgICAgICAgICAgICBkZWxpdmVyTWVzc2FnZSggbWVzc2FnZSwgdG9waWMsIGRhdGEsIGltbWVkaWF0ZUV4Y2VwdGlvbnMgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZGVsaXZlck1lc3NhZ2UobWVzc2FnZSwgQUxMX1NVQlNDUklCSU5HX01TRywgZGF0YSwgaW1tZWRpYXRlRXhjZXB0aW9ucyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFzRGlyZWN0U3Vic2NyaWJlcnNGb3IoIG1lc3NhZ2UgKSB7XG4gICAgICAgIHZhciB0b3BpYyA9IFN0cmluZyggbWVzc2FnZSApLFxuICAgICAgICAgICAgZm91bmQgPSBCb29sZWFuKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCggbWVzc2FnZXMsIHRvcGljICkgJiYgaGFzS2V5cyhtZXNzYWdlc1t0b3BpY10pKTtcblxuICAgICAgICByZXR1cm4gZm91bmQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWVzc2FnZUhhc1N1YnNjcmliZXJzKCBtZXNzYWdlICl7XG4gICAgICAgIHZhciB0b3BpYyA9IFN0cmluZyggbWVzc2FnZSApLFxuICAgICAgICAgICAgZm91bmQgPSBoYXNEaXJlY3RTdWJzY3JpYmVyc0Zvcih0b3BpYykgfHwgaGFzRGlyZWN0U3Vic2NyaWJlcnNGb3IoQUxMX1NVQlNDUklCSU5HX01TRyksXG4gICAgICAgICAgICBwb3NpdGlvbiA9IHRvcGljLmxhc3RJbmRleE9mKCAnLicgKTtcblxuICAgICAgICB3aGlsZSAoICFmb3VuZCAmJiBwb3NpdGlvbiAhPT0gLTEgKXtcbiAgICAgICAgICAgIHRvcGljID0gdG9waWMuc3Vic3RyKCAwLCBwb3NpdGlvbiApO1xuICAgICAgICAgICAgcG9zaXRpb24gPSB0b3BpYy5sYXN0SW5kZXhPZiggJy4nICk7XG4gICAgICAgICAgICBmb3VuZCA9IGhhc0RpcmVjdFN1YnNjcmliZXJzRm9yKHRvcGljKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmb3VuZDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwdWJsaXNoKCBtZXNzYWdlLCBkYXRhLCBzeW5jLCBpbW1lZGlhdGVFeGNlcHRpb25zICl7XG4gICAgICAgIG1lc3NhZ2UgPSAodHlwZW9mIG1lc3NhZ2UgPT09ICdzeW1ib2wnKSA/IG1lc3NhZ2UudG9TdHJpbmcoKSA6IG1lc3NhZ2U7XG5cbiAgICAgICAgdmFyIGRlbGl2ZXIgPSBjcmVhdGVEZWxpdmVyeUZ1bmN0aW9uKCBtZXNzYWdlLCBkYXRhLCBpbW1lZGlhdGVFeGNlcHRpb25zICksXG4gICAgICAgICAgICBoYXNTdWJzY3JpYmVycyA9IG1lc3NhZ2VIYXNTdWJzY3JpYmVycyggbWVzc2FnZSApO1xuXG4gICAgICAgIGlmICggIWhhc1N1YnNjcmliZXJzICl7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHN5bmMgPT09IHRydWUgKXtcbiAgICAgICAgICAgIGRlbGl2ZXIoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoIGRlbGl2ZXIsIDAgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQdWJsaXNoZXMgdGhlIG1lc3NhZ2UsIHBhc3NpbmcgdGhlIGRhdGEgdG8gaXQncyBzdWJzY3JpYmVyc1xuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBhbGlhcyBwdWJsaXNoXG4gICAgICogQHBhcmFtIHsgU3RyaW5nIH0gbWVzc2FnZSBUaGUgbWVzc2FnZSB0byBwdWJsaXNoXG4gICAgICogQHBhcmFtIHt9IGRhdGEgVGhlIGRhdGEgdG8gcGFzcyB0byBzdWJzY3JpYmVyc1xuICAgICAqIEByZXR1cm4geyBCb29sZWFuIH1cbiAgICAgKi9cbiAgICBQdWJTdWIucHVibGlzaCA9IGZ1bmN0aW9uKCBtZXNzYWdlLCBkYXRhICl7XG4gICAgICAgIHJldHVybiBwdWJsaXNoKCBtZXNzYWdlLCBkYXRhLCBmYWxzZSwgUHViU3ViLmltbWVkaWF0ZUV4Y2VwdGlvbnMgKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUHVibGlzaGVzIHRoZSBtZXNzYWdlIHN5bmNocm9ub3VzbHksIHBhc3NpbmcgdGhlIGRhdGEgdG8gaXQncyBzdWJzY3JpYmVyc1xuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBhbGlhcyBwdWJsaXNoU3luY1xuICAgICAqIEBwYXJhbSB7IFN0cmluZyB9IG1lc3NhZ2UgVGhlIG1lc3NhZ2UgdG8gcHVibGlzaFxuICAgICAqIEBwYXJhbSB7fSBkYXRhIFRoZSBkYXRhIHRvIHBhc3MgdG8gc3Vic2NyaWJlcnNcbiAgICAgKiBAcmV0dXJuIHsgQm9vbGVhbiB9XG4gICAgICovXG4gICAgUHViU3ViLnB1Ymxpc2hTeW5jID0gZnVuY3Rpb24oIG1lc3NhZ2UsIGRhdGEgKXtcbiAgICAgICAgcmV0dXJuIHB1Ymxpc2goIG1lc3NhZ2UsIGRhdGEsIHRydWUsIFB1YlN1Yi5pbW1lZGlhdGVFeGNlcHRpb25zICk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFN1YnNjcmliZXMgdGhlIHBhc3NlZCBmdW5jdGlvbiB0byB0aGUgcGFzc2VkIG1lc3NhZ2UuIEV2ZXJ5IHJldHVybmVkIHRva2VuIGlzIHVuaXF1ZSBhbmQgc2hvdWxkIGJlIHN0b3JlZCBpZiB5b3UgbmVlZCB0byB1bnN1YnNjcmliZVxuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBhbGlhcyBzdWJzY3JpYmVcbiAgICAgKiBAcGFyYW0geyBTdHJpbmcgfSBtZXNzYWdlIFRoZSBtZXNzYWdlIHRvIHN1YnNjcmliZSB0b1xuICAgICAqIEBwYXJhbSB7IEZ1bmN0aW9uIH0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gY2FsbCB3aGVuIGEgbmV3IG1lc3NhZ2UgaXMgcHVibGlzaGVkXG4gICAgICogQHJldHVybiB7IFN0cmluZyB9XG4gICAgICovXG4gICAgUHViU3ViLnN1YnNjcmliZSA9IGZ1bmN0aW9uKCBtZXNzYWdlLCBmdW5jICl7XG4gICAgICAgIGlmICggdHlwZW9mIGZ1bmMgIT09ICdmdW5jdGlvbicpe1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgbWVzc2FnZSA9ICh0eXBlb2YgbWVzc2FnZSA9PT0gJ3N5bWJvbCcpID8gbWVzc2FnZS50b1N0cmluZygpIDogbWVzc2FnZTtcblxuICAgICAgICAvLyBtZXNzYWdlIGlzIG5vdCByZWdpc3RlcmVkIHlldFxuICAgICAgICBpZiAoICFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoIG1lc3NhZ2VzLCBtZXNzYWdlICkgKXtcbiAgICAgICAgICAgIG1lc3NhZ2VzW21lc3NhZ2VdID0ge307XG4gICAgICAgIH1cblxuICAgICAgICAvLyBmb3JjaW5nIHRva2VuIGFzIFN0cmluZywgdG8gYWxsb3cgZm9yIGZ1dHVyZSBleHBhbnNpb25zIHdpdGhvdXQgYnJlYWtpbmcgdXNhZ2VcbiAgICAgICAgLy8gYW5kIGFsbG93IGZvciBlYXN5IHVzZSBhcyBrZXkgbmFtZXMgZm9yIHRoZSAnbWVzc2FnZXMnIG9iamVjdFxuICAgICAgICB2YXIgdG9rZW4gPSAndWlkXycgKyBTdHJpbmcoKytsYXN0VWlkKTtcbiAgICAgICAgbWVzc2FnZXNbbWVzc2FnZV1bdG9rZW5dID0gZnVuYztcblxuICAgICAgICAvLyByZXR1cm4gdG9rZW4gZm9yIHVuc3Vic2NyaWJpbmdcbiAgICAgICAgcmV0dXJuIHRva2VuO1xuICAgIH07XG5cbiAgICBQdWJTdWIuc3Vic2NyaWJlQWxsID0gZnVuY3Rpb24oIGZ1bmMgKXtcbiAgICAgICAgcmV0dXJuIFB1YlN1Yi5zdWJzY3JpYmUoQUxMX1NVQlNDUklCSU5HX01TRywgZnVuYyk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFN1YnNjcmliZXMgdGhlIHBhc3NlZCBmdW5jdGlvbiB0byB0aGUgcGFzc2VkIG1lc3NhZ2Ugb25jZVxuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBhbGlhcyBzdWJzY3JpYmVPbmNlXG4gICAgICogQHBhcmFtIHsgU3RyaW5nIH0gbWVzc2FnZSBUaGUgbWVzc2FnZSB0byBzdWJzY3JpYmUgdG9cbiAgICAgKiBAcGFyYW0geyBGdW5jdGlvbiB9IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGNhbGwgd2hlbiBhIG5ldyBtZXNzYWdlIGlzIHB1Ymxpc2hlZFxuICAgICAqIEByZXR1cm4geyBQdWJTdWIgfVxuICAgICAqL1xuICAgIFB1YlN1Yi5zdWJzY3JpYmVPbmNlID0gZnVuY3Rpb24oIG1lc3NhZ2UsIGZ1bmMgKXtcbiAgICAgICAgdmFyIHRva2VuID0gUHViU3ViLnN1YnNjcmliZSggbWVzc2FnZSwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIC8vIGJlZm9yZSBmdW5jIGFwcGx5LCB1bnN1YnNjcmliZSBtZXNzYWdlXG4gICAgICAgICAgICBQdWJTdWIudW5zdWJzY3JpYmUoIHRva2VuICk7XG4gICAgICAgICAgICBmdW5jLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBQdWJTdWI7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENsZWFycyBhbGwgc3Vic2NyaXB0aW9uc1xuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAYWxpYXMgY2xlYXJBbGxTdWJzY3JpcHRpb25zXG4gICAgICovXG4gICAgUHViU3ViLmNsZWFyQWxsU3Vic2NyaXB0aW9ucyA9IGZ1bmN0aW9uIGNsZWFyQWxsU3Vic2NyaXB0aW9ucygpe1xuICAgICAgICBtZXNzYWdlcyA9IHt9O1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDbGVhciBzdWJzY3JpcHRpb25zIGJ5IHRoZSB0b3BpY1xuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAYWxpYXMgY2xlYXJBbGxTdWJzY3JpcHRpb25zXG4gICAgICogQHJldHVybiB7IGludCB9XG4gICAgICovXG4gICAgUHViU3ViLmNsZWFyU3Vic2NyaXB0aW9ucyA9IGZ1bmN0aW9uIGNsZWFyU3Vic2NyaXB0aW9ucyh0b3BpYyl7XG4gICAgICAgIHZhciBtO1xuICAgICAgICBmb3IgKG0gaW4gbWVzc2FnZXMpe1xuICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtZXNzYWdlcywgbSkgJiYgbS5pbmRleE9mKHRvcGljKSA9PT0gMCl7XG4gICAgICAgICAgICAgICAgZGVsZXRlIG1lc3NhZ2VzW21dO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAgIENvdW50IHN1YnNjcmlwdGlvbnMgYnkgdGhlIHRvcGljXG4gICAgICogQGZ1bmN0aW9uXG4gICAgICogQHB1YmxpY1xuICAgICAqIEBhbGlhcyBjb3VudFN1YnNjcmlwdGlvbnNcbiAgICAgKiBAcmV0dXJuIHsgQXJyYXkgfVxuICAgICovXG4gICAgUHViU3ViLmNvdW50U3Vic2NyaXB0aW9ucyA9IGZ1bmN0aW9uIGNvdW50U3Vic2NyaXB0aW9ucyh0b3BpYyl7XG4gICAgICAgIHZhciBtO1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICAgICAgdmFyIHRva2VuO1xuICAgICAgICB2YXIgY291bnQgPSAwO1xuICAgICAgICBmb3IgKG0gaW4gbWVzc2FnZXMpIHtcbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobWVzc2FnZXMsIG0pICYmIG0uaW5kZXhPZih0b3BpYykgPT09IDApIHtcbiAgICAgICAgICAgICAgICBmb3IgKHRva2VuIGluIG1lc3NhZ2VzW21dKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvdW50Kys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb3VudDtcbiAgICB9O1xuXG5cbiAgICAvKipcbiAgICAgICBHZXRzIHN1YnNjcmlwdGlvbnMgYnkgdGhlIHRvcGljXG4gICAgICogQGZ1bmN0aW9uXG4gICAgICogQHB1YmxpY1xuICAgICAqIEBhbGlhcyBnZXRTdWJzY3JpcHRpb25zXG4gICAgKi9cbiAgICBQdWJTdWIuZ2V0U3Vic2NyaXB0aW9ucyA9IGZ1bmN0aW9uIGdldFN1YnNjcmlwdGlvbnModG9waWMpe1xuICAgICAgICB2YXIgbTtcbiAgICAgICAgdmFyIGxpc3QgPSBbXTtcbiAgICAgICAgZm9yIChtIGluIG1lc3NhZ2VzKXtcbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobWVzc2FnZXMsIG0pICYmIG0uaW5kZXhPZih0b3BpYykgPT09IDApe1xuICAgICAgICAgICAgICAgIGxpc3QucHVzaChtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbGlzdDtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBzdWJzY3JpcHRpb25zXG4gICAgICpcbiAgICAgKiAtIFdoZW4gcGFzc2VkIGEgdG9rZW4sIHJlbW92ZXMgYSBzcGVjaWZpYyBzdWJzY3JpcHRpb24uXG4gICAgICpcblx0ICogLSBXaGVuIHBhc3NlZCBhIGZ1bmN0aW9uLCByZW1vdmVzIGFsbCBzdWJzY3JpcHRpb25zIGZvciB0aGF0IGZ1bmN0aW9uXG4gICAgICpcblx0ICogLSBXaGVuIHBhc3NlZCBhIHRvcGljLCByZW1vdmVzIGFsbCBzdWJzY3JpcHRpb25zIGZvciB0aGF0IHRvcGljIChoaWVyYXJjaHkpXG4gICAgICogQGZ1bmN0aW9uXG4gICAgICogQHB1YmxpY1xuICAgICAqIEBhbGlhcyBzdWJzY3JpYmVPbmNlXG4gICAgICogQHBhcmFtIHsgU3RyaW5nIHwgRnVuY3Rpb24gfSB2YWx1ZSBBIHRva2VuLCBmdW5jdGlvbiBvciB0b3BpYyB0byB1bnN1YnNjcmliZSBmcm9tXG4gICAgICogQGV4YW1wbGUgLy8gVW5zdWJzY3JpYmluZyB3aXRoIGEgdG9rZW5cbiAgICAgKiB2YXIgdG9rZW4gPSBQdWJTdWIuc3Vic2NyaWJlKCdteXRvcGljJywgbXlGdW5jKTtcbiAgICAgKiBQdWJTdWIudW5zdWJzY3JpYmUodG9rZW4pO1xuICAgICAqIEBleGFtcGxlIC8vIFVuc3Vic2NyaWJpbmcgd2l0aCBhIGZ1bmN0aW9uXG4gICAgICogUHViU3ViLnVuc3Vic2NyaWJlKG15RnVuYyk7XG4gICAgICogQGV4YW1wbGUgLy8gVW5zdWJzY3JpYmluZyBmcm9tIGEgdG9waWNcbiAgICAgKiBQdWJTdWIudW5zdWJzY3JpYmUoJ215dG9waWMnKTtcbiAgICAgKi9cbiAgICBQdWJTdWIudW5zdWJzY3JpYmUgPSBmdW5jdGlvbih2YWx1ZSl7XG4gICAgICAgIHZhciBkZXNjZW5kYW50VG9waWNFeGlzdHMgPSBmdW5jdGlvbih0b3BpYykge1xuICAgICAgICAgICAgICAgIHZhciBtO1xuICAgICAgICAgICAgICAgIGZvciAoIG0gaW4gbWVzc2FnZXMgKXtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobWVzc2FnZXMsIG0pICYmIG0uaW5kZXhPZih0b3BpYykgPT09IDAgKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGEgZGVzY2VuZGFudCBvZiB0aGUgdG9waWMgZXhpc3RzOlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNUb3BpYyAgICA9IHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgJiYgKCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobWVzc2FnZXMsIHZhbHVlKSB8fCBkZXNjZW5kYW50VG9waWNFeGlzdHModmFsdWUpICksXG4gICAgICAgICAgICBpc1Rva2VuICAgID0gIWlzVG9waWMgJiYgdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyxcbiAgICAgICAgICAgIGlzRnVuY3Rpb24gPSB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicsXG4gICAgICAgICAgICByZXN1bHQgPSBmYWxzZSxcbiAgICAgICAgICAgIG0sIG1lc3NhZ2UsIHQ7XG5cbiAgICAgICAgaWYgKGlzVG9waWMpe1xuICAgICAgICAgICAgUHViU3ViLmNsZWFyU3Vic2NyaXB0aW9ucyh2YWx1ZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKCBtIGluIG1lc3NhZ2VzICl7XG4gICAgICAgICAgICBpZiAoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCggbWVzc2FnZXMsIG0gKSApe1xuICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlc1ttXTtcblxuICAgICAgICAgICAgICAgIGlmICggaXNUb2tlbiAmJiBtZXNzYWdlW3ZhbHVlXSApe1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgbWVzc2FnZVt2YWx1ZV07XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAvLyB0b2tlbnMgYXJlIHVuaXF1ZSwgc28gd2UgY2FuIGp1c3Qgc3RvcCBoZXJlXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoIHQgaW4gbWVzc2FnZSApe1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtZXNzYWdlLCB0KSAmJiBtZXNzYWdlW3RdID09PSB2YWx1ZSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG1lc3NhZ2VbdF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbn0pKTtcbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0aWQ6IG1vZHVsZUlkLFxuXHRcdGxvYWRlZDogZmFsc2UsXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuXHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSAobW9kdWxlKSA9PiB7XG5cdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuXHRcdCgpID0+IChtb2R1bGVbJ2RlZmF1bHQnXSkgOlxuXHRcdCgpID0+IChtb2R1bGUpO1xuXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCB7IGE6IGdldHRlciB9KTtcblx0cmV0dXJuIGdldHRlcjtcbn07IiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubm1kID0gKG1vZHVsZSkgPT4ge1xuXHRtb2R1bGUucGF0aHMgPSBbXTtcblx0aWYgKCFtb2R1bGUuY2hpbGRyZW4pIG1vZHVsZS5jaGlsZHJlbiA9IFtdO1xuXHRyZXR1cm4gbW9kdWxlO1xufTsiLCJcInVzZSBzdHJpY3RcIlxuaW1wb3J0IFB1YlN1YiBmcm9tICdwdWJzdWItanMnO1xuXG5jb25zdCBnYW1lQm9hcmQgPSAoXG4gICAgZnVuY3Rpb24gKCkge1xuICAgICAgICBsZXQgX2JvYXJkO1xuXG4gICAgICAgIGNvbnN0IF9jaGVja1dpbkhvcml6b250YWwgPSBmdW5jdGlvbiAobWFyaywgYm9hcmQgPSBfYm9hcmQpIHtcbiAgICAgICAgICAgIC8vY2hlY2sgaWYgYW55IGxpbmUgaGFzIHRocmVlIGNvbnNlY3V0aXZlIG1hcmtzIG9mIGFueSBraW5kXG4gICAgICAgICAgICBjb25zdCB3aW4gPSBib2FyZC5zbGljZSgwLCA3KS5zb21lKChjZWxsLCBpKSA9PiB7XG4gICAgICAgICAgICAgICAgLy9jaGVjayBvbmx5IGV2ZXJ5IHRocmVlIG1hcmtzIGlmIHRoZSBuZXh0IHR3byBhcmUgdGhlIHNhbWVcbiAgICAgICAgICAgICAgICByZXR1cm4gY2VsbCA9PT0gbWFyayAmJiBpICUgMyA9PT0gMCAmJiBjZWxsID09PSBib2FyZFtpICsgMV0gJiYgY2VsbCA9PT0gYm9hcmRbaSArIDJdXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgcmV0dXJuIHdpblxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgX2NoZWNrV2luVmVydGljYWwgPSBmdW5jdGlvbiAobWFyaywgYm9hcmQgPSBfYm9hcmQpIHtcbiAgICAgICAgICAgIC8vY2hlY2sgdmVydGljYWwgbGluZXNcbiAgICAgICAgICAgIGNvbnN0IHdpbiA9IGJvYXJkLnNsaWNlKDAsIDMpLnNvbWUoKGNlbGwsIGkpID0+IHtcbiAgICAgICAgICAgICAgICAvL2NoZWNrIGluIHRoZSBmaXJzdCByb3cgaWYgdGhlIHR3byBiZWxvdyBhcmUgdGhlIHNhbWVcbiAgICAgICAgICAgICAgICByZXR1cm4gY2VsbCA9PT0gbWFyayAmJiBjZWxsID09PSBib2FyZFtpICsgM10gJiYgY2VsbCA9PT0gYm9hcmRbaSArIDZdXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgcmV0dXJuIHdpblxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgX2NoZWNrV2luRGlhZ29uYWwgPSBmdW5jdGlvbiAobWFyaywgYm9hcmQgPSBfYm9hcmQpIHtcbiAgICAgICAgICAgIGNvbnN0IHdpbiA9IGJvYXJkLnNsaWNlKDAsIDMpLnNvbWUoKGNlbGwsIGkpID0+IHtcbiAgICAgICAgICAgICAgICAvL2NoZWNrIGV2ZXJ5IGluZGV4IDAgYW5kIDJcbiAgICAgICAgICAgICAgICBpZiAoaSA9PT0gMCAmJiBjZWxsID09PSBtYXJrICYmIGNlbGwgPT09IGJvYXJkWzRdKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjZWxsID09PSBib2FyZFs4XVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaSA9PSAyICYmIGNlbGwgPT09IG1hcmsgJiYgY2VsbCA9PT0gYm9hcmRbNF0pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNlbGwgPT09IGJvYXJkWzZdXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIHJldHVybiB3aW5cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNoZWNrVGllID0gZnVuY3Rpb24gKGJvYXJkID0gX2JvYXJkKSB7XG4gICAgICAgICAgICByZXR1cm4gYm9hcmQuZXZlcnkoKGNlbGwpID0+IGNlbGwgIT0gJycpXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjaGVja1dpbiA9IGZ1bmN0aW9uIChtYXJrLCBib2FyZCA9IF9ib2FyZCkge1xuICAgICAgICAgICAgcmV0dXJuIF9jaGVja1dpbkhvcml6b250YWwobWFyaywgYm9hcmQpIHx8IF9jaGVja1dpblZlcnRpY2FsKG1hcmssIGJvYXJkKSB8fCBfY2hlY2tXaW5EaWFnb25hbChtYXJrLCBib2FyZCk7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IF91cGRhdGUgPSBmdW5jdGlvbiAobXNnLCBkYXRhKSB7XG5cbiAgICAgICAgICAgIC8vZXh0cmFjdCBkYXRhIGZyb20gUHViU3ViXG4gICAgICAgICAgICBjb25zdCB7IGNlbGxOdW0sIG1hcmsgfSA9IGRhdGE7XG4gICAgICAgICAgICAvL2Rvbid0IHVwZGF0ZSBpZiBjZWxsIGhhcyBhbHJlYWR5IGJlZW4gcGxheWVkXG4gICAgICAgICAgICBpZiAoIWNoZWNrV2luKFwieFwiKSAmJiAhY2hlY2tXaW4oXCIwXCIpKSB7XG4gICAgICAgICAgICAgIGlmIChfYm9hcmRbY2VsbE51bV0gPT0gXCJcIikge1xuICAgICAgICAgICAgICAgIF9ib2FyZFtjZWxsTnVtXSA9IG1hcms7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IF9yZXN0YXJ0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgX2JvYXJkID0gbmV3IEFycmF5KDkpLmZpbGwoJycpO1xuICAgICAgICB9XG5cbiAgICAgICAgUHViU3ViLnN1YnNjcmliZSgnZ2FtZS1zdGFydCcsIF9yZXN0YXJ0KTtcbiAgICAgICAgLy9zdWJzY3JpYmUgdG8gZXZlbnQgdHJpZ2dlcmVkIHdoZW4gcGxheWVyIGFkZHMgYSBtYXJrXG4gICAgICAgIFB1YlN1Yi5zdWJzY3JpYmUoJ21hcmstYWRkZWQnLCBfdXBkYXRlKTtcblxuICAgICAgICBjb25zdCBnZXRCb2FyZCA9ICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBfYm9hcmRcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geyBjaGVja1RpZSwgY2hlY2tXaW4sIGdldEJvYXJkIH1cbiAgICB9XG4pKCk7XG5cbmNvbnN0IHBvcFVwID0gKFxuICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3QgX3BvcHVwID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3BvcC11cCcpO1xuICAgICAgICBjb25zdCBfcG9wdXBGb3JtID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2Zvcm0tcGxheWVyLW5hbWVzJyk7XG4gICAgICAgIGNvbnN0IF9wb3B1cEJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNwb3AtdXAtYnV0dG9uJyk7XG4gICAgICAgIGNvbnN0IF9jaG9vc2VQbGF5ZXJzQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2Nob29zZS1wbGF5ZXJzLWJ1dHRvbicpO1xuICAgICAgICBjb25zdCBfdmlzaWJsZUFyZWEgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjdmlzaWJsZS1hcmVhJyk7XG4gICAgICAgIGNvbnN0IF9zdGF0ZURpc3BsYXkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc3RhdGUtZGlzcGxheScpO1xuXG5cbiAgICAgICAgY29uc3QgX3RvZ2dsZVBvcHVwID0gKCkgPT4ge1xuICAgICAgICAgICAgX3N0YXRlRGlzcGxheS5zdHlsZS5jb2xvciA9ICcnO1xuICAgICAgICAgICAgX3BvcHVwLmNsYXNzTGlzdC50b2dnbGUoJ2ludmlzaWJsZScpO1xuICAgICAgICAgICAgX3Zpc2libGVBcmVhLmZvckVhY2goKGFyZWEpID0+IGFyZWEuY2xhc3NMaXN0LnRvZ2dsZSgnaW52aXNpYmxlJykpO1xuICAgICAgICB9XG5cbiAgICAgICAgX2Nob29zZVBsYXllcnNCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBfdG9nZ2xlUG9wdXApO1xuXG4gICAgICAgIC8vc2hvdyBnYW1lIGFmdGVyIHByZXNzaW5nIHN0YXJ0IGJ1dHRvbiBpbiBwb3AgdXBcbiAgICAgICAgX3BvcHVwQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcbiAgICAgICAgICAgIC8vdXNlZCB0byBkaXNwbGF5IGVycm9yIGlmIGJvdGggcGxheWVycyBhcmUgQUlzXG4gICAgICAgICAgICBjb25zdCBhbGVydEFyZWEgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjcG9wLXVwLWFsZXJ0JylcbiAgICAgICAgICAgIGlmIChfcG9wdXBGb3JtLmNoZWNrVmFsaWRpdHkoKSkge1xuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YShfcG9wdXBGb3JtKVxuICAgICAgICAgICAgICAgIGNvbnN0IG5ld1BsYXllckRhdGEgPSBPYmplY3QuZnJvbUVudHJpZXMoZm9ybURhdGEuZW50cmllcygpKVxuXG4gICAgICAgICAgICAgICAgY29uc3QgcGxheWVyMU5hbWUgPSBuZXdQbGF5ZXJEYXRhWydwbGF5ZXIxTmFtZSddO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBsYXllcjJOYW1lID0gbmV3UGxheWVyRGF0YVsncGxheWVyMk5hbWUnXTtcbiAgICAgICAgICAgICAgICBjb25zdCBwbGF5ZXIxVHlwZSA9IG5ld1BsYXllckRhdGFbJ3BsYXllcjFUeXBlJ107XG4gICAgICAgICAgICAgICAgY29uc3QgcGxheWVyMlR5cGUgPSBuZXdQbGF5ZXJEYXRhWydwbGF5ZXIyVHlwZSddO1xuXG4gICAgICAgICAgICAgICAgLy9zdG9wIGdhbWUgZnJvbSBzdGFydGluZyBpZiBib3RoIGFyZSBBSXNcbiAgICAgICAgICAgICAgICBpZiAocGxheWVyMVR5cGUgIT0gJ2h1bWFuJyAmJiBwbGF5ZXIyVHlwZSAhPSAnaHVtYW4nKSB7XG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0QXJlYS5pbm5lclRleHQgPSAnQXQgbGVhc3Qgb25lIGhhcyB0byBiZSBodW1hbiEnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIF90b2dnbGVQb3B1cCgpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBsYXllcjEgPSAocGxheWVyMVR5cGUgPT0gJ2h1bWFuJykgP1xuICAgICAgICAgICAgICAgICAgICAgICAgUGxheWVyKHBsYXllcjFOYW1lLCAnMCcpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgIEFJUGxheWVyKHBsYXllcjFOYW1lLCAnMCcsIHBsYXllcjFUeXBlKTsvL2FkZCBkaWZmaWN1bHR5XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGxheWVyMiA9IChwbGF5ZXIyVHlwZSA9PSAnaHVtYW4nKSA/XG4gICAgICAgICAgICAgICAgICAgICAgICBQbGF5ZXIocGxheWVyMk5hbWUsICd4JykgOlxuICAgICAgICAgICAgICAgICAgICAgICAgQUlQbGF5ZXIocGxheWVyMk5hbWUsICd4JywgcGxheWVyMlR5cGUpOy8vYWRkIGRpZmZpY3VsdHlcblxuICAgICAgICAgICAgICAgICAgICBQdWJTdWIucHVibGlzaCgnZ2FtZS1zdGFydCcsIHsgcGxheWVyMSwgcGxheWVyMiB9KTtcbiAgICAgICAgICAgICAgICAgICAgX3BvcHVwRm9ybS5yZXNldCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuKSgpXG5cbi8vbWFuYWdlcyBhbGwgZ2FtZSB1cGRhdGVzXG5jb25zdCBkaXNwbGF5Q29udHJvbGxlciA9IChcbiAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnN0IF9nYW1lQXJlYSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNnYW1lLWFyZWEnKTtcbiAgICAgICAgY29uc3QgX2dhbWVDZWxscyA9IEFycmF5LmZyb20oX2dhbWVBcmVhLmNoaWxkcmVuKTtcbiAgICAgICAgY29uc3QgX3N0YXRlRGlzcGxheSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzdGF0ZS1kaXNwbGF5Jyk7XG4gICAgICAgIGNvbnN0IF9yZXN0YXJ0QnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Jlc3RhcnQtYnV0dG9uJyk7XG5cbiAgICAgICAgY29uc3QgX2NlbGxMaXN0ZW5lckZ1bmMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvL3NlbmQgdGhlIGNlbGwgYXMgYSBudW1iZXJcbiAgICAgICAgICAgIFB1YlN1Yi5wdWJsaXNoKCdjZWxsLXByZXNzZWQnLCB0aGlzLmdldEF0dHJpYnV0ZSgnZGF0YScpKTtcbiAgICAgICAgfTtcblxuXG4gICAgICAgIC8vcmVzdGFydCB3aXRoIGJ1dHRvblxuICAgICAgICBfcmVzdGFydEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICAgIF9zdGF0ZURpc3BsYXkuc3R5bGUuY29sb3IgPSAnJztcbiAgICAgICAgICAgIFB1YlN1Yi5wdWJsaXNoKCdnYW1lLXN0YXJ0JywgeyAncGxheWVyMSc6IGdhbWUuZ2V0UGxheWVyMSgpLCAnY2VsbE51bSc6IDkgfSlcbiAgICAgICAgfSk7XG5cblxuICAgICAgICBjb25zdCBfcmVzdGFydENlbGxzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgX2dhbWVDZWxscy5mb3JFYWNoKChjZWxsKSA9PiB7XG4gICAgICAgICAgICAgICAgY2VsbC5jaGlsZHJlblswXS5jbGFzc0xpc3QucmVtb3ZlKCdjaG9zZW4nKTtcbiAgICAgICAgICAgICAgICBjZWxsLmNsYXNzTGlzdC5yZW1vdmUoJ2Nob3NlbicpO1xuICAgICAgICAgICAgICAgIGNlbGwuY2xhc3NMaXN0LmFkZCgnY2lyY2xlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICApXG4gICAgICAgIH07XG5cbiAgICAgICAgLy91cGRhdGVzIERPTVxuICAgICAgICBjb25zdCBfcmVuZGVyID0gZnVuY3Rpb24gKG1zZywgZGF0YSkge1xuICAgICAgICAgICAgLy9fcmVuZGVyIGlmIGZpcnN0IHBsYXllciBpc24ndCBBSS5cbiAgICAgICAgICAgIGNvbnN0IGJvYXJkID0gZ2FtZUJvYXJkLmdldEJvYXJkKCk7XG4gICAgICAgICAgICBjb25zdCB7IGNlbGxOdW0gfSA9IGRhdGE7XG4gICAgICAgICAgICBfZ2FtZUNlbGxzLmZvckVhY2goKGNlbGwsIGkpID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgaW1hZ2VQYXRoXG4gICAgICAgICAgICAgICAgLy9fcmVuZGVyIGltYWdlc1xuICAgICAgICAgICAgICAgIGlmIChib2FyZFtpXSA9PSAnJykge1xuICAgICAgICAgICAgICAgICAgICBpbWFnZVBhdGggPSAnJ1xuICAgICAgICAgICAgICAgICAgICBjZWxsLmNsYXNzTGlzdC5yZW1vdmUoJ2Nob3NlbicpXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy9kZWFjdGl2YXRlIGNlbGwgICAgXG4gICAgICAgICAgICAgICAgICAgIGNlbGwucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBfY2VsbExpc3RlbmVyRnVuYylcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2VQYXRoID0gYm9hcmRbaV0gPT0gJ3gnID9cbiAgICAgICAgICAgICAgICAgICAgICAgICcuL2ltYWdlcy9jcm9zcy5wbmcnIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICcuL2ltYWdlcy9jaXJjbGUucG5nJztcblxuICAgICAgICAgICAgICAgICAgICBpZiAoY2VsbE51bSA9PSBpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjZWxsLmNoaWxkcmVuWzBdLmNsYXNzTGlzdC5hZGQoJ2Nob3NlbicpXG4gICAgICAgICAgICAgICAgICAgICAgICBjZWxsLmNsYXNzTGlzdC5hZGQoJ2Nob3NlbicpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIC8vY2hhbmdlIGltZyBzb3VyY2VcbiAgICAgICAgICAgICAgICBjZWxsLmNoaWxkcmVuWzBdLnNldEF0dHJpYnV0ZSgnc3JjJywgaW1hZ2VQYXRoKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH07XG5cblxuICAgICAgICBjb25zdCBfY2hhbmdlU3RhdGVEaXNwbGF5ID0gZnVuY3Rpb24gKG1zZywgZGF0YSkge1xuICAgICAgICAgICAgbGV0IHRleHRcbiAgICAgICAgICAgIGlmIChtc2cgPT0gJ3R1cm4tcGFzc2VkJykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgbmFtZSwgbWFyaywgbmV4dFBsYXllciB9ID0gZGF0YTtcbiAgICAgICAgICAgICAgICBjb25zdCB3aW4gPSBnYW1lQm9hcmQuY2hlY2tXaW4obWFyayk7XG4gICAgICAgICAgICAgICAgY29uc3QgdGllID0gZ2FtZUJvYXJkLmNoZWNrVGllKCk7XG5cbiAgICAgICAgICAgICAgICAvL2NoYW5nZSBjbGFzcyBmb3IgZGl2OmhvdmVyXG4gICAgICAgICAgICAgICAgX2dhbWVDZWxscy5mb3JFYWNoKChjZWxsKSA9PiBjZWxsLmNsYXNzTGlzdC50b2dnbGUoJ2NpcmNsZScpKTtcblxuICAgICAgICAgICAgICAgIC8vaWYgdGhlIG5leHQgcGxheWVyIGlzIEFJXG4gICAgICAgICAgICAgICAgaWYgKG5leHRQbGF5ZXIuaGFzT3duUHJvcGVydHkoJ2FkZFJhbmRvbScpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vc3RvcCBwbGF5ZXIgZnJvbSBjaG9vc2luZyBmb3IgdGhlbVxuICAgICAgICAgICAgICAgICAgICBfZ2FtZUNlbGxzLmZvckVhY2goKGNlbGwpID0+IGNlbGwuY2xhc3NMaXN0LmFkZCgnY2hvc2VuJykpXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHdpbikge1xuICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gYCR7bmFtZX0gd29uIWBcbiAgICAgICAgICAgICAgICAgICAgX3N0YXRlRGlzcGxheS5zdHlsZS5jb2xvciA9ICd2YXIoLS1jb2xvci1jb21wbGVtZW50YXJ5Mi1kYXJrJztcbiAgICAgICAgICAgICAgICAgICAgX2RlYWN0aXZhdGVDZWxscygpO1xuICAgICAgICAgICAgICAgICAgICBfZGVhY3RpdmF0ZUhvdmVyKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aWUpIHtcbiAgICAgICAgICAgICAgICAgICAgX3N0YXRlRGlzcGxheS5zdHlsZS5jb2xvciA9ICd2YXIoLS1jb2xvci1jb21wbGVtZW50YXJ5MS1kYXJrKSc7XG4gICAgICAgICAgICAgICAgICAgIHRleHQgPSBgSXQncyBhIHRpZSFgXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dCA9IGAke25leHRQbGF5ZXIuZ2V0TmFtZSgpfSdzIHR1cm5gXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwbGF5ZXIxID0gZGF0YVsncGxheWVyMSddO1xuICAgICAgICAgICAgICAgIHRleHQgPSBgJHtwbGF5ZXIxLmdldE5hbWUoKX0ncyB0dXJuYFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX3N0YXRlRGlzcGxheS5pbm5lclRleHQgPSB0ZXh0O1xuICAgICAgICB9O1xuXG5cbiAgICAgICAgLy9hZGQgZXZlbnQgbGlzdGVuZXJzIHRvIGNlbGxzIHRvIHVwZGF0ZSB3aGVuIHByZXNzZWQgYnkgcGxheWVyXG4gICAgICAgIGNvbnN0IF9hY3RpdmF0ZUNlbGxzID0gKCkgPT4ge1xuICAgICAgICAgICAgX2dhbWVDZWxscy5mb3JFYWNoKFxuICAgICAgICAgICAgICAgIChjZWxsKSA9PiBjZWxsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgX2NlbGxMaXN0ZW5lckZ1bmMpKVxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IF9kZWFjdGl2YXRlQ2VsbHMgPSAoKSA9PiB7XG4gICAgICAgICAgICBfZ2FtZUNlbGxzLmZvckVhY2goXG4gICAgICAgICAgICAgICAgKGNlbGwpID0+IGNlbGwucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBfY2VsbExpc3RlbmVyRnVuYykpXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBfZGVhY3RpdmF0ZUhvdmVyID0gKCkgPT4ge1xuICAgICAgICAgICAgX2dhbWVDZWxscy5mb3JFYWNoKChjZWxsKSA9PiBjZWxsLmNsYXNzTGlzdC5hZGQoJ2Nob3NlbicpKVxuICAgICAgICB9XG5cbiAgICAgICAgUHViU3ViLnN1YnNjcmliZSgnbWFyay1hZGRlZCcsIF9yZW5kZXIpO1xuICAgICAgICBQdWJTdWIuc3Vic2NyaWJlKCdnYW1lLXN0YXJ0JywgX3Jlc3RhcnRDZWxscyk7XG4gICAgICAgIFB1YlN1Yi5zdWJzY3JpYmUoJ2dhbWUtc3RhcnQnLCBfYWN0aXZhdGVDZWxscyk7XG4gICAgICAgIFB1YlN1Yi5zdWJzY3JpYmUoJ2dhbWUtc3RhcnQnLCBfY2hhbmdlU3RhdGVEaXNwbGF5KTtcbiAgICAgICAgUHViU3ViLnN1YnNjcmliZSgnZ2FtZS1zdGFydCcsIF9yZW5kZXIpO1xuICAgICAgICBQdWJTdWIuc3Vic2NyaWJlKCdhaS10dXJuLXN0YXJ0JywgX2RlYWN0aXZhdGVIb3Zlcik7XG4gICAgICAgIFB1YlN1Yi5zdWJzY3JpYmUoJ2FpLXR1cm4tc3RhcnQnLCBfZGVhY3RpdmF0ZUNlbGxzKVxuICAgICAgICBQdWJTdWIuc3Vic2NyaWJlKCdhaS10dXJuLWVuZCcsIF9hY3RpdmF0ZUNlbGxzKTtcblxuICAgICAgICBQdWJTdWIuc3Vic2NyaWJlKCd0dXJuLXBhc3NlZCcsIF9jaGFuZ2VTdGF0ZURpc3BsYXkpO1xuXG4gICAgfSkoKTtcblxuLy9mYWN0b3J5IGZ1bmN0aW9uIHRvIGNyZWF0ZSBhIHBsYXllclxuY29uc3QgUGxheWVyID0gZnVuY3Rpb24gKG5hbWUsIG1hcmspIHtcbiAgICBjb25zdCBfbWFyayA9IG1hcms7XG5cbiAgICBjb25zdCBhZGRNYXJrID0gZnVuY3Rpb24gKGNlbGxOdW0pIHsvL2FkZHMgYSBtYXJrIG9uIGdhbWVCb2FyZFxuICAgICAgICBQdWJTdWIucHVibGlzaCgnbWFyay1hZGRlZCcsIHsgY2VsbE51bSwgbWFyazogX21hcmssIG5hbWUgfSlcbiAgICB9XG5cbiAgICBjb25zdCBnZXROYW1lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmFtZVxuICAgIH1cblxuICAgIGNvbnN0IGdldE1hcmsgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBfbWFya1xuICAgIH1cblxuICAgIHJldHVybiB7IGFkZE1hcmssIGdldE5hbWUsIGdldE1hcmsgfVxufVxuXG5jb25zdCBBSVBsYXllciA9IGZ1bmN0aW9uIChuYW1lLCBtYXJrLCBkaWZmaWN1bHR5KSB7XG4gICAgLy9pbmhlcml0IGZyb20gUGxheWVyXG4gICAgY29uc3QgcHJvdG90eXBlID0gUGxheWVyKG5hbWUsIG1hcmspO1xuICAgIGNvbnN0IF9BSU1hcmsgPSBtYXJrO1xuXG4gICAgY29uc3QgX2V4dHJhY3RFbXB0eUluZGV4ZXMgPSAoYm9hcmQpID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYm9hcmQucmVkdWNlKChhY2MsIGNlbGwsIGkpID0+IHtcbiAgICAgICAgICAgIGlmIChjZWxsID09PSAnJyB8fCB0eXBlb2YgKGNlbGwpID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgICAgIGFjYy5wdXNoKGkpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYWNjXG4gICAgICAgIH0sIFtdKVxuICAgICAgICByZXR1cm4gcmVzdWx0XG4gICAgfVxuXG4gICAgLy9uZXcgbWV0aG9kc1xuICAgIGNvbnN0IGFkZFJhbmRvbSA9ICgpID0+IHtcbiAgICAgICAgLy9jaGVjayB3aGljaCBjZWxscyBhcmUgZW1wdHkgYW5kIGV4dHJhY3QgdGhlaXIgaW5kZXhlc1xuICAgICAgICBjb25zdCBlbXB0eUNlbGxzSW5kZXhlcyA9IF9leHRyYWN0RW1wdHlJbmRleGVzKGdhbWVCb2FyZC5nZXRCb2FyZCgpKVxuICAgICAgICAvL2Nob29zZSBhdCByYW5kb20gZnJvbSB0aG9zZSBpbmRleGVzXG4gICAgICAgIGNvbnN0IHJhbmRvbUVtcHR5SW5kZXggPSBlbXB0eUNlbGxzSW5kZXhlc1tcbiAgICAgICAgICAgIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGVtcHR5Q2VsbHNJbmRleGVzLmxlbmd0aClcbiAgICAgICAgXVxuICAgICAgICAvL2FkZCBtYXJrIHRoZXJlIGFmdGVyIHJhbmRvbSBkZWxheVxuICAgICAgICBQdWJTdWIucHVibGlzaCgnYWktdHVybi1lbmQnKTtcbiAgICAgICAgLy95YSBkaXNwbGF5Q29udHJvbGxlci5hY3RpdmF0ZUNlbGxzKCk7XG4gICAgICAgIHByb3RvdHlwZS5hZGRNYXJrKHJhbmRvbUVtcHR5SW5kZXgpXG5cbiAgICB9O1xuXG4gICAgY29uc3QgYWRkTWluaU1heCA9ICgpID0+IHtcbiAgICAgICAgLy9PcmlnaW5hbCBhbGdvcml0aG0gaW1wbGVtZW50YXRpb24gYnkgQWhtYW5kIEFCZG9sc2FoZWJcbiAgICAgICAgLy9odHRwczovL3d3dy5mcmVlY29kZWNhbXAub3JnL25ld3MvaG93LXRvLW1ha2UteW91ci10aWMtdGFjLXRvZS1nYW1lLXVuYmVhdGFibGUtYnktdXNpbmctdGhlLW1pbmltYXgtYWxnb3JpdGhtLTlkNjkwYmFkNGIzNy9cbiAgICAgICAgY29uc3QgX2h1bWFuTWFyayA9IG1hcmsgPT09ICd4JyA/ICcwJyA6ICd4JztcblxuICAgICAgICBjb25zdCBfaW5pdGlhbEJvYXJkID0gZ2FtZUJvYXJkLmdldEJvYXJkKCkubWFwKCh4LCBpKSA9PiB7XG4gICAgICAgICAgICBpZiAoeCA9PSAnJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB4XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLy9jb3B5IGFycmF5XG5cbiAgICAgICAgY29uc3QgbWluaU1heCA9IGZ1bmN0aW9uIChuZXdNYXJrID0gX0FJTWFyaywgbmV3Qm9hcmQgPSBfaW5pdGlhbEJvYXJkKSB7XG4gICAgICAgICAgICBjb25zdCBlbXB0eUNlbGxzSW5kZXhlcyA9IF9leHRyYWN0RW1wdHlJbmRleGVzKG5ld0JvYXJkKTtcbiAgICAgICAgICAgIGNvbnN0IF9vcHBvbmVudE1hcmsgPSBuZXdNYXJrID09ICd4JyA/ICcwJyA6ICd4JztcblxuICAgICAgICAgICAgaWYgKGdhbWVCb2FyZC5jaGVja1dpbihfaHVtYW5NYXJrLCBuZXdCb2FyZCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzY29yZTogLTEwIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZ2FtZUJvYXJkLmNoZWNrV2luKF9BSU1hcmssIG5ld0JvYXJkKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHNjb3JlOiAxMCB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGVtcHR5Q2VsbHNJbmRleGVzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc2NvcmU6IDAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gYW4gYXJyYXkgdG8gY29sbGVjdCBhbGwgdGhlIG9iamVjdHNcbiAgICAgICAgICAgIGxldCBtb3ZlcyA9IFtdO1xuXG4gICAgICAgICAgICAvLyBsb29wIHRocm91Z2ggYXZhaWxhYmxlIHNwb3RzXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVtcHR5Q2VsbHNJbmRleGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgLy9jcmVhdGUgYW4gb2JqZWN0IGZvciBlYWNoIGFuZCBzdG9yZSB0aGUgaW5kZXggb2YgdGhhdCBzcG90IFxuICAgICAgICAgICAgICAgIGxldCBtb3ZlID0ge307XG4gICAgICAgICAgICAgICAgbW92ZS5pbmRleCA9IG5ld0JvYXJkW2VtcHR5Q2VsbHNJbmRleGVzW2ldXTtcblxuICAgICAgICAgICAgICAgIC8vIHNldCB0aGUgZW1wdHkgc3BvdCB0byB0aGUgY3VycmVudCBwbGF5ZXJcbiAgICAgICAgICAgICAgICBuZXdCb2FyZFtlbXB0eUNlbGxzSW5kZXhlc1tpXV0gPSBuZXdNYXJrO1xuXG4gICAgICAgICAgICAgICAgLypjb2xsZWN0IHRoZSBzY29yZSByZXN1bHRlZCBmcm9tIGNhbGxpbmcgbWluaW1heCBcbiAgICAgICAgICAgICAgICAgIG9uIHRoZSBvcHBvbmVudCBvZiB0aGUgY3VycmVudCBwbGF5ZXIqL1xuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBtaW5pTWF4KF9vcHBvbmVudE1hcmssIG5ld0JvYXJkLm1hcCh4ID0+IHgpKTtcbiAgICAgICAgICAgICAgICBtb3ZlLnNjb3JlID0gcmVzdWx0LnNjb3JlO1xuXG4gICAgICAgICAgICAgICAgLy8gcmVzZXQgdGhlIHNwb3QgdG8gZW1wdHlcbiAgICAgICAgICAgICAgICBuZXdCb2FyZFtlbXB0eUNlbGxzSW5kZXhlc1tpXV0gPSBtb3ZlLmluZGV4O1xuXG4gICAgICAgICAgICAgICAgLy8gcHVzaCB0aGUgb2JqZWN0IHRvIHRoZSBhcnJheVxuICAgICAgICAgICAgICAgIG1vdmVzLnB1c2gobW92ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGlmIGl0IGlzIHRoZSBjb21wdXRlcidzIHR1cm4gbG9vcCBvdmVyIHRoZSBtb3ZlcyBhbmQgY2hvb3NlIHRoZSBtb3ZlIHdpdGggdGhlIGhpZ2hlc3Qgc2NvcmVcbiAgICAgICAgICAgIGxldCBiZXN0TW92ZTtcblxuICAgICAgICAgICAgaWYgKG5ld01hcmsgPT09IF9BSU1hcmspIHtcbiAgICAgICAgICAgICAgICBsZXQgYmVzdFNjb3JlID0gLTEwMDAwO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgW2ksIG1vdmVdIG9mIG1vdmVzLmVudHJpZXMoKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobW92ZS5zY29yZSA+IGJlc3RTY29yZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmVzdFNjb3JlID0gbW92ZS5zY29yZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJlc3RNb3ZlID0gaTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtb3ZlLnNjb3JlID09PSBiZXN0U2NvcmUpIHsvL2Nob29zZSBhdCByYW5kb20gaWYgaXRzIHRoZSBzYW1lIHNjb3JlXG4gICAgICAgICAgICAgICAgICAgICAgICBiZXN0U2NvcmUgPSBtb3ZlLnNjb3JlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYmVzdE1vdmUgPSBbYmVzdE1vdmUsIGldW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIpXVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgIC8vIGVsc2UgbG9vcCBvdmVyIHRoZSBtb3ZlcyBhbmQgY2hvb3NlIHRoZSBtb3ZlIHdpdGggdGhlIGxvd2VzdCBzY29yZVxuICAgICAgICAgICAgICAgIGxldCBiZXN0U2NvcmUgPSAxMDAwMDtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IFtpLCBtb3ZlXSBvZiBtb3Zlcy5lbnRyaWVzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1vdmUuc2NvcmUgPCBiZXN0U2NvcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJlc3RTY29yZSA9IG1vdmUuc2NvcmU7XG4gICAgICAgICAgICAgICAgICAgICAgICBiZXN0TW92ZSA9IGk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobW92ZS5zY29yZSA9PT0gYmVzdFNjb3JlKSB7Ly9jaG9vc2UgYXQgcmFuZG9tIGlmIGl0cyB0aGUgc2FtZSBzY29yZVxuICAgICAgICAgICAgICAgICAgICAgICAgYmVzdFNjb3JlID0gbW92ZS5zY29yZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJlc3RNb3ZlID0gW2Jlc3RNb3ZlLCBpXVtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyKV1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBtb3Zlc1tiZXN0TW92ZV1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGJlc3RNb3ZlID0gbWluaU1heChtYXJrLCBfaW5pdGlhbEJvYXJkKTtcblxuICAgICAgICBQdWJTdWIucHVibGlzaCgnYWktdHVybi1lbmQnKTtcbiAgICAgICAgcHJvdG90eXBlLmFkZE1hcmsoYmVzdE1vdmUuaW5kZXgpO1xuICAgIH07XG5cbiAgICBjb25zdCBnZXREaWZmaWN1bHR5ID0gKCkgPT4ge1xuICAgICAgICByZXR1cm4gZGlmZmljdWx0eTtcbiAgICB9XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHByb3RvdHlwZSwgeyBhZGRSYW5kb20sIGFkZE1pbmlNYXgsIGdldERpZmZpY3VsdHkgfSlcbn1cblxuLy9tYW5hZ2VzIHRoZSBmbG93IG9mIHRoZSBnYW1lLlxuY29uc3QgZ2FtZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgbGV0IGNvdW50ZXIgPSAwO1xuICAgIGxldCBfcGxheWVyMTtcbiAgICBsZXQgX3BsYXllcjI7XG5cbiAgICBjb25zdCBnZXRQbGF5ZXIxID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gX3BsYXllcjFcbiAgICB9XG5cbiAgICBjb25zdCBnZXRQbGF5ZXIyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gX3BsYXllcjJcbiAgICB9XG5cbiAgICBjb25zdCBfc3RhcnQgPSBmdW5jdGlvbiAobXNnLCBkYXRhKSB7XG4gICAgICAgIGNvdW50ZXIgPSAwO1xuICAgICAgICAvL3doZW4gcmVzdGFydGluZywgbGVhdmUgc2FtZSBwbGF5ZXJzXG4gICAgICAgIF9wbGF5ZXIxID0gZGF0YVsncGxheWVyMSddID8gZGF0YVsncGxheWVyMSddIDogX3BsYXllcjE7XG4gICAgICAgIF9wbGF5ZXIyID0gZGF0YVsncGxheWVyMiddID8gZGF0YVsncGxheWVyMiddIDogX3BsYXllcjI7XG4gICAgICAgIC8vaWYgdGhlIGZpcnN0IHBsYXllciBpcyBBSSBtYWtlIGl0IHBsYXlcbiAgICAgICAgX3BsYXlBSShfcGxheWVyMSwgX3BsYXllcjIpO1xuICAgIH07XG5cbiAgICBjb25zdCBfcHVibGlzaFR1cm5QYXNzZWQgPSBmdW5jdGlvbiAobmFtZSwgbWFyaywgbmV4dFBsYXllcikge1xuICAgICAgICBQdWJTdWIucHVibGlzaCgndHVybi1wYXNzZWQnLCB7IG5hbWUsIG1hcmssIG5leHRQbGF5ZXIgfSlcbiAgICB9XG5cbiAgICAvL3BsYXlzIGEgdHVyblxuICAgIGNvbnN0IF90dXJuID0gZnVuY3Rpb24gKG1zZywgZGF0YSkge1xuICAgICAgICBjb25zdCBjZWxsTnVtID0gZGF0YVxuICAgICAgICAvL2FsdGVybmF0ZSB0dXJucyBiZXR3ZWVuIHBsYXllcnNcbiAgICAgICAgaWYgKGNvdW50ZXIgJSAyID09IDApIHtcbiAgICAgICAgICAgIF9wbGF5ZXIxLmFkZE1hcmsoY2VsbE51bSk7XG4gICAgICAgICAgICBfcHVibGlzaFR1cm5QYXNzZWQoX3BsYXllcjEuZ2V0TmFtZSgpLCBfcGxheWVyMS5nZXRNYXJrKCksIF9wbGF5ZXIyKTtcbiAgICAgICAgICAgIGNvdW50ZXIrK1xuICAgICAgICAgICAgLy9jaGVjayBpZiBwbGF5ZXIyIGlzIEFJXG4gICAgICAgICAgICBfcGxheUFJKF9wbGF5ZXIyLCBfcGxheWVyMSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIF9wbGF5ZXIyLmFkZE1hcmsoY2VsbE51bSk7XG4gICAgICAgICAgICBfcHVibGlzaFR1cm5QYXNzZWQoX3BsYXllcjIuZ2V0TmFtZSgpLCBfcGxheWVyMi5nZXRNYXJrKCksIF9wbGF5ZXIxKTtcbiAgICAgICAgICAgIGNvdW50ZXIrK1xuICAgICAgICAgICAgLy9jaGVjayBpZiBwbGF5ZXIxIGlzIEFJXG4gICAgICAgICAgICBfcGxheUFJKF9wbGF5ZXIxLCBfcGxheWVyMilcblxuICAgICAgICB9O1xuICAgIH1cblxuXG5cbiAgICBjb25zdCBfcGxheUFJID0gZnVuY3Rpb24gKHBsYXllciwgbmV4dFBsYXllcikge1xuICAgICAgICAvL2RlbGF5IGFsbG93cyBmb3IgYm9hcmQgdG8gdXBkYXRlLCBcbiAgICAgICAgY29uc3QgcmFuZG9tRGVsYXkgPSAoTWF0aC5yYW5kb20oKSAqIDEwMDApICsgMTAwMDtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBpZiAocGxheWVyLmhhc093blByb3BlcnR5KCdhZGRSYW5kb20nKSAmJiAhZ2FtZUJvYXJkLmNoZWNrV2luKCd4JykgJiYgIWdhbWVCb2FyZC5jaGVja1dpbignMCcpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZ2FtZUJvYXJkLmdldEJvYXJkKCkpXG4gICAgXG4gICAgICAgICAgICAgICAgUHViU3ViLnB1Ymxpc2goJ2FpLXR1cm4tc3RhcnQnLCAnJyk7XG4gICAgXG4gICAgICAgICAgICAgICAgLy9uZWVkZWQgZm9yIGxvb2t1cCBpbiBhZGRNaW5pTWF4IGFuZCBmb3IgY2hlY2tXaW5zXG4gICAgICAgICAgICAgICAgICAgIC8vY2hlY2sgaWYgcGxheWVyIGlzIEFJXG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIChwbGF5ZXIuZ2V0RGlmZmljdWx0eSgpID09ICdoYXJkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGxheWVyLmFkZE1pbmlNYXgoKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHsgLy9pZiBpdCdzIGVhc3kgZGlmZmljdWx0eVxuICAgICAgICAgICAgICAgICAgICAgICAgcGxheWVyLmFkZFJhbmRvbSgpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgX3B1Ymxpc2hUdXJuUGFzc2VkKHBsYXllci5nZXROYW1lKCksIHBsYXllci5nZXRNYXJrKCksIG5leHRQbGF5ZXIpO1xuICAgICAgICAgICAgICAgICAgICBjb3VudGVyKytcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH0sIHJhbmRvbURlbGF5KVxuXG4gICAgfVxuXG4gICAgUHViU3ViLnN1YnNjcmliZSgnZ2FtZS1zdGFydCcsIF9zdGFydCk7XG4gICAgUHViU3ViLnN1YnNjcmliZSgnY2VsbC1wcmVzc2VkJywgX3R1cm4pO1xuXG4gICAgcmV0dXJuIHsgZ2V0UGxheWVyMSwgZ2V0UGxheWVyMiB9XG59XG4pKCkiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=