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

            if (_board[cellNum] == '') {//don't update if cell has already been played
                _board[cellNum] = mark;
            };
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


        const _togglePopup = () => {
            _popup.classList.toggle('invisible')
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


                    pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publish('game-start', { player1, player2 })
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
            pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publish('cell-pressed', this.getAttribute('data'))
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
        const randomDelay = (Math.random() * 1000) + 500;
        pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publish('ai-turn-start', '');
        //delay allows for board to update, 
        //needed for lookup in addMiniMax and for checkWins
        setTimeout( () => {
        //check if player is AI
        if (player.hasOwnProperty('addRandom') && !gameBoard.checkWin('x') && !gameBoard.checkWin('0')) {
            if (player.getDifficulty() == 'hard') {
                    player.addMiniMax();
            } else { //if it's easy difficulty
                    player.addRandom()
            }
            _publishTurnPassed(player.getName(), player.getMark(), nextPlayer)
            counter++
        }
    })
    }

    pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('game-start', _start);
    pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('cell-pressed', _turn);

    return { getPlayer1, getPlayer2 }
}
)()
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUNBO0FBQ0EsMkJBQTJCLGVBQWUsc0NBQXNDO0FBQ2hGOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsUUFBUSx3REFBYyxrQkFBa0Isd0JBQXdCO0FBQ2hFOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7OztBQUlBO0FBQ0E7QUFDQSxRQUFRLHdEQUFjO0FBQ3RCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYyxPQUFPO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7O0FBRUEsSUFBSSwwREFBZ0I7QUFDcEIsSUFBSSwwREFBZ0I7O0FBRXBCLGFBQWE7QUFDYjtBQUNBLEciLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly90aWMtdGFjLXRvZS8uL25vZGVfbW9kdWxlcy9wdWJzdWItanMvc3JjL3B1YnN1Yi5qcyIsIndlYnBhY2s6Ly90aWMtdGFjLXRvZS93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly90aWMtdGFjLXRvZS93ZWJwYWNrL3J1bnRpbWUvY29tcGF0IGdldCBkZWZhdWx0IGV4cG9ydCIsIndlYnBhY2s6Ly90aWMtdGFjLXRvZS93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vdGljLXRhYy10b2Uvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly90aWMtdGFjLXRvZS93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL3RpYy10YWMtdG9lL3dlYnBhY2svcnVudGltZS9ub2RlIG1vZHVsZSBkZWNvcmF0b3IiLCJ3ZWJwYWNrOi8vdGljLXRhYy10b2UvLi9zY3JpcHQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTAsMjAxMSwyMDEyLDIwMTMsMjAxNCBNb3JnYW4gUm9kZXJpY2sgaHR0cDovL3JvZGVyaWNrLmRrXG4gKiBMaWNlbnNlOiBNSVQgLSBodHRwOi8vbXJnbnJkcmNrLm1pdC1saWNlbnNlLm9yZ1xuICpcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9tcm9kZXJpY2svUHViU3ViSlNcbiAqL1xuXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3Rvcnkpe1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBQdWJTdWIgPSB7fTtcblxuICAgIGlmIChyb290LlB1YlN1Yikge1xuICAgICAgICBQdWJTdWIgPSByb290LlB1YlN1YjtcbiAgICAgICAgY29uc29sZS53YXJuKFwiUHViU3ViIGFscmVhZHkgbG9hZGVkLCB1c2luZyBleGlzdGluZyB2ZXJzaW9uXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJvb3QuUHViU3ViID0gUHViU3ViO1xuICAgICAgICBmYWN0b3J5KFB1YlN1Yik7XG4gICAgfVxuICAgIC8vIENvbW1vbkpTIGFuZCBOb2RlLmpzIG1vZHVsZSBzdXBwb3J0XG4gICAgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jyl7XG4gICAgICAgIGlmIChtb2R1bGUgIT09IHVuZGVmaW5lZCAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgICAgICAgZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gUHViU3ViOyAvLyBOb2RlLmpzIHNwZWNpZmljIGBtb2R1bGUuZXhwb3J0c2BcbiAgICAgICAgfVxuICAgICAgICBleHBvcnRzLlB1YlN1YiA9IFB1YlN1YjsgLy8gQ29tbW9uSlMgbW9kdWxlIDEuMS4xIHNwZWNcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gUHViU3ViOyAvLyBDb21tb25KU1xuICAgIH1cbiAgICAvLyBBTUQgc3VwcG9ydFxuICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLXVuZGVmICovXG4gICAgZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKXtcbiAgICAgICAgZGVmaW5lKGZ1bmN0aW9uKCkgeyByZXR1cm4gUHViU3ViOyB9KTtcbiAgICAgICAgLyogZXNsaW50LWVuYWJsZSBuby11bmRlZiAqL1xuICAgIH1cblxufSgoIHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnICYmIHdpbmRvdyApIHx8IHRoaXMsIGZ1bmN0aW9uIChQdWJTdWIpe1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBtZXNzYWdlcyA9IHt9LFxuICAgICAgICBsYXN0VWlkID0gLTEsXG4gICAgICAgIEFMTF9TVUJTQ1JJQklOR19NU0cgPSAnKic7XG5cbiAgICBmdW5jdGlvbiBoYXNLZXlzKG9iail7XG4gICAgICAgIHZhciBrZXk7XG5cbiAgICAgICAgZm9yIChrZXkgaW4gb2JqKXtcbiAgICAgICAgICAgIGlmICggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSApe1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCB0aHJvd3MgdGhlIHBhc3NlZCBleGNlcHRpb24sIGZvciB1c2UgYXMgYXJndW1lbnQgZm9yIHNldFRpbWVvdXRcbiAgICAgKiBAYWxpYXMgdGhyb3dFeGNlcHRpb25cbiAgICAgKiBAZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0geyBPYmplY3QgfSBleCBBbiBFcnJvciBvYmplY3RcbiAgICAgKi9cbiAgICBmdW5jdGlvbiB0aHJvd0V4Y2VwdGlvbiggZXggKXtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIHJlVGhyb3dFeGNlcHRpb24oKXtcbiAgICAgICAgICAgIHRocm93IGV4O1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNhbGxTdWJzY3JpYmVyV2l0aERlbGF5ZWRFeGNlcHRpb25zKCBzdWJzY3JpYmVyLCBtZXNzYWdlLCBkYXRhICl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBzdWJzY3JpYmVyKCBtZXNzYWdlLCBkYXRhICk7XG4gICAgICAgIH0gY2F0Y2goIGV4ICl7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCB0aHJvd0V4Y2VwdGlvbiggZXggKSwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjYWxsU3Vic2NyaWJlcldpdGhJbW1lZGlhdGVFeGNlcHRpb25zKCBzdWJzY3JpYmVyLCBtZXNzYWdlLCBkYXRhICl7XG4gICAgICAgIHN1YnNjcmliZXIoIG1lc3NhZ2UsIGRhdGEgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkZWxpdmVyTWVzc2FnZSggb3JpZ2luYWxNZXNzYWdlLCBtYXRjaGVkTWVzc2FnZSwgZGF0YSwgaW1tZWRpYXRlRXhjZXB0aW9ucyApe1xuICAgICAgICB2YXIgc3Vic2NyaWJlcnMgPSBtZXNzYWdlc1ttYXRjaGVkTWVzc2FnZV0sXG4gICAgICAgICAgICBjYWxsU3Vic2NyaWJlciA9IGltbWVkaWF0ZUV4Y2VwdGlvbnMgPyBjYWxsU3Vic2NyaWJlcldpdGhJbW1lZGlhdGVFeGNlcHRpb25zIDogY2FsbFN1YnNjcmliZXJXaXRoRGVsYXllZEV4Y2VwdGlvbnMsXG4gICAgICAgICAgICBzO1xuXG4gICAgICAgIGlmICggIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCggbWVzc2FnZXMsIG1hdGNoZWRNZXNzYWdlICkgKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHMgaW4gc3Vic2NyaWJlcnMpe1xuICAgICAgICAgICAgaWYgKCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc3Vic2NyaWJlcnMsIHMpKXtcbiAgICAgICAgICAgICAgICBjYWxsU3Vic2NyaWJlciggc3Vic2NyaWJlcnNbc10sIG9yaWdpbmFsTWVzc2FnZSwgZGF0YSApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlRGVsaXZlcnlGdW5jdGlvbiggbWVzc2FnZSwgZGF0YSwgaW1tZWRpYXRlRXhjZXB0aW9ucyApe1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gZGVsaXZlck5hbWVzcGFjZWQoKXtcbiAgICAgICAgICAgIHZhciB0b3BpYyA9IFN0cmluZyggbWVzc2FnZSApLFxuICAgICAgICAgICAgICAgIHBvc2l0aW9uID0gdG9waWMubGFzdEluZGV4T2YoICcuJyApO1xuXG4gICAgICAgICAgICAvLyBkZWxpdmVyIHRoZSBtZXNzYWdlIGFzIGl0IGlzIG5vd1xuICAgICAgICAgICAgZGVsaXZlck1lc3NhZ2UobWVzc2FnZSwgbWVzc2FnZSwgZGF0YSwgaW1tZWRpYXRlRXhjZXB0aW9ucyk7XG5cbiAgICAgICAgICAgIC8vIHRyaW0gdGhlIGhpZXJhcmNoeSBhbmQgZGVsaXZlciBtZXNzYWdlIHRvIGVhY2ggbGV2ZWxcbiAgICAgICAgICAgIHdoaWxlKCBwb3NpdGlvbiAhPT0gLTEgKXtcbiAgICAgICAgICAgICAgICB0b3BpYyA9IHRvcGljLnN1YnN0ciggMCwgcG9zaXRpb24gKTtcbiAgICAgICAgICAgICAgICBwb3NpdGlvbiA9IHRvcGljLmxhc3RJbmRleE9mKCcuJyk7XG4gICAgICAgICAgICAgICAgZGVsaXZlck1lc3NhZ2UoIG1lc3NhZ2UsIHRvcGljLCBkYXRhLCBpbW1lZGlhdGVFeGNlcHRpb25zICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRlbGl2ZXJNZXNzYWdlKG1lc3NhZ2UsIEFMTF9TVUJTQ1JJQklOR19NU0csIGRhdGEsIGltbWVkaWF0ZUV4Y2VwdGlvbnMpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhhc0RpcmVjdFN1YnNjcmliZXJzRm9yKCBtZXNzYWdlICkge1xuICAgICAgICB2YXIgdG9waWMgPSBTdHJpbmcoIG1lc3NhZ2UgKSxcbiAgICAgICAgICAgIGZvdW5kID0gQm9vbGVhbihPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoIG1lc3NhZ2VzLCB0b3BpYyApICYmIGhhc0tleXMobWVzc2FnZXNbdG9waWNdKSk7XG5cbiAgICAgICAgcmV0dXJuIGZvdW5kO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1lc3NhZ2VIYXNTdWJzY3JpYmVycyggbWVzc2FnZSApe1xuICAgICAgICB2YXIgdG9waWMgPSBTdHJpbmcoIG1lc3NhZ2UgKSxcbiAgICAgICAgICAgIGZvdW5kID0gaGFzRGlyZWN0U3Vic2NyaWJlcnNGb3IodG9waWMpIHx8IGhhc0RpcmVjdFN1YnNjcmliZXJzRm9yKEFMTF9TVUJTQ1JJQklOR19NU0cpLFxuICAgICAgICAgICAgcG9zaXRpb24gPSB0b3BpYy5sYXN0SW5kZXhPZiggJy4nICk7XG5cbiAgICAgICAgd2hpbGUgKCAhZm91bmQgJiYgcG9zaXRpb24gIT09IC0xICl7XG4gICAgICAgICAgICB0b3BpYyA9IHRvcGljLnN1YnN0ciggMCwgcG9zaXRpb24gKTtcbiAgICAgICAgICAgIHBvc2l0aW9uID0gdG9waWMubGFzdEluZGV4T2YoICcuJyApO1xuICAgICAgICAgICAgZm91bmQgPSBoYXNEaXJlY3RTdWJzY3JpYmVyc0Zvcih0b3BpYyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZm91bmQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHVibGlzaCggbWVzc2FnZSwgZGF0YSwgc3luYywgaW1tZWRpYXRlRXhjZXB0aW9ucyApe1xuICAgICAgICBtZXNzYWdlID0gKHR5cGVvZiBtZXNzYWdlID09PSAnc3ltYm9sJykgPyBtZXNzYWdlLnRvU3RyaW5nKCkgOiBtZXNzYWdlO1xuXG4gICAgICAgIHZhciBkZWxpdmVyID0gY3JlYXRlRGVsaXZlcnlGdW5jdGlvbiggbWVzc2FnZSwgZGF0YSwgaW1tZWRpYXRlRXhjZXB0aW9ucyApLFxuICAgICAgICAgICAgaGFzU3Vic2NyaWJlcnMgPSBtZXNzYWdlSGFzU3Vic2NyaWJlcnMoIG1lc3NhZ2UgKTtcblxuICAgICAgICBpZiAoICFoYXNTdWJzY3JpYmVycyApe1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBzeW5jID09PSB0cnVlICl7XG4gICAgICAgICAgICBkZWxpdmVyKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCBkZWxpdmVyLCAwICk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUHVibGlzaGVzIHRoZSBtZXNzYWdlLCBwYXNzaW5nIHRoZSBkYXRhIHRvIGl0J3Mgc3Vic2NyaWJlcnNcbiAgICAgKiBAZnVuY3Rpb25cbiAgICAgKiBAYWxpYXMgcHVibGlzaFxuICAgICAqIEBwYXJhbSB7IFN0cmluZyB9IG1lc3NhZ2UgVGhlIG1lc3NhZ2UgdG8gcHVibGlzaFxuICAgICAqIEBwYXJhbSB7fSBkYXRhIFRoZSBkYXRhIHRvIHBhc3MgdG8gc3Vic2NyaWJlcnNcbiAgICAgKiBAcmV0dXJuIHsgQm9vbGVhbiB9XG4gICAgICovXG4gICAgUHViU3ViLnB1Ymxpc2ggPSBmdW5jdGlvbiggbWVzc2FnZSwgZGF0YSApe1xuICAgICAgICByZXR1cm4gcHVibGlzaCggbWVzc2FnZSwgZGF0YSwgZmFsc2UsIFB1YlN1Yi5pbW1lZGlhdGVFeGNlcHRpb25zICk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFB1Ymxpc2hlcyB0aGUgbWVzc2FnZSBzeW5jaHJvbm91c2x5LCBwYXNzaW5nIHRoZSBkYXRhIHRvIGl0J3Mgc3Vic2NyaWJlcnNcbiAgICAgKiBAZnVuY3Rpb25cbiAgICAgKiBAYWxpYXMgcHVibGlzaFN5bmNcbiAgICAgKiBAcGFyYW0geyBTdHJpbmcgfSBtZXNzYWdlIFRoZSBtZXNzYWdlIHRvIHB1Ymxpc2hcbiAgICAgKiBAcGFyYW0ge30gZGF0YSBUaGUgZGF0YSB0byBwYXNzIHRvIHN1YnNjcmliZXJzXG4gICAgICogQHJldHVybiB7IEJvb2xlYW4gfVxuICAgICAqL1xuICAgIFB1YlN1Yi5wdWJsaXNoU3luYyA9IGZ1bmN0aW9uKCBtZXNzYWdlLCBkYXRhICl7XG4gICAgICAgIHJldHVybiBwdWJsaXNoKCBtZXNzYWdlLCBkYXRhLCB0cnVlLCBQdWJTdWIuaW1tZWRpYXRlRXhjZXB0aW9ucyApO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTdWJzY3JpYmVzIHRoZSBwYXNzZWQgZnVuY3Rpb24gdG8gdGhlIHBhc3NlZCBtZXNzYWdlLiBFdmVyeSByZXR1cm5lZCB0b2tlbiBpcyB1bmlxdWUgYW5kIHNob3VsZCBiZSBzdG9yZWQgaWYgeW91IG5lZWQgdG8gdW5zdWJzY3JpYmVcbiAgICAgKiBAZnVuY3Rpb25cbiAgICAgKiBAYWxpYXMgc3Vic2NyaWJlXG4gICAgICogQHBhcmFtIHsgU3RyaW5nIH0gbWVzc2FnZSBUaGUgbWVzc2FnZSB0byBzdWJzY3JpYmUgdG9cbiAgICAgKiBAcGFyYW0geyBGdW5jdGlvbiB9IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGNhbGwgd2hlbiBhIG5ldyBtZXNzYWdlIGlzIHB1Ymxpc2hlZFxuICAgICAqIEByZXR1cm4geyBTdHJpbmcgfVxuICAgICAqL1xuICAgIFB1YlN1Yi5zdWJzY3JpYmUgPSBmdW5jdGlvbiggbWVzc2FnZSwgZnVuYyApe1xuICAgICAgICBpZiAoIHR5cGVvZiBmdW5jICE9PSAnZnVuY3Rpb24nKXtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIG1lc3NhZ2UgPSAodHlwZW9mIG1lc3NhZ2UgPT09ICdzeW1ib2wnKSA/IG1lc3NhZ2UudG9TdHJpbmcoKSA6IG1lc3NhZ2U7XG5cbiAgICAgICAgLy8gbWVzc2FnZSBpcyBub3QgcmVnaXN0ZXJlZCB5ZXRcbiAgICAgICAgaWYgKCAhT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKCBtZXNzYWdlcywgbWVzc2FnZSApICl7XG4gICAgICAgICAgICBtZXNzYWdlc1ttZXNzYWdlXSA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZm9yY2luZyB0b2tlbiBhcyBTdHJpbmcsIHRvIGFsbG93IGZvciBmdXR1cmUgZXhwYW5zaW9ucyB3aXRob3V0IGJyZWFraW5nIHVzYWdlXG4gICAgICAgIC8vIGFuZCBhbGxvdyBmb3IgZWFzeSB1c2UgYXMga2V5IG5hbWVzIGZvciB0aGUgJ21lc3NhZ2VzJyBvYmplY3RcbiAgICAgICAgdmFyIHRva2VuID0gJ3VpZF8nICsgU3RyaW5nKCsrbGFzdFVpZCk7XG4gICAgICAgIG1lc3NhZ2VzW21lc3NhZ2VdW3Rva2VuXSA9IGZ1bmM7XG5cbiAgICAgICAgLy8gcmV0dXJuIHRva2VuIGZvciB1bnN1YnNjcmliaW5nXG4gICAgICAgIHJldHVybiB0b2tlbjtcbiAgICB9O1xuXG4gICAgUHViU3ViLnN1YnNjcmliZUFsbCA9IGZ1bmN0aW9uKCBmdW5jICl7XG4gICAgICAgIHJldHVybiBQdWJTdWIuc3Vic2NyaWJlKEFMTF9TVUJTQ1JJQklOR19NU0csIGZ1bmMpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTdWJzY3JpYmVzIHRoZSBwYXNzZWQgZnVuY3Rpb24gdG8gdGhlIHBhc3NlZCBtZXNzYWdlIG9uY2VcbiAgICAgKiBAZnVuY3Rpb25cbiAgICAgKiBAYWxpYXMgc3Vic2NyaWJlT25jZVxuICAgICAqIEBwYXJhbSB7IFN0cmluZyB9IG1lc3NhZ2UgVGhlIG1lc3NhZ2UgdG8gc3Vic2NyaWJlIHRvXG4gICAgICogQHBhcmFtIHsgRnVuY3Rpb24gfSBmdW5jIFRoZSBmdW5jdGlvbiB0byBjYWxsIHdoZW4gYSBuZXcgbWVzc2FnZSBpcyBwdWJsaXNoZWRcbiAgICAgKiBAcmV0dXJuIHsgUHViU3ViIH1cbiAgICAgKi9cbiAgICBQdWJTdWIuc3Vic2NyaWJlT25jZSA9IGZ1bmN0aW9uKCBtZXNzYWdlLCBmdW5jICl7XG4gICAgICAgIHZhciB0b2tlbiA9IFB1YlN1Yi5zdWJzY3JpYmUoIG1lc3NhZ2UsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAvLyBiZWZvcmUgZnVuYyBhcHBseSwgdW5zdWJzY3JpYmUgbWVzc2FnZVxuICAgICAgICAgICAgUHViU3ViLnVuc3Vic2NyaWJlKCB0b2tlbiApO1xuICAgICAgICAgICAgZnVuYy5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gUHViU3ViO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDbGVhcnMgYWxsIHN1YnNjcmlwdGlvbnNcbiAgICAgKiBAZnVuY3Rpb25cbiAgICAgKiBAcHVibGljXG4gICAgICogQGFsaWFzIGNsZWFyQWxsU3Vic2NyaXB0aW9uc1xuICAgICAqL1xuICAgIFB1YlN1Yi5jbGVhckFsbFN1YnNjcmlwdGlvbnMgPSBmdW5jdGlvbiBjbGVhckFsbFN1YnNjcmlwdGlvbnMoKXtcbiAgICAgICAgbWVzc2FnZXMgPSB7fTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ2xlYXIgc3Vic2NyaXB0aW9ucyBieSB0aGUgdG9waWNcbiAgICAgKiBAZnVuY3Rpb25cbiAgICAgKiBAcHVibGljXG4gICAgICogQGFsaWFzIGNsZWFyQWxsU3Vic2NyaXB0aW9uc1xuICAgICAqIEByZXR1cm4geyBpbnQgfVxuICAgICAqL1xuICAgIFB1YlN1Yi5jbGVhclN1YnNjcmlwdGlvbnMgPSBmdW5jdGlvbiBjbGVhclN1YnNjcmlwdGlvbnModG9waWMpe1xuICAgICAgICB2YXIgbTtcbiAgICAgICAgZm9yIChtIGluIG1lc3NhZ2VzKXtcbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobWVzc2FnZXMsIG0pICYmIG0uaW5kZXhPZih0b3BpYykgPT09IDApe1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBtZXNzYWdlc1ttXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgICBDb3VudCBzdWJzY3JpcHRpb25zIGJ5IHRoZSB0b3BpY1xuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAYWxpYXMgY291bnRTdWJzY3JpcHRpb25zXG4gICAgICogQHJldHVybiB7IEFycmF5IH1cbiAgICAqL1xuICAgIFB1YlN1Yi5jb3VudFN1YnNjcmlwdGlvbnMgPSBmdW5jdGlvbiBjb3VudFN1YnNjcmlwdGlvbnModG9waWMpe1xuICAgICAgICB2YXIgbTtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgICAgIHZhciB0b2tlbjtcbiAgICAgICAgdmFyIGNvdW50ID0gMDtcbiAgICAgICAgZm9yIChtIGluIG1lc3NhZ2VzKSB7XG4gICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1lc3NhZ2VzLCBtKSAmJiBtLmluZGV4T2YodG9waWMpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgZm9yICh0b2tlbiBpbiBtZXNzYWdlc1ttXSkge1xuICAgICAgICAgICAgICAgICAgICBjb3VudCsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY291bnQ7XG4gICAgfTtcblxuXG4gICAgLyoqXG4gICAgICAgR2V0cyBzdWJzY3JpcHRpb25zIGJ5IHRoZSB0b3BpY1xuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAYWxpYXMgZ2V0U3Vic2NyaXB0aW9uc1xuICAgICovXG4gICAgUHViU3ViLmdldFN1YnNjcmlwdGlvbnMgPSBmdW5jdGlvbiBnZXRTdWJzY3JpcHRpb25zKHRvcGljKXtcbiAgICAgICAgdmFyIG07XG4gICAgICAgIHZhciBsaXN0ID0gW107XG4gICAgICAgIGZvciAobSBpbiBtZXNzYWdlcyl7XG4gICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1lc3NhZ2VzLCBtKSAmJiBtLmluZGV4T2YodG9waWMpID09PSAwKXtcbiAgICAgICAgICAgICAgICBsaXN0LnB1c2gobSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGxpc3Q7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgc3Vic2NyaXB0aW9uc1xuICAgICAqXG4gICAgICogLSBXaGVuIHBhc3NlZCBhIHRva2VuLCByZW1vdmVzIGEgc3BlY2lmaWMgc3Vic2NyaXB0aW9uLlxuICAgICAqXG5cdCAqIC0gV2hlbiBwYXNzZWQgYSBmdW5jdGlvbiwgcmVtb3ZlcyBhbGwgc3Vic2NyaXB0aW9ucyBmb3IgdGhhdCBmdW5jdGlvblxuICAgICAqXG5cdCAqIC0gV2hlbiBwYXNzZWQgYSB0b3BpYywgcmVtb3ZlcyBhbGwgc3Vic2NyaXB0aW9ucyBmb3IgdGhhdCB0b3BpYyAoaGllcmFyY2h5KVxuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAYWxpYXMgc3Vic2NyaWJlT25jZVxuICAgICAqIEBwYXJhbSB7IFN0cmluZyB8IEZ1bmN0aW9uIH0gdmFsdWUgQSB0b2tlbiwgZnVuY3Rpb24gb3IgdG9waWMgdG8gdW5zdWJzY3JpYmUgZnJvbVxuICAgICAqIEBleGFtcGxlIC8vIFVuc3Vic2NyaWJpbmcgd2l0aCBhIHRva2VuXG4gICAgICogdmFyIHRva2VuID0gUHViU3ViLnN1YnNjcmliZSgnbXl0b3BpYycsIG15RnVuYyk7XG4gICAgICogUHViU3ViLnVuc3Vic2NyaWJlKHRva2VuKTtcbiAgICAgKiBAZXhhbXBsZSAvLyBVbnN1YnNjcmliaW5nIHdpdGggYSBmdW5jdGlvblxuICAgICAqIFB1YlN1Yi51bnN1YnNjcmliZShteUZ1bmMpO1xuICAgICAqIEBleGFtcGxlIC8vIFVuc3Vic2NyaWJpbmcgZnJvbSBhIHRvcGljXG4gICAgICogUHViU3ViLnVuc3Vic2NyaWJlKCdteXRvcGljJyk7XG4gICAgICovXG4gICAgUHViU3ViLnVuc3Vic2NyaWJlID0gZnVuY3Rpb24odmFsdWUpe1xuICAgICAgICB2YXIgZGVzY2VuZGFudFRvcGljRXhpc3RzID0gZnVuY3Rpb24odG9waWMpIHtcbiAgICAgICAgICAgICAgICB2YXIgbTtcbiAgICAgICAgICAgICAgICBmb3IgKCBtIGluIG1lc3NhZ2VzICl7XG4gICAgICAgICAgICAgICAgICAgIGlmICggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1lc3NhZ2VzLCBtKSAmJiBtLmluZGV4T2YodG9waWMpID09PSAwICl7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhIGRlc2NlbmRhbnQgb2YgdGhlIHRvcGljIGV4aXN0czpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzVG9waWMgICAgPSB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnICYmICggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1lc3NhZ2VzLCB2YWx1ZSkgfHwgZGVzY2VuZGFudFRvcGljRXhpc3RzKHZhbHVlKSApLFxuICAgICAgICAgICAgaXNUb2tlbiAgICA9ICFpc1RvcGljICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycsXG4gICAgICAgICAgICBpc0Z1bmN0aW9uID0gdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nLFxuICAgICAgICAgICAgcmVzdWx0ID0gZmFsc2UsXG4gICAgICAgICAgICBtLCBtZXNzYWdlLCB0O1xuXG4gICAgICAgIGlmIChpc1RvcGljKXtcbiAgICAgICAgICAgIFB1YlN1Yi5jbGVhclN1YnNjcmlwdGlvbnModmFsdWUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yICggbSBpbiBtZXNzYWdlcyApe1xuICAgICAgICAgICAgaWYgKCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoIG1lc3NhZ2VzLCBtICkgKXtcbiAgICAgICAgICAgICAgICBtZXNzYWdlID0gbWVzc2FnZXNbbV07XG5cbiAgICAgICAgICAgICAgICBpZiAoIGlzVG9rZW4gJiYgbWVzc2FnZVt2YWx1ZV0gKXtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG1lc3NhZ2VbdmFsdWVdO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgLy8gdG9rZW5zIGFyZSB1bmlxdWUsIHNvIHdlIGNhbiBqdXN0IHN0b3AgaGVyZVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoaXNGdW5jdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKCB0IGluIG1lc3NhZ2UgKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobWVzc2FnZSwgdCkgJiYgbWVzc2FnZVt0XSA9PT0gdmFsdWUpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBtZXNzYWdlW3RdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG59KSk7XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdGlkOiBtb2R1bGVJZCxcblx0XHRsb2FkZWQ6IGZhbHNlLFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcblx0bW9kdWxlLmxvYWRlZCA9IHRydWU7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuX193ZWJwYWNrX3JlcXVpcmVfXy5uID0gKG1vZHVsZSkgPT4ge1xuXHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cblx0XHQoKSA9PiAobW9kdWxlWydkZWZhdWx0J10pIDpcblx0XHQoKSA9PiAobW9kdWxlKTtcblx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgeyBhOiBnZXR0ZXIgfSk7XG5cdHJldHVybiBnZXR0ZXI7XG59OyIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm5tZCA9IChtb2R1bGUpID0+IHtcblx0bW9kdWxlLnBhdGhzID0gW107XG5cdGlmICghbW9kdWxlLmNoaWxkcmVuKSBtb2R1bGUuY2hpbGRyZW4gPSBbXTtcblx0cmV0dXJuIG1vZHVsZTtcbn07IiwiXCJ1c2Ugc3RyaWN0XCJcbmltcG9ydCBQdWJTdWIgZnJvbSAncHVic3ViLWpzJztcblxuY29uc3QgZ2FtZUJvYXJkID0gKFxuICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IF9ib2FyZDtcblxuICAgICAgICBjb25zdCBfY2hlY2tXaW5Ib3Jpem9udGFsID0gZnVuY3Rpb24gKG1hcmssIGJvYXJkID0gX2JvYXJkKSB7XG4gICAgICAgICAgICAvL2NoZWNrIGlmIGFueSBsaW5lIGhhcyB0aHJlZSBjb25zZWN1dGl2ZSBtYXJrcyBvZiBhbnkga2luZFxuICAgICAgICAgICAgY29uc3Qgd2luID0gYm9hcmQuc2xpY2UoMCwgNykuc29tZSgoY2VsbCwgaSkgPT4ge1xuICAgICAgICAgICAgICAgIC8vY2hlY2sgb25seSBldmVyeSB0aHJlZSBtYXJrcyBpZiB0aGUgbmV4dCB0d28gYXJlIHRoZSBzYW1lXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNlbGwgPT09IG1hcmsgJiYgaSAlIDMgPT09IDAgJiYgY2VsbCA9PT0gYm9hcmRbaSArIDFdICYmIGNlbGwgPT09IGJvYXJkW2kgKyAyXVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIHJldHVybiB3aW5cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IF9jaGVja1dpblZlcnRpY2FsID0gZnVuY3Rpb24gKG1hcmssIGJvYXJkID0gX2JvYXJkKSB7XG4gICAgICAgICAgICAvL2NoZWNrIHZlcnRpY2FsIGxpbmVzXG4gICAgICAgICAgICBjb25zdCB3aW4gPSBib2FyZC5zbGljZSgwLCAzKS5zb21lKChjZWxsLCBpKSA9PiB7XG4gICAgICAgICAgICAgICAgLy9jaGVjayBpbiB0aGUgZmlyc3Qgcm93IGlmIHRoZSB0d28gYmVsb3cgYXJlIHRoZSBzYW1lXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNlbGwgPT09IG1hcmsgJiYgY2VsbCA9PT0gYm9hcmRbaSArIDNdICYmIGNlbGwgPT09IGJvYXJkW2kgKyA2XVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIHJldHVybiB3aW5cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IF9jaGVja1dpbkRpYWdvbmFsID0gZnVuY3Rpb24gKG1hcmssIGJvYXJkID0gX2JvYXJkKSB7XG4gICAgICAgICAgICBjb25zdCB3aW4gPSBib2FyZC5zbGljZSgwLCAzKS5zb21lKChjZWxsLCBpKSA9PiB7XG4gICAgICAgICAgICAgICAgLy9jaGVjayBldmVyeSBpbmRleCAwIGFuZCAyXG4gICAgICAgICAgICAgICAgaWYgKGkgPT09IDAgJiYgY2VsbCA9PT0gbWFyayAmJiBjZWxsID09PSBib2FyZFs0XSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2VsbCA9PT0gYm9hcmRbOF1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGkgPT0gMiAmJiBjZWxsID09PSBtYXJrICYmIGNlbGwgPT09IGJvYXJkWzRdKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjZWxsID09PSBib2FyZFs2XVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICByZXR1cm4gd2luXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjaGVja1RpZSA9IGZ1bmN0aW9uIChib2FyZCA9IF9ib2FyZCkge1xuICAgICAgICAgICAgcmV0dXJuIGJvYXJkLmV2ZXJ5KChjZWxsKSA9PiBjZWxsICE9ICcnKVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY2hlY2tXaW4gPSBmdW5jdGlvbiAobWFyaywgYm9hcmQgPSBfYm9hcmQpIHtcbiAgICAgICAgICAgIHJldHVybiBfY2hlY2tXaW5Ib3Jpem9udGFsKG1hcmssIGJvYXJkKSB8fCBfY2hlY2tXaW5WZXJ0aWNhbChtYXJrLCBib2FyZCkgfHwgX2NoZWNrV2luRGlhZ29uYWwobWFyaywgYm9hcmQpO1xuXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBfdXBkYXRlID0gZnVuY3Rpb24gKG1zZywgZGF0YSkge1xuICAgICAgICAgICAgLy9leHRyYWN0IGRhdGEgZnJvbSBQdWJTdWJcbiAgICAgICAgICAgIGNvbnN0IHsgY2VsbE51bSwgbWFyayB9ID0gZGF0YTtcblxuICAgICAgICAgICAgaWYgKF9ib2FyZFtjZWxsTnVtXSA9PSAnJykgey8vZG9uJ3QgdXBkYXRlIGlmIGNlbGwgaGFzIGFscmVhZHkgYmVlbiBwbGF5ZWRcbiAgICAgICAgICAgICAgICBfYm9hcmRbY2VsbE51bV0gPSBtYXJrO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IF9yZXN0YXJ0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgX2JvYXJkID0gbmV3IEFycmF5KDkpLmZpbGwoJycpO1xuICAgICAgICB9XG5cbiAgICAgICAgUHViU3ViLnN1YnNjcmliZSgnZ2FtZS1zdGFydCcsIF9yZXN0YXJ0KTtcbiAgICAgICAgLy9zdWJzY3JpYmUgdG8gZXZlbnQgdHJpZ2dlcmVkIHdoZW4gcGxheWVyIGFkZHMgYSBtYXJrXG4gICAgICAgIFB1YlN1Yi5zdWJzY3JpYmUoJ21hcmstYWRkZWQnLCBfdXBkYXRlKTtcblxuICAgICAgICBjb25zdCBnZXRCb2FyZCA9ICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBfYm9hcmRcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geyBjaGVja1RpZSwgY2hlY2tXaW4sIGdldEJvYXJkIH1cbiAgICB9XG4pKCk7XG5cbmNvbnN0IHBvcFVwID0gKFxuICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3QgX3BvcHVwID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3BvcC11cCcpO1xuICAgICAgICBjb25zdCBfcG9wdXBGb3JtID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2Zvcm0tcGxheWVyLW5hbWVzJyk7XG4gICAgICAgIGNvbnN0IF9wb3B1cEJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNwb3AtdXAtYnV0dG9uJyk7XG4gICAgICAgIGNvbnN0IF9jaG9vc2VQbGF5ZXJzQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2Nob29zZS1wbGF5ZXJzLWJ1dHRvbicpO1xuICAgICAgICBjb25zdCBfdmlzaWJsZUFyZWEgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjdmlzaWJsZS1hcmVhJyk7XG5cblxuICAgICAgICBjb25zdCBfdG9nZ2xlUG9wdXAgPSAoKSA9PiB7XG4gICAgICAgICAgICBfcG9wdXAuY2xhc3NMaXN0LnRvZ2dsZSgnaW52aXNpYmxlJylcbiAgICAgICAgICAgIF92aXNpYmxlQXJlYS5mb3JFYWNoKChhcmVhKSA9PiBhcmVhLmNsYXNzTGlzdC50b2dnbGUoJ2ludmlzaWJsZScpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIF9jaG9vc2VQbGF5ZXJzQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgX3RvZ2dsZVBvcHVwKTtcblxuICAgICAgICAvL3Nob3cgZ2FtZSBhZnRlciBwcmVzc2luZyBzdGFydCBidXR0b24gaW4gcG9wIHVwXG4gICAgICAgIF9wb3B1cEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgICAgICAvL3VzZWQgdG8gZGlzcGxheSBlcnJvciBpZiBib3RoIHBsYXllcnMgYXJlIEFJc1xuICAgICAgICAgICAgY29uc3QgYWxlcnRBcmVhID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3BvcC11cC1hbGVydCcpXG4gICAgICAgICAgICBpZiAoX3BvcHVwRm9ybS5jaGVja1ZhbGlkaXR5KCkpIHtcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoX3BvcHVwRm9ybSlcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdQbGF5ZXJEYXRhID0gT2JqZWN0LmZyb21FbnRyaWVzKGZvcm1EYXRhLmVudHJpZXMoKSlcblxuICAgICAgICAgICAgICAgIGNvbnN0IHBsYXllcjFOYW1lID0gbmV3UGxheWVyRGF0YVsncGxheWVyMU5hbWUnXTtcbiAgICAgICAgICAgICAgICBjb25zdCBwbGF5ZXIyTmFtZSA9IG5ld1BsYXllckRhdGFbJ3BsYXllcjJOYW1lJ107XG4gICAgICAgICAgICAgICAgY29uc3QgcGxheWVyMVR5cGUgPSBuZXdQbGF5ZXJEYXRhWydwbGF5ZXIxVHlwZSddO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBsYXllcjJUeXBlID0gbmV3UGxheWVyRGF0YVsncGxheWVyMlR5cGUnXTtcblxuICAgICAgICAgICAgICAgIC8vc3RvcCBnYW1lIGZyb20gc3RhcnRpbmcgaWYgYm90aCBhcmUgQUlzXG4gICAgICAgICAgICAgICAgaWYgKHBsYXllcjFUeXBlICE9ICdodW1hbicgJiYgcGxheWVyMlR5cGUgIT0gJ2h1bWFuJykge1xuICAgICAgICAgICAgICAgICAgICBhbGVydEFyZWEuaW5uZXJUZXh0ID0gJ0F0IGxlYXN0IG9uZSBoYXMgdG8gYmUgaHVtYW4hJztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBfdG9nZ2xlUG9wdXAoKTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwbGF5ZXIxID0gKHBsYXllcjFUeXBlID09ICdodW1hbicpID9cbiAgICAgICAgICAgICAgICAgICAgICAgIFBsYXllcihwbGF5ZXIxTmFtZSwgJzAnKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICBBSVBsYXllcihwbGF5ZXIxTmFtZSwgJzAnLCBwbGF5ZXIxVHlwZSk7Ly9hZGQgZGlmZmljdWx0eVxuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBsYXllcjIgPSAocGxheWVyMlR5cGUgPT0gJ2h1bWFuJykgP1xuICAgICAgICAgICAgICAgICAgICAgICAgUGxheWVyKHBsYXllcjJOYW1lLCAneCcpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgIEFJUGxheWVyKHBsYXllcjJOYW1lLCAneCcsIHBsYXllcjJUeXBlKTsvL2FkZCBkaWZmaWN1bHR5XG5cblxuICAgICAgICAgICAgICAgICAgICBQdWJTdWIucHVibGlzaCgnZ2FtZS1zdGFydCcsIHsgcGxheWVyMSwgcGxheWVyMiB9KVxuICAgICAgICAgICAgICAgICAgICBfcG9wdXBGb3JtLnJlc2V0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4pKClcblxuLy9tYW5hZ2VzIGFsbCBnYW1lIHVwZGF0ZXNcbmNvbnN0IGRpc3BsYXlDb250cm9sbGVyID0gKFxuICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3QgX2dhbWVBcmVhID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2dhbWUtYXJlYScpO1xuICAgICAgICBjb25zdCBfZ2FtZUNlbGxzID0gQXJyYXkuZnJvbShfZ2FtZUFyZWEuY2hpbGRyZW4pO1xuICAgICAgICBjb25zdCBfc3RhdGVEaXNwbGF5ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3N0YXRlLWRpc3BsYXknKTtcbiAgICAgICAgY29uc3QgX3Jlc3RhcnRCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjcmVzdGFydC1idXR0b24nKTtcblxuICAgICAgICBjb25zdCBfY2VsbExpc3RlbmVyRnVuYyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vc2VuZCB0aGUgY2VsbCBhcyBhIG51bWJlclxuICAgICAgICAgICAgUHViU3ViLnB1Ymxpc2goJ2NlbGwtcHJlc3NlZCcsIHRoaXMuZ2V0QXR0cmlidXRlKCdkYXRhJykpXG4gICAgICAgIH07XG5cblxuICAgICAgICAvL3Jlc3RhcnQgd2l0aCBidXR0b25cbiAgICAgICAgX3Jlc3RhcnRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgICBfc3RhdGVEaXNwbGF5LnN0eWxlLmNvbG9yID0gJyc7XG4gICAgICAgICAgICBQdWJTdWIucHVibGlzaCgnZ2FtZS1zdGFydCcsIHsgJ3BsYXllcjEnOiBnYW1lLmdldFBsYXllcjEoKSwgJ2NlbGxOdW0nOiA5IH0pXG4gICAgICAgIH0pO1xuXG5cbiAgICAgICAgY29uc3QgX3Jlc3RhcnRDZWxscyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIF9nYW1lQ2VsbHMuZm9yRWFjaCgoY2VsbCkgPT4ge1xuICAgICAgICAgICAgICAgIGNlbGwuY2hpbGRyZW5bMF0uY2xhc3NMaXN0LnJlbW92ZSgnY2hvc2VuJyk7XG4gICAgICAgICAgICAgICAgY2VsbC5jbGFzc0xpc3QucmVtb3ZlKCdjaG9zZW4nKTtcbiAgICAgICAgICAgICAgICBjZWxsLmNsYXNzTGlzdC5hZGQoJ2NpcmNsZScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgKVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vdXBkYXRlcyBET01cbiAgICAgICAgY29uc3QgX3JlbmRlciA9IGZ1bmN0aW9uIChtc2csIGRhdGEpIHtcbiAgICAgICAgICAgIC8vX3JlbmRlciBpZiBmaXJzdCBwbGF5ZXIgaXNuJ3QgQUkuXG4gICAgICAgICAgICBjb25zdCBib2FyZCA9IGdhbWVCb2FyZC5nZXRCb2FyZCgpO1xuICAgICAgICAgICAgY29uc3QgeyBjZWxsTnVtIH0gPSBkYXRhO1xuICAgICAgICAgICAgX2dhbWVDZWxscy5mb3JFYWNoKChjZWxsLCBpKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGltYWdlUGF0aFxuICAgICAgICAgICAgICAgIC8vX3JlbmRlciBpbWFnZXNcbiAgICAgICAgICAgICAgICBpZiAoYm9hcmRbaV0gPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2VQYXRoID0gJydcbiAgICAgICAgICAgICAgICAgICAgY2VsbC5jbGFzc0xpc3QucmVtb3ZlKCdjaG9zZW4nKVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vZGVhY3RpdmF0ZSBjZWxsICAgIFxuICAgICAgICAgICAgICAgICAgICBjZWxsLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgX2NlbGxMaXN0ZW5lckZ1bmMpXG4gICAgICAgICAgICAgICAgICAgIGltYWdlUGF0aCA9IGJvYXJkW2ldID09ICd4JyA/XG4gICAgICAgICAgICAgICAgICAgICAgICAnLi9pbWFnZXMvY3Jvc3MucG5nJyA6XG4gICAgICAgICAgICAgICAgICAgICAgICAnLi9pbWFnZXMvY2lyY2xlLnBuZyc7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNlbGxOdW0gPT0gaSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2VsbC5jaGlsZHJlblswXS5jbGFzc0xpc3QuYWRkKCdjaG9zZW4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgY2VsbC5jbGFzc0xpc3QuYWRkKCdjaG9zZW4nKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAvL2NoYW5nZSBpbWcgc291cmNlXG4gICAgICAgICAgICAgICAgY2VsbC5jaGlsZHJlblswXS5zZXRBdHRyaWJ1dGUoJ3NyYycsIGltYWdlUGF0aCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9O1xuXG5cbiAgICAgICAgY29uc3QgX2NoYW5nZVN0YXRlRGlzcGxheSA9IGZ1bmN0aW9uIChtc2csIGRhdGEpIHtcbiAgICAgICAgICAgIGxldCB0ZXh0XG4gICAgICAgICAgICBpZiAobXNnID09ICd0dXJuLXBhc3NlZCcpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB7IG5hbWUsIG1hcmssIG5leHRQbGF5ZXIgfSA9IGRhdGE7XG4gICAgICAgICAgICAgICAgY29uc3Qgd2luID0gZ2FtZUJvYXJkLmNoZWNrV2luKG1hcmspO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRpZSA9IGdhbWVCb2FyZC5jaGVja1RpZSgpO1xuXG4gICAgICAgICAgICAgICAgLy9jaGFuZ2UgY2xhc3MgZm9yIGRpdjpob3ZlclxuICAgICAgICAgICAgICAgIF9nYW1lQ2VsbHMuZm9yRWFjaCgoY2VsbCkgPT4gY2VsbC5jbGFzc0xpc3QudG9nZ2xlKCdjaXJjbGUnKSk7XG5cbiAgICAgICAgICAgICAgICAvL2lmIHRoZSBuZXh0IHBsYXllciBpcyBBSVxuICAgICAgICAgICAgICAgIGlmIChuZXh0UGxheWVyLmhhc093blByb3BlcnR5KCdhZGRSYW5kb20nKSkge1xuICAgICAgICAgICAgICAgICAgICAvL3N0b3AgcGxheWVyIGZyb20gY2hvb3NpbmcgZm9yIHRoZW1cbiAgICAgICAgICAgICAgICAgICAgX2dhbWVDZWxscy5mb3JFYWNoKChjZWxsKSA9PiBjZWxsLmNsYXNzTGlzdC5hZGQoJ2Nob3NlbicpKVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICh3aW4pIHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dCA9IGAke25hbWV9IHdvbiFgXG4gICAgICAgICAgICAgICAgICAgIF9zdGF0ZURpc3BsYXkuc3R5bGUuY29sb3IgPSAndmFyKC0tY29sb3ItY29tcGxlbWVudGFyeTItZGFyayc7XG4gICAgICAgICAgICAgICAgICAgIF9kZWFjdGl2YXRlQ2VsbHMoKTtcbiAgICAgICAgICAgICAgICAgICAgX2RlYWN0aXZhdGVIb3ZlcigpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGllKSB7XG4gICAgICAgICAgICAgICAgICAgIF9zdGF0ZURpc3BsYXkuc3R5bGUuY29sb3IgPSAndmFyKC0tY29sb3ItY29tcGxlbWVudGFyeTEtZGFyayknO1xuICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gYEl0J3MgYSB0aWUhYFxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRleHQgPSBgJHtuZXh0UGxheWVyLmdldE5hbWUoKX0ncyB0dXJuYFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcGxheWVyMSA9IGRhdGFbJ3BsYXllcjEnXTtcbiAgICAgICAgICAgICAgICB0ZXh0ID0gYCR7cGxheWVyMS5nZXROYW1lKCl9J3MgdHVybmBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF9zdGF0ZURpc3BsYXkuaW5uZXJUZXh0ID0gdGV4dDtcbiAgICAgICAgfTtcblxuXG4gICAgICAgIC8vYWRkIGV2ZW50IGxpc3RlbmVycyB0byBjZWxscyB0byB1cGRhdGUgd2hlbiBwcmVzc2VkIGJ5IHBsYXllclxuICAgICAgICBjb25zdCBfYWN0aXZhdGVDZWxscyA9ICgpID0+IHtcbiAgICAgICAgICAgIF9nYW1lQ2VsbHMuZm9yRWFjaChcbiAgICAgICAgICAgICAgICAoY2VsbCkgPT4gY2VsbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIF9jZWxsTGlzdGVuZXJGdW5jKSlcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBfZGVhY3RpdmF0ZUNlbGxzID0gKCkgPT4ge1xuICAgICAgICAgICAgX2dhbWVDZWxscy5mb3JFYWNoKFxuICAgICAgICAgICAgICAgIChjZWxsKSA9PiBjZWxsLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgX2NlbGxMaXN0ZW5lckZ1bmMpKVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgX2RlYWN0aXZhdGVIb3ZlciA9ICgpID0+IHtcbiAgICAgICAgICAgIF9nYW1lQ2VsbHMuZm9yRWFjaCgoY2VsbCkgPT4gY2VsbC5jbGFzc0xpc3QuYWRkKCdjaG9zZW4nKSlcbiAgICAgICAgfVxuXG4gICAgICAgIFB1YlN1Yi5zdWJzY3JpYmUoJ21hcmstYWRkZWQnLCBfcmVuZGVyKTtcbiAgICAgICAgUHViU3ViLnN1YnNjcmliZSgnZ2FtZS1zdGFydCcsIF9yZXN0YXJ0Q2VsbHMpO1xuICAgICAgICBQdWJTdWIuc3Vic2NyaWJlKCdnYW1lLXN0YXJ0JywgX2FjdGl2YXRlQ2VsbHMpO1xuICAgICAgICBQdWJTdWIuc3Vic2NyaWJlKCdnYW1lLXN0YXJ0JywgX2NoYW5nZVN0YXRlRGlzcGxheSk7XG4gICAgICAgIFB1YlN1Yi5zdWJzY3JpYmUoJ2dhbWUtc3RhcnQnLCBfcmVuZGVyKTtcbiAgICAgICAgUHViU3ViLnN1YnNjcmliZSgnYWktdHVybi1zdGFydCcsIF9kZWFjdGl2YXRlSG92ZXIpO1xuICAgICAgICBQdWJTdWIuc3Vic2NyaWJlKCdhaS10dXJuLXN0YXJ0JywgX2RlYWN0aXZhdGVDZWxscylcbiAgICAgICAgUHViU3ViLnN1YnNjcmliZSgnYWktdHVybi1lbmQnLCBfYWN0aXZhdGVDZWxscyk7XG5cbiAgICAgICAgUHViU3ViLnN1YnNjcmliZSgndHVybi1wYXNzZWQnLCBfY2hhbmdlU3RhdGVEaXNwbGF5KTtcblxuICAgIH0pKCk7XG5cbi8vZmFjdG9yeSBmdW5jdGlvbiB0byBjcmVhdGUgYSBwbGF5ZXJcbmNvbnN0IFBsYXllciA9IGZ1bmN0aW9uIChuYW1lLCBtYXJrKSB7XG4gICAgY29uc3QgX21hcmsgPSBtYXJrO1xuXG4gICAgY29uc3QgYWRkTWFyayA9IGZ1bmN0aW9uIChjZWxsTnVtKSB7Ly9hZGRzIGEgbWFyayBvbiBnYW1lQm9hcmRcbiAgICAgICAgUHViU3ViLnB1Ymxpc2goJ21hcmstYWRkZWQnLCB7IGNlbGxOdW0sIG1hcms6IF9tYXJrLCBuYW1lIH0pXG4gICAgfVxuXG4gICAgY29uc3QgZ2V0TmFtZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5hbWVcbiAgICB9XG5cbiAgICBjb25zdCBnZXRNYXJrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gX21hcmtcbiAgICB9XG5cbiAgICByZXR1cm4geyBhZGRNYXJrLCBnZXROYW1lLCBnZXRNYXJrIH1cbn1cblxuY29uc3QgQUlQbGF5ZXIgPSBmdW5jdGlvbiAobmFtZSwgbWFyaywgZGlmZmljdWx0eSkge1xuICAgIC8vaW5oZXJpdCBmcm9tIFBsYXllclxuICAgIGNvbnN0IHByb3RvdHlwZSA9IFBsYXllcihuYW1lLCBtYXJrKTtcbiAgICBjb25zdCBfQUlNYXJrID0gbWFyaztcblxuICAgIGNvbnN0IF9leHRyYWN0RW1wdHlJbmRleGVzID0gKGJvYXJkKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGJvYXJkLnJlZHVjZSgoYWNjLCBjZWxsLCBpKSA9PiB7XG4gICAgICAgICAgICBpZiAoY2VsbCA9PT0gJycgfHwgdHlwZW9mIChjZWxsKSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICBhY2MucHVzaChpKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFjY1xuICAgICAgICB9LCBbXSlcbiAgICAgICAgcmV0dXJuIHJlc3VsdFxuICAgIH1cblxuICAgIC8vbmV3IG1ldGhvZHNcbiAgICBjb25zdCBhZGRSYW5kb20gPSAoKSA9PiB7XG4gICAgICAgIC8vY2hlY2sgd2hpY2ggY2VsbHMgYXJlIGVtcHR5IGFuZCBleHRyYWN0IHRoZWlyIGluZGV4ZXNcbiAgICAgICAgY29uc3QgZW1wdHlDZWxsc0luZGV4ZXMgPSBfZXh0cmFjdEVtcHR5SW5kZXhlcyhnYW1lQm9hcmQuZ2V0Qm9hcmQoKSlcbiAgICAgICAgLy9jaG9vc2UgYXQgcmFuZG9tIGZyb20gdGhvc2UgaW5kZXhlc1xuICAgICAgICBjb25zdCByYW5kb21FbXB0eUluZGV4ID0gZW1wdHlDZWxsc0luZGV4ZXNbXG4gICAgICAgICAgICBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBlbXB0eUNlbGxzSW5kZXhlcy5sZW5ndGgpXG4gICAgICAgIF1cbiAgICAgICAgLy9hZGQgbWFyayB0aGVyZSBhZnRlciByYW5kb20gZGVsYXlcbiAgICAgICAgUHViU3ViLnB1Ymxpc2goJ2FpLXR1cm4tZW5kJyk7XG4gICAgICAgIC8veWEgZGlzcGxheUNvbnRyb2xsZXIuYWN0aXZhdGVDZWxscygpO1xuICAgICAgICBwcm90b3R5cGUuYWRkTWFyayhyYW5kb21FbXB0eUluZGV4KVxuXG4gICAgfTtcblxuICAgIGNvbnN0IGFkZE1pbmlNYXggPSAoKSA9PiB7XG4gICAgICAgIC8vT3JpZ2luYWwgYWxnb3JpdGhtIGltcGxlbWVudGF0aW9uIGJ5IEFobWFuZCBBQmRvbHNhaGViXG4gICAgICAgIC8vaHR0cHM6Ly93d3cuZnJlZWNvZGVjYW1wLm9yZy9uZXdzL2hvdy10by1tYWtlLXlvdXItdGljLXRhYy10b2UtZ2FtZS11bmJlYXRhYmxlLWJ5LXVzaW5nLXRoZS1taW5pbWF4LWFsZ29yaXRobS05ZDY5MGJhZDRiMzcvXG4gICAgICAgIGNvbnN0IF9odW1hbk1hcmsgPSBtYXJrID09PSAneCcgPyAnMCcgOiAneCc7XG5cbiAgICAgICAgY29uc3QgX2luaXRpYWxCb2FyZCA9IGdhbWVCb2FyZC5nZXRCb2FyZCgpLm1hcCgoeCwgaSkgPT4ge1xuICAgICAgICAgICAgaWYgKHggPT0gJycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geFxuICAgICAgICAgICAgfVxuICAgICAgICB9KS8vY29weSBhcnJheVxuXG4gICAgICAgIGNvbnN0IG1pbmlNYXggPSBmdW5jdGlvbiAobmV3TWFyayA9IF9BSU1hcmssIG5ld0JvYXJkID0gX2luaXRpYWxCb2FyZCkge1xuICAgICAgICAgICAgY29uc3QgZW1wdHlDZWxsc0luZGV4ZXMgPSBfZXh0cmFjdEVtcHR5SW5kZXhlcyhuZXdCb2FyZCk7XG4gICAgICAgICAgICBjb25zdCBfb3Bwb25lbnRNYXJrID0gbmV3TWFyayA9PSAneCcgPyAnMCcgOiAneCc7XG5cbiAgICAgICAgICAgIGlmIChnYW1lQm9hcmQuY2hlY2tXaW4oX2h1bWFuTWFyaywgbmV3Qm9hcmQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc2NvcmU6IC0xMCB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGdhbWVCb2FyZC5jaGVja1dpbihfQUlNYXJrLCBuZXdCb2FyZCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzY29yZTogMTAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChlbXB0eUNlbGxzSW5kZXhlcy5sZW5ndGggPT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHNjb3JlOiAwIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIGFuIGFycmF5IHRvIGNvbGxlY3QgYWxsIHRoZSBvYmplY3RzXG4gICAgICAgICAgICBsZXQgbW92ZXMgPSBbXTtcblxuICAgICAgICAgICAgLy8gbG9vcCB0aHJvdWdoIGF2YWlsYWJsZSBzcG90c1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbXB0eUNlbGxzSW5kZXhlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIC8vY3JlYXRlIGFuIG9iamVjdCBmb3IgZWFjaCBhbmQgc3RvcmUgdGhlIGluZGV4IG9mIHRoYXQgc3BvdCBcbiAgICAgICAgICAgICAgICBsZXQgbW92ZSA9IHt9O1xuICAgICAgICAgICAgICAgIG1vdmUuaW5kZXggPSBuZXdCb2FyZFtlbXB0eUNlbGxzSW5kZXhlc1tpXV07XG5cbiAgICAgICAgICAgICAgICAvLyBzZXQgdGhlIGVtcHR5IHNwb3QgdG8gdGhlIGN1cnJlbnQgcGxheWVyXG4gICAgICAgICAgICAgICAgbmV3Qm9hcmRbZW1wdHlDZWxsc0luZGV4ZXNbaV1dID0gbmV3TWFyaztcblxuICAgICAgICAgICAgICAgIC8qY29sbGVjdCB0aGUgc2NvcmUgcmVzdWx0ZWQgZnJvbSBjYWxsaW5nIG1pbmltYXggXG4gICAgICAgICAgICAgICAgICBvbiB0aGUgb3Bwb25lbnQgb2YgdGhlIGN1cnJlbnQgcGxheWVyKi9cbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gbWluaU1heChfb3Bwb25lbnRNYXJrLCBuZXdCb2FyZC5tYXAoeCA9PiB4KSk7XG4gICAgICAgICAgICAgICAgbW92ZS5zY29yZSA9IHJlc3VsdC5zY29yZTtcblxuICAgICAgICAgICAgICAgIC8vIHJlc2V0IHRoZSBzcG90IHRvIGVtcHR5XG4gICAgICAgICAgICAgICAgbmV3Qm9hcmRbZW1wdHlDZWxsc0luZGV4ZXNbaV1dID0gbW92ZS5pbmRleDtcblxuICAgICAgICAgICAgICAgIC8vIHB1c2ggdGhlIG9iamVjdCB0byB0aGUgYXJyYXlcbiAgICAgICAgICAgICAgICBtb3Zlcy5wdXNoKG1vdmUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBpZiBpdCBpcyB0aGUgY29tcHV0ZXIncyB0dXJuIGxvb3Agb3ZlciB0aGUgbW92ZXMgYW5kIGNob29zZSB0aGUgbW92ZSB3aXRoIHRoZSBoaWdoZXN0IHNjb3JlXG4gICAgICAgICAgICBsZXQgYmVzdE1vdmU7XG5cbiAgICAgICAgICAgIGlmIChuZXdNYXJrID09PSBfQUlNYXJrKSB7XG4gICAgICAgICAgICAgICAgbGV0IGJlc3RTY29yZSA9IC0xMDAwMDtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IFtpLCBtb3ZlXSBvZiBtb3Zlcy5lbnRyaWVzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1vdmUuc2NvcmUgPiBiZXN0U2NvcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJlc3RTY29yZSA9IG1vdmUuc2NvcmU7XG4gICAgICAgICAgICAgICAgICAgICAgICBiZXN0TW92ZSA9IGk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobW92ZS5zY29yZSA9PT0gYmVzdFNjb3JlKSB7Ly9jaG9vc2UgYXQgcmFuZG9tIGlmIGl0cyB0aGUgc2FtZSBzY29yZVxuICAgICAgICAgICAgICAgICAgICAgICAgYmVzdFNjb3JlID0gbW92ZS5zY29yZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJlc3RNb3ZlID0gW2Jlc3RNb3ZlLCBpXVtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyKV1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAvLyBlbHNlIGxvb3Agb3ZlciB0aGUgbW92ZXMgYW5kIGNob29zZSB0aGUgbW92ZSB3aXRoIHRoZSBsb3dlc3Qgc2NvcmVcbiAgICAgICAgICAgICAgICBsZXQgYmVzdFNjb3JlID0gMTAwMDA7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBbaSwgbW92ZV0gb2YgbW92ZXMuZW50cmllcygpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtb3ZlLnNjb3JlIDwgYmVzdFNjb3JlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiZXN0U2NvcmUgPSBtb3ZlLnNjb3JlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYmVzdE1vdmUgPSBpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1vdmUuc2NvcmUgPT09IGJlc3RTY29yZSkgey8vY2hvb3NlIGF0IHJhbmRvbSBpZiBpdHMgdGhlIHNhbWUgc2NvcmVcbiAgICAgICAgICAgICAgICAgICAgICAgIGJlc3RTY29yZSA9IG1vdmUuc2NvcmU7XG4gICAgICAgICAgICAgICAgICAgICAgICBiZXN0TW92ZSA9IFtiZXN0TW92ZSwgaV1bTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMildXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbW92ZXNbYmVzdE1vdmVdXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBiZXN0TW92ZSA9IG1pbmlNYXgobWFyaywgX2luaXRpYWxCb2FyZCk7XG5cbiAgICAgICAgUHViU3ViLnB1Ymxpc2goJ2FpLXR1cm4tZW5kJyk7XG4gICAgICAgIHByb3RvdHlwZS5hZGRNYXJrKGJlc3RNb3ZlLmluZGV4KTtcbiAgICB9O1xuXG4gICAgY29uc3QgZ2V0RGlmZmljdWx0eSA9ICgpID0+IHtcbiAgICAgICAgcmV0dXJuIGRpZmZpY3VsdHk7XG4gICAgfVxuICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCBwcm90b3R5cGUsIHsgYWRkUmFuZG9tLCBhZGRNaW5pTWF4LCBnZXREaWZmaWN1bHR5IH0pXG59XG5cbi8vbWFuYWdlcyB0aGUgZmxvdyBvZiB0aGUgZ2FtZS5cbmNvbnN0IGdhbWUgPSAoZnVuY3Rpb24gKCkge1xuICAgIGxldCBjb3VudGVyID0gMDtcbiAgICBsZXQgX3BsYXllcjE7XG4gICAgbGV0IF9wbGF5ZXIyO1xuXG4gICAgY29uc3QgZ2V0UGxheWVyMSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIF9wbGF5ZXIxXG4gICAgfVxuXG4gICAgY29uc3QgZ2V0UGxheWVyMiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIF9wbGF5ZXIyXG4gICAgfVxuXG4gICAgY29uc3QgX3N0YXJ0ID0gZnVuY3Rpb24gKG1zZywgZGF0YSkge1xuICAgICAgICBjb3VudGVyID0gMDtcbiAgICAgICAgLy93aGVuIHJlc3RhcnRpbmcsIGxlYXZlIHNhbWUgcGxheWVyc1xuICAgICAgICBfcGxheWVyMSA9IGRhdGFbJ3BsYXllcjEnXSA/IGRhdGFbJ3BsYXllcjEnXSA6IF9wbGF5ZXIxO1xuICAgICAgICBfcGxheWVyMiA9IGRhdGFbJ3BsYXllcjInXSA/IGRhdGFbJ3BsYXllcjInXSA6IF9wbGF5ZXIyO1xuICAgICAgICAvL2lmIHRoZSBmaXJzdCBwbGF5ZXIgaXMgQUkgbWFrZSBpdCBwbGF5XG4gICAgICAgIF9wbGF5QUkoX3BsYXllcjEsIF9wbGF5ZXIyKTtcbiAgICB9O1xuXG4gICAgY29uc3QgX3B1Ymxpc2hUdXJuUGFzc2VkID0gZnVuY3Rpb24gKG5hbWUsIG1hcmssIG5leHRQbGF5ZXIpIHtcbiAgICAgICAgUHViU3ViLnB1Ymxpc2goJ3R1cm4tcGFzc2VkJywgeyBuYW1lLCBtYXJrLCBuZXh0UGxheWVyIH0pXG4gICAgfVxuXG4gICAgLy9wbGF5cyBhIHR1cm5cbiAgICBjb25zdCBfdHVybiA9IGZ1bmN0aW9uIChtc2csIGRhdGEpIHtcbiAgICAgICAgY29uc3QgY2VsbE51bSA9IGRhdGFcbiAgICAgICAgLy9hbHRlcm5hdGUgdHVybnMgYmV0d2VlbiBwbGF5ZXJzXG4gICAgICAgIGlmIChjb3VudGVyICUgMiA9PSAwKSB7XG4gICAgICAgICAgICBfcGxheWVyMS5hZGRNYXJrKGNlbGxOdW0pO1xuICAgICAgICAgICAgX3B1Ymxpc2hUdXJuUGFzc2VkKF9wbGF5ZXIxLmdldE5hbWUoKSwgX3BsYXllcjEuZ2V0TWFyaygpLCBfcGxheWVyMik7XG4gICAgICAgICAgICBjb3VudGVyKytcbiAgICAgICAgICAgIC8vY2hlY2sgaWYgcGxheWVyMiBpcyBBSVxuICAgICAgICAgICAgX3BsYXlBSShfcGxheWVyMiwgX3BsYXllcjEpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfcGxheWVyMi5hZGRNYXJrKGNlbGxOdW0pO1xuICAgICAgICAgICAgX3B1Ymxpc2hUdXJuUGFzc2VkKF9wbGF5ZXIyLmdldE5hbWUoKSwgX3BsYXllcjIuZ2V0TWFyaygpLCBfcGxheWVyMSk7XG4gICAgICAgICAgICBjb3VudGVyKytcbiAgICAgICAgICAgIC8vY2hlY2sgaWYgcGxheWVyMSBpcyBBSVxuICAgICAgICAgICAgX3BsYXlBSShfcGxheWVyMSwgX3BsYXllcjIpXG5cbiAgICAgICAgfTtcbiAgICB9XG5cblxuXG4gICAgY29uc3QgX3BsYXlBSSA9IGZ1bmN0aW9uIChwbGF5ZXIsIG5leHRQbGF5ZXIpIHtcbiAgICAgICAgY29uc3QgcmFuZG9tRGVsYXkgPSAoTWF0aC5yYW5kb20oKSAqIDEwMDApICsgNTAwO1xuICAgICAgICBQdWJTdWIucHVibGlzaCgnYWktdHVybi1zdGFydCcsICcnKTtcbiAgICAgICAgLy9kZWxheSBhbGxvd3MgZm9yIGJvYXJkIHRvIHVwZGF0ZSwgXG4gICAgICAgIC8vbmVlZGVkIGZvciBsb29rdXAgaW4gYWRkTWluaU1heCBhbmQgZm9yIGNoZWNrV2luc1xuICAgICAgICBzZXRUaW1lb3V0KCAoKSA9PiB7XG4gICAgICAgIC8vY2hlY2sgaWYgcGxheWVyIGlzIEFJXG4gICAgICAgIGlmIChwbGF5ZXIuaGFzT3duUHJvcGVydHkoJ2FkZFJhbmRvbScpICYmICFnYW1lQm9hcmQuY2hlY2tXaW4oJ3gnKSAmJiAhZ2FtZUJvYXJkLmNoZWNrV2luKCcwJykpIHtcbiAgICAgICAgICAgIGlmIChwbGF5ZXIuZ2V0RGlmZmljdWx0eSgpID09ICdoYXJkJykge1xuICAgICAgICAgICAgICAgICAgICBwbGF5ZXIuYWRkTWluaU1heCgpO1xuICAgICAgICAgICAgfSBlbHNlIHsgLy9pZiBpdCdzIGVhc3kgZGlmZmljdWx0eVxuICAgICAgICAgICAgICAgICAgICBwbGF5ZXIuYWRkUmFuZG9tKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF9wdWJsaXNoVHVyblBhc3NlZChwbGF5ZXIuZ2V0TmFtZSgpLCBwbGF5ZXIuZ2V0TWFyaygpLCBuZXh0UGxheWVyKVxuICAgICAgICAgICAgY291bnRlcisrXG4gICAgICAgIH1cbiAgICB9KVxuICAgIH1cblxuICAgIFB1YlN1Yi5zdWJzY3JpYmUoJ2dhbWUtc3RhcnQnLCBfc3RhcnQpO1xuICAgIFB1YlN1Yi5zdWJzY3JpYmUoJ2NlbGwtcHJlc3NlZCcsIF90dXJuKTtcblxuICAgIHJldHVybiB7IGdldFBsYXllcjEsIGdldFBsYXllcjIgfVxufVxuKSgpIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9