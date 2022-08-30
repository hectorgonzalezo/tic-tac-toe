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


const gameBoard = (
    function () {
        let _board = new Array(9).fill('');

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
            const {cellNum, mark} = data;

            if (_board[cellNum] == '') {//don't update if cell has already been played
                _board[cellNum] = mark;

                //ya! displayController.render(_board, cellNum);
                //ya! displayController.changeStateDisplay(name, checkWin(mark), _checkTie())
            };
        }
        //subscribe to event triggered when player adds a mark
        pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('mark-added', _update)

        const _restart = function () {
            _board = new Array(9).fill('');
            //ya displayController.render(_board)
        }

        pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('game-restart', _restart)

        const getBoard = () => {
            return _board
        }
        return { checkTie, checkWin, getBoard }
    }
)();

const popUp = (
    function(){
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

                    pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publish('game-start', {player1, player2})
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
            pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publish('cell-pressed', parseInt(this.getAttribute('data')))
        };


        //restart with button
        _restartButton.addEventListener('click', () => {
            _stateDisplay.style.color = '';
            //ya game.restart()
            pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publish('game-restart','');
        });


        const _restartCells = function () {
            _gameCells.forEach((cell) => {
                cell.children[0].classList.remove('chosen');
                cell.classList.remove('chosen');
                cell.classList.remove('circle')
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
            if (msg == 'mark-added') {
            const {name, mark} = data;
            const win = gameBoard.checkWin(mark);
            const tie = gameBoard.checkTie();

            
            //get the other player to post whose turn is next
            const nextPlayer = game.getPlayer1['name'] == name ?
                game.getPlayer2() :
                game.getPlayer1();
            
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
            } else if (tie) {
                _stateDisplay.style.color = 'var(--color-complementary1-dark)';
                text = `It's a tie!`
            } else {
                text = `${nextPlayer.getName()}'s turn`
            }
        } else 
        {
            console.log(data)
            text = `${data['player2'].getName()}'s turn` 
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
            _gameCells.forEach( (cell) => cell.classList.add('chosen'))
        }

        pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('mark-added', _render);
        pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('mark-added', _changeStateDisplay);
        pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('game-start',  _restartCells);
        pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('game-start', _activateCells);
        pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('game-start', _changeStateDisplay);
        pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('game-start', _render);
        pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('ai-turn-start', _deactivateHover);
        pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('ai-turn-start', _deactivateCells)
        pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('ai-turn-end', _activateCells);
        pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('game-restart', _render)

    })();

//factory function to create a player
const Player = function (name, mark) {
    const _mark = mark;

    const addMark = function (cellNum) {//adds a mark on gameBoard
        pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publish('mark-added', {cellNum, mark:_mark, name})
    }

    const getName = function () {
        return name
    }


    return { addMark, getName }
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
        const randomDelay = (Math.random() * 1000) + 500;
        setTimeout(() => {
            pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publish('ai-turn-end');
            //ya displayController.activateCells();
            prototype.addMark(randomEmptyIndex)
        },
            randomDelay);
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

        //add mark there after random delay
        const randomDelay = (Math.random() * 500) + 500;
        setTimeout(() => {
            pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publish('ai-turn-end');
            //ya displayController.activateCells();
            prototype.addMark(bestMove.index)
        }, randomDelay);
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

    const getPlayer1 = function() {
        return _player1
    }

    const getPlayer2 = function() {
        return _player2
    }

    const _start = function(msg, data) {
        //when restarting, leave same players
        _player1 = data['player1'] ? data['player1'] : _player1;
        _player2 = data['player2'] ? data['player2'] : _player2;
        counter = 0;
        //ya displayController.restartCells();
        //ya displayController.changeStateDisplay(this.player2.getName())
        //ya displayController.activateCells();
        //if the first player is AI make it play
        _playAI(_player1);
        //no! if(!_player1.hasOwnProperty('addRandom')){
        // displayController.render(gameBoard.getBoard())
        // }
    };

    pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('game-start', _start);

    //plays a turn
    const _turn = function (msg, data) {
        const cellNum = data
        //alternate turns between players
        if (counter % 2 == 0) {
            _player1.addMark(cellNum);
            counter++
            //check if player2 is AI
            _playAI(_player2)
        } else {
            _player2.addMark(cellNum);
            counter++
            //check if player1 is AI
            _playAI(_player1)

        }
        
    }

    pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('cell-pressed', _turn)

    const _playAI = function (player) {
        //check if player is AI
        if (player.hasOwnProperty('addRandom') && !gameBoard.checkWin('x') && !gameBoard.checkWin('0')) {
            if (counter == 0) {
                console.log('startai')
                //ya displayController.deactivateHover();
                pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publish('ai-turn-start', '')
            }
            //sends the current board so that AI can choose from empty cells
            if (player.getDifficulty() == 'hard') {
                player.addMiniMax();
            } else { //if it's easy difficulty
                player.addRandom()
            }
            counter++
        }
    }

    pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('game-restart', _start)

    return {getPlayer1, getPlayer2 }
}
)()


})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFZLHdEQUFjO0FBQzFCO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLGVBQWUsc0NBQXNDO0FBQ2hGOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLElBQUksMERBQWdCOztBQUVwQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBLElBQUksMERBQWdCOztBQUVwQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnQkFBZ0Isd0RBQWM7QUFDOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFjLE9BQU87QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxJQUFJLDBEQUFnQjs7QUFFcEIsWUFBWTtBQUNaO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly90aWMtdGFjLXRvZS8uL25vZGVfbW9kdWxlcy9wdWJzdWItanMvc3JjL3B1YnN1Yi5qcyIsIndlYnBhY2s6Ly90aWMtdGFjLXRvZS93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly90aWMtdGFjLXRvZS93ZWJwYWNrL3J1bnRpbWUvY29tcGF0IGdldCBkZWZhdWx0IGV4cG9ydCIsIndlYnBhY2s6Ly90aWMtdGFjLXRvZS93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vdGljLXRhYy10b2Uvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly90aWMtdGFjLXRvZS93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL3RpYy10YWMtdG9lL3dlYnBhY2svcnVudGltZS9ub2RlIG1vZHVsZSBkZWNvcmF0b3IiLCJ3ZWJwYWNrOi8vdGljLXRhYy10b2UvLi9zY3JpcHQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTAsMjAxMSwyMDEyLDIwMTMsMjAxNCBNb3JnYW4gUm9kZXJpY2sgaHR0cDovL3JvZGVyaWNrLmRrXG4gKiBMaWNlbnNlOiBNSVQgLSBodHRwOi8vbXJnbnJkcmNrLm1pdC1saWNlbnNlLm9yZ1xuICpcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9tcm9kZXJpY2svUHViU3ViSlNcbiAqL1xuXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3Rvcnkpe1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBQdWJTdWIgPSB7fTtcblxuICAgIGlmIChyb290LlB1YlN1Yikge1xuICAgICAgICBQdWJTdWIgPSByb290LlB1YlN1YjtcbiAgICAgICAgY29uc29sZS53YXJuKFwiUHViU3ViIGFscmVhZHkgbG9hZGVkLCB1c2luZyBleGlzdGluZyB2ZXJzaW9uXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJvb3QuUHViU3ViID0gUHViU3ViO1xuICAgICAgICBmYWN0b3J5KFB1YlN1Yik7XG4gICAgfVxuICAgIC8vIENvbW1vbkpTIGFuZCBOb2RlLmpzIG1vZHVsZSBzdXBwb3J0XG4gICAgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jyl7XG4gICAgICAgIGlmIChtb2R1bGUgIT09IHVuZGVmaW5lZCAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgICAgICAgZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gUHViU3ViOyAvLyBOb2RlLmpzIHNwZWNpZmljIGBtb2R1bGUuZXhwb3J0c2BcbiAgICAgICAgfVxuICAgICAgICBleHBvcnRzLlB1YlN1YiA9IFB1YlN1YjsgLy8gQ29tbW9uSlMgbW9kdWxlIDEuMS4xIHNwZWNcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gUHViU3ViOyAvLyBDb21tb25KU1xuICAgIH1cbiAgICAvLyBBTUQgc3VwcG9ydFxuICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLXVuZGVmICovXG4gICAgZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKXtcbiAgICAgICAgZGVmaW5lKGZ1bmN0aW9uKCkgeyByZXR1cm4gUHViU3ViOyB9KTtcbiAgICAgICAgLyogZXNsaW50LWVuYWJsZSBuby11bmRlZiAqL1xuICAgIH1cblxufSgoIHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnICYmIHdpbmRvdyApIHx8IHRoaXMsIGZ1bmN0aW9uIChQdWJTdWIpe1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBtZXNzYWdlcyA9IHt9LFxuICAgICAgICBsYXN0VWlkID0gLTEsXG4gICAgICAgIEFMTF9TVUJTQ1JJQklOR19NU0cgPSAnKic7XG5cbiAgICBmdW5jdGlvbiBoYXNLZXlzKG9iail7XG4gICAgICAgIHZhciBrZXk7XG5cbiAgICAgICAgZm9yIChrZXkgaW4gb2JqKXtcbiAgICAgICAgICAgIGlmICggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSApe1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCB0aHJvd3MgdGhlIHBhc3NlZCBleGNlcHRpb24sIGZvciB1c2UgYXMgYXJndW1lbnQgZm9yIHNldFRpbWVvdXRcbiAgICAgKiBAYWxpYXMgdGhyb3dFeGNlcHRpb25cbiAgICAgKiBAZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0geyBPYmplY3QgfSBleCBBbiBFcnJvciBvYmplY3RcbiAgICAgKi9cbiAgICBmdW5jdGlvbiB0aHJvd0V4Y2VwdGlvbiggZXggKXtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIHJlVGhyb3dFeGNlcHRpb24oKXtcbiAgICAgICAgICAgIHRocm93IGV4O1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNhbGxTdWJzY3JpYmVyV2l0aERlbGF5ZWRFeGNlcHRpb25zKCBzdWJzY3JpYmVyLCBtZXNzYWdlLCBkYXRhICl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBzdWJzY3JpYmVyKCBtZXNzYWdlLCBkYXRhICk7XG4gICAgICAgIH0gY2F0Y2goIGV4ICl7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCB0aHJvd0V4Y2VwdGlvbiggZXggKSwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjYWxsU3Vic2NyaWJlcldpdGhJbW1lZGlhdGVFeGNlcHRpb25zKCBzdWJzY3JpYmVyLCBtZXNzYWdlLCBkYXRhICl7XG4gICAgICAgIHN1YnNjcmliZXIoIG1lc3NhZ2UsIGRhdGEgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkZWxpdmVyTWVzc2FnZSggb3JpZ2luYWxNZXNzYWdlLCBtYXRjaGVkTWVzc2FnZSwgZGF0YSwgaW1tZWRpYXRlRXhjZXB0aW9ucyApe1xuICAgICAgICB2YXIgc3Vic2NyaWJlcnMgPSBtZXNzYWdlc1ttYXRjaGVkTWVzc2FnZV0sXG4gICAgICAgICAgICBjYWxsU3Vic2NyaWJlciA9IGltbWVkaWF0ZUV4Y2VwdGlvbnMgPyBjYWxsU3Vic2NyaWJlcldpdGhJbW1lZGlhdGVFeGNlcHRpb25zIDogY2FsbFN1YnNjcmliZXJXaXRoRGVsYXllZEV4Y2VwdGlvbnMsXG4gICAgICAgICAgICBzO1xuXG4gICAgICAgIGlmICggIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCggbWVzc2FnZXMsIG1hdGNoZWRNZXNzYWdlICkgKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHMgaW4gc3Vic2NyaWJlcnMpe1xuICAgICAgICAgICAgaWYgKCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc3Vic2NyaWJlcnMsIHMpKXtcbiAgICAgICAgICAgICAgICBjYWxsU3Vic2NyaWJlciggc3Vic2NyaWJlcnNbc10sIG9yaWdpbmFsTWVzc2FnZSwgZGF0YSApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlRGVsaXZlcnlGdW5jdGlvbiggbWVzc2FnZSwgZGF0YSwgaW1tZWRpYXRlRXhjZXB0aW9ucyApe1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gZGVsaXZlck5hbWVzcGFjZWQoKXtcbiAgICAgICAgICAgIHZhciB0b3BpYyA9IFN0cmluZyggbWVzc2FnZSApLFxuICAgICAgICAgICAgICAgIHBvc2l0aW9uID0gdG9waWMubGFzdEluZGV4T2YoICcuJyApO1xuXG4gICAgICAgICAgICAvLyBkZWxpdmVyIHRoZSBtZXNzYWdlIGFzIGl0IGlzIG5vd1xuICAgICAgICAgICAgZGVsaXZlck1lc3NhZ2UobWVzc2FnZSwgbWVzc2FnZSwgZGF0YSwgaW1tZWRpYXRlRXhjZXB0aW9ucyk7XG5cbiAgICAgICAgICAgIC8vIHRyaW0gdGhlIGhpZXJhcmNoeSBhbmQgZGVsaXZlciBtZXNzYWdlIHRvIGVhY2ggbGV2ZWxcbiAgICAgICAgICAgIHdoaWxlKCBwb3NpdGlvbiAhPT0gLTEgKXtcbiAgICAgICAgICAgICAgICB0b3BpYyA9IHRvcGljLnN1YnN0ciggMCwgcG9zaXRpb24gKTtcbiAgICAgICAgICAgICAgICBwb3NpdGlvbiA9IHRvcGljLmxhc3RJbmRleE9mKCcuJyk7XG4gICAgICAgICAgICAgICAgZGVsaXZlck1lc3NhZ2UoIG1lc3NhZ2UsIHRvcGljLCBkYXRhLCBpbW1lZGlhdGVFeGNlcHRpb25zICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRlbGl2ZXJNZXNzYWdlKG1lc3NhZ2UsIEFMTF9TVUJTQ1JJQklOR19NU0csIGRhdGEsIGltbWVkaWF0ZUV4Y2VwdGlvbnMpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhhc0RpcmVjdFN1YnNjcmliZXJzRm9yKCBtZXNzYWdlICkge1xuICAgICAgICB2YXIgdG9waWMgPSBTdHJpbmcoIG1lc3NhZ2UgKSxcbiAgICAgICAgICAgIGZvdW5kID0gQm9vbGVhbihPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoIG1lc3NhZ2VzLCB0b3BpYyApICYmIGhhc0tleXMobWVzc2FnZXNbdG9waWNdKSk7XG5cbiAgICAgICAgcmV0dXJuIGZvdW5kO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1lc3NhZ2VIYXNTdWJzY3JpYmVycyggbWVzc2FnZSApe1xuICAgICAgICB2YXIgdG9waWMgPSBTdHJpbmcoIG1lc3NhZ2UgKSxcbiAgICAgICAgICAgIGZvdW5kID0gaGFzRGlyZWN0U3Vic2NyaWJlcnNGb3IodG9waWMpIHx8IGhhc0RpcmVjdFN1YnNjcmliZXJzRm9yKEFMTF9TVUJTQ1JJQklOR19NU0cpLFxuICAgICAgICAgICAgcG9zaXRpb24gPSB0b3BpYy5sYXN0SW5kZXhPZiggJy4nICk7XG5cbiAgICAgICAgd2hpbGUgKCAhZm91bmQgJiYgcG9zaXRpb24gIT09IC0xICl7XG4gICAgICAgICAgICB0b3BpYyA9IHRvcGljLnN1YnN0ciggMCwgcG9zaXRpb24gKTtcbiAgICAgICAgICAgIHBvc2l0aW9uID0gdG9waWMubGFzdEluZGV4T2YoICcuJyApO1xuICAgICAgICAgICAgZm91bmQgPSBoYXNEaXJlY3RTdWJzY3JpYmVyc0Zvcih0b3BpYyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZm91bmQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHVibGlzaCggbWVzc2FnZSwgZGF0YSwgc3luYywgaW1tZWRpYXRlRXhjZXB0aW9ucyApe1xuICAgICAgICBtZXNzYWdlID0gKHR5cGVvZiBtZXNzYWdlID09PSAnc3ltYm9sJykgPyBtZXNzYWdlLnRvU3RyaW5nKCkgOiBtZXNzYWdlO1xuXG4gICAgICAgIHZhciBkZWxpdmVyID0gY3JlYXRlRGVsaXZlcnlGdW5jdGlvbiggbWVzc2FnZSwgZGF0YSwgaW1tZWRpYXRlRXhjZXB0aW9ucyApLFxuICAgICAgICAgICAgaGFzU3Vic2NyaWJlcnMgPSBtZXNzYWdlSGFzU3Vic2NyaWJlcnMoIG1lc3NhZ2UgKTtcblxuICAgICAgICBpZiAoICFoYXNTdWJzY3JpYmVycyApe1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBzeW5jID09PSB0cnVlICl7XG4gICAgICAgICAgICBkZWxpdmVyKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCBkZWxpdmVyLCAwICk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUHVibGlzaGVzIHRoZSBtZXNzYWdlLCBwYXNzaW5nIHRoZSBkYXRhIHRvIGl0J3Mgc3Vic2NyaWJlcnNcbiAgICAgKiBAZnVuY3Rpb25cbiAgICAgKiBAYWxpYXMgcHVibGlzaFxuICAgICAqIEBwYXJhbSB7IFN0cmluZyB9IG1lc3NhZ2UgVGhlIG1lc3NhZ2UgdG8gcHVibGlzaFxuICAgICAqIEBwYXJhbSB7fSBkYXRhIFRoZSBkYXRhIHRvIHBhc3MgdG8gc3Vic2NyaWJlcnNcbiAgICAgKiBAcmV0dXJuIHsgQm9vbGVhbiB9XG4gICAgICovXG4gICAgUHViU3ViLnB1Ymxpc2ggPSBmdW5jdGlvbiggbWVzc2FnZSwgZGF0YSApe1xuICAgICAgICByZXR1cm4gcHVibGlzaCggbWVzc2FnZSwgZGF0YSwgZmFsc2UsIFB1YlN1Yi5pbW1lZGlhdGVFeGNlcHRpb25zICk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFB1Ymxpc2hlcyB0aGUgbWVzc2FnZSBzeW5jaHJvbm91c2x5LCBwYXNzaW5nIHRoZSBkYXRhIHRvIGl0J3Mgc3Vic2NyaWJlcnNcbiAgICAgKiBAZnVuY3Rpb25cbiAgICAgKiBAYWxpYXMgcHVibGlzaFN5bmNcbiAgICAgKiBAcGFyYW0geyBTdHJpbmcgfSBtZXNzYWdlIFRoZSBtZXNzYWdlIHRvIHB1Ymxpc2hcbiAgICAgKiBAcGFyYW0ge30gZGF0YSBUaGUgZGF0YSB0byBwYXNzIHRvIHN1YnNjcmliZXJzXG4gICAgICogQHJldHVybiB7IEJvb2xlYW4gfVxuICAgICAqL1xuICAgIFB1YlN1Yi5wdWJsaXNoU3luYyA9IGZ1bmN0aW9uKCBtZXNzYWdlLCBkYXRhICl7XG4gICAgICAgIHJldHVybiBwdWJsaXNoKCBtZXNzYWdlLCBkYXRhLCB0cnVlLCBQdWJTdWIuaW1tZWRpYXRlRXhjZXB0aW9ucyApO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTdWJzY3JpYmVzIHRoZSBwYXNzZWQgZnVuY3Rpb24gdG8gdGhlIHBhc3NlZCBtZXNzYWdlLiBFdmVyeSByZXR1cm5lZCB0b2tlbiBpcyB1bmlxdWUgYW5kIHNob3VsZCBiZSBzdG9yZWQgaWYgeW91IG5lZWQgdG8gdW5zdWJzY3JpYmVcbiAgICAgKiBAZnVuY3Rpb25cbiAgICAgKiBAYWxpYXMgc3Vic2NyaWJlXG4gICAgICogQHBhcmFtIHsgU3RyaW5nIH0gbWVzc2FnZSBUaGUgbWVzc2FnZSB0byBzdWJzY3JpYmUgdG9cbiAgICAgKiBAcGFyYW0geyBGdW5jdGlvbiB9IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGNhbGwgd2hlbiBhIG5ldyBtZXNzYWdlIGlzIHB1Ymxpc2hlZFxuICAgICAqIEByZXR1cm4geyBTdHJpbmcgfVxuICAgICAqL1xuICAgIFB1YlN1Yi5zdWJzY3JpYmUgPSBmdW5jdGlvbiggbWVzc2FnZSwgZnVuYyApe1xuICAgICAgICBpZiAoIHR5cGVvZiBmdW5jICE9PSAnZnVuY3Rpb24nKXtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIG1lc3NhZ2UgPSAodHlwZW9mIG1lc3NhZ2UgPT09ICdzeW1ib2wnKSA/IG1lc3NhZ2UudG9TdHJpbmcoKSA6IG1lc3NhZ2U7XG5cbiAgICAgICAgLy8gbWVzc2FnZSBpcyBub3QgcmVnaXN0ZXJlZCB5ZXRcbiAgICAgICAgaWYgKCAhT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKCBtZXNzYWdlcywgbWVzc2FnZSApICl7XG4gICAgICAgICAgICBtZXNzYWdlc1ttZXNzYWdlXSA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZm9yY2luZyB0b2tlbiBhcyBTdHJpbmcsIHRvIGFsbG93IGZvciBmdXR1cmUgZXhwYW5zaW9ucyB3aXRob3V0IGJyZWFraW5nIHVzYWdlXG4gICAgICAgIC8vIGFuZCBhbGxvdyBmb3IgZWFzeSB1c2UgYXMga2V5IG5hbWVzIGZvciB0aGUgJ21lc3NhZ2VzJyBvYmplY3RcbiAgICAgICAgdmFyIHRva2VuID0gJ3VpZF8nICsgU3RyaW5nKCsrbGFzdFVpZCk7XG4gICAgICAgIG1lc3NhZ2VzW21lc3NhZ2VdW3Rva2VuXSA9IGZ1bmM7XG5cbiAgICAgICAgLy8gcmV0dXJuIHRva2VuIGZvciB1bnN1YnNjcmliaW5nXG4gICAgICAgIHJldHVybiB0b2tlbjtcbiAgICB9O1xuXG4gICAgUHViU3ViLnN1YnNjcmliZUFsbCA9IGZ1bmN0aW9uKCBmdW5jICl7XG4gICAgICAgIHJldHVybiBQdWJTdWIuc3Vic2NyaWJlKEFMTF9TVUJTQ1JJQklOR19NU0csIGZ1bmMpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTdWJzY3JpYmVzIHRoZSBwYXNzZWQgZnVuY3Rpb24gdG8gdGhlIHBhc3NlZCBtZXNzYWdlIG9uY2VcbiAgICAgKiBAZnVuY3Rpb25cbiAgICAgKiBAYWxpYXMgc3Vic2NyaWJlT25jZVxuICAgICAqIEBwYXJhbSB7IFN0cmluZyB9IG1lc3NhZ2UgVGhlIG1lc3NhZ2UgdG8gc3Vic2NyaWJlIHRvXG4gICAgICogQHBhcmFtIHsgRnVuY3Rpb24gfSBmdW5jIFRoZSBmdW5jdGlvbiB0byBjYWxsIHdoZW4gYSBuZXcgbWVzc2FnZSBpcyBwdWJsaXNoZWRcbiAgICAgKiBAcmV0dXJuIHsgUHViU3ViIH1cbiAgICAgKi9cbiAgICBQdWJTdWIuc3Vic2NyaWJlT25jZSA9IGZ1bmN0aW9uKCBtZXNzYWdlLCBmdW5jICl7XG4gICAgICAgIHZhciB0b2tlbiA9IFB1YlN1Yi5zdWJzY3JpYmUoIG1lc3NhZ2UsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAvLyBiZWZvcmUgZnVuYyBhcHBseSwgdW5zdWJzY3JpYmUgbWVzc2FnZVxuICAgICAgICAgICAgUHViU3ViLnVuc3Vic2NyaWJlKCB0b2tlbiApO1xuICAgICAgICAgICAgZnVuYy5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gUHViU3ViO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDbGVhcnMgYWxsIHN1YnNjcmlwdGlvbnNcbiAgICAgKiBAZnVuY3Rpb25cbiAgICAgKiBAcHVibGljXG4gICAgICogQGFsaWFzIGNsZWFyQWxsU3Vic2NyaXB0aW9uc1xuICAgICAqL1xuICAgIFB1YlN1Yi5jbGVhckFsbFN1YnNjcmlwdGlvbnMgPSBmdW5jdGlvbiBjbGVhckFsbFN1YnNjcmlwdGlvbnMoKXtcbiAgICAgICAgbWVzc2FnZXMgPSB7fTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ2xlYXIgc3Vic2NyaXB0aW9ucyBieSB0aGUgdG9waWNcbiAgICAgKiBAZnVuY3Rpb25cbiAgICAgKiBAcHVibGljXG4gICAgICogQGFsaWFzIGNsZWFyQWxsU3Vic2NyaXB0aW9uc1xuICAgICAqIEByZXR1cm4geyBpbnQgfVxuICAgICAqL1xuICAgIFB1YlN1Yi5jbGVhclN1YnNjcmlwdGlvbnMgPSBmdW5jdGlvbiBjbGVhclN1YnNjcmlwdGlvbnModG9waWMpe1xuICAgICAgICB2YXIgbTtcbiAgICAgICAgZm9yIChtIGluIG1lc3NhZ2VzKXtcbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobWVzc2FnZXMsIG0pICYmIG0uaW5kZXhPZih0b3BpYykgPT09IDApe1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBtZXNzYWdlc1ttXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgICBDb3VudCBzdWJzY3JpcHRpb25zIGJ5IHRoZSB0b3BpY1xuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAYWxpYXMgY291bnRTdWJzY3JpcHRpb25zXG4gICAgICogQHJldHVybiB7IEFycmF5IH1cbiAgICAqL1xuICAgIFB1YlN1Yi5jb3VudFN1YnNjcmlwdGlvbnMgPSBmdW5jdGlvbiBjb3VudFN1YnNjcmlwdGlvbnModG9waWMpe1xuICAgICAgICB2YXIgbTtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgICAgIHZhciB0b2tlbjtcbiAgICAgICAgdmFyIGNvdW50ID0gMDtcbiAgICAgICAgZm9yIChtIGluIG1lc3NhZ2VzKSB7XG4gICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1lc3NhZ2VzLCBtKSAmJiBtLmluZGV4T2YodG9waWMpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgZm9yICh0b2tlbiBpbiBtZXNzYWdlc1ttXSkge1xuICAgICAgICAgICAgICAgICAgICBjb3VudCsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY291bnQ7XG4gICAgfTtcblxuXG4gICAgLyoqXG4gICAgICAgR2V0cyBzdWJzY3JpcHRpb25zIGJ5IHRoZSB0b3BpY1xuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAYWxpYXMgZ2V0U3Vic2NyaXB0aW9uc1xuICAgICovXG4gICAgUHViU3ViLmdldFN1YnNjcmlwdGlvbnMgPSBmdW5jdGlvbiBnZXRTdWJzY3JpcHRpb25zKHRvcGljKXtcbiAgICAgICAgdmFyIG07XG4gICAgICAgIHZhciBsaXN0ID0gW107XG4gICAgICAgIGZvciAobSBpbiBtZXNzYWdlcyl7XG4gICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1lc3NhZ2VzLCBtKSAmJiBtLmluZGV4T2YodG9waWMpID09PSAwKXtcbiAgICAgICAgICAgICAgICBsaXN0LnB1c2gobSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGxpc3Q7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgc3Vic2NyaXB0aW9uc1xuICAgICAqXG4gICAgICogLSBXaGVuIHBhc3NlZCBhIHRva2VuLCByZW1vdmVzIGEgc3BlY2lmaWMgc3Vic2NyaXB0aW9uLlxuICAgICAqXG5cdCAqIC0gV2hlbiBwYXNzZWQgYSBmdW5jdGlvbiwgcmVtb3ZlcyBhbGwgc3Vic2NyaXB0aW9ucyBmb3IgdGhhdCBmdW5jdGlvblxuICAgICAqXG5cdCAqIC0gV2hlbiBwYXNzZWQgYSB0b3BpYywgcmVtb3ZlcyBhbGwgc3Vic2NyaXB0aW9ucyBmb3IgdGhhdCB0b3BpYyAoaGllcmFyY2h5KVxuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAYWxpYXMgc3Vic2NyaWJlT25jZVxuICAgICAqIEBwYXJhbSB7IFN0cmluZyB8IEZ1bmN0aW9uIH0gdmFsdWUgQSB0b2tlbiwgZnVuY3Rpb24gb3IgdG9waWMgdG8gdW5zdWJzY3JpYmUgZnJvbVxuICAgICAqIEBleGFtcGxlIC8vIFVuc3Vic2NyaWJpbmcgd2l0aCBhIHRva2VuXG4gICAgICogdmFyIHRva2VuID0gUHViU3ViLnN1YnNjcmliZSgnbXl0b3BpYycsIG15RnVuYyk7XG4gICAgICogUHViU3ViLnVuc3Vic2NyaWJlKHRva2VuKTtcbiAgICAgKiBAZXhhbXBsZSAvLyBVbnN1YnNjcmliaW5nIHdpdGggYSBmdW5jdGlvblxuICAgICAqIFB1YlN1Yi51bnN1YnNjcmliZShteUZ1bmMpO1xuICAgICAqIEBleGFtcGxlIC8vIFVuc3Vic2NyaWJpbmcgZnJvbSBhIHRvcGljXG4gICAgICogUHViU3ViLnVuc3Vic2NyaWJlKCdteXRvcGljJyk7XG4gICAgICovXG4gICAgUHViU3ViLnVuc3Vic2NyaWJlID0gZnVuY3Rpb24odmFsdWUpe1xuICAgICAgICB2YXIgZGVzY2VuZGFudFRvcGljRXhpc3RzID0gZnVuY3Rpb24odG9waWMpIHtcbiAgICAgICAgICAgICAgICB2YXIgbTtcbiAgICAgICAgICAgICAgICBmb3IgKCBtIGluIG1lc3NhZ2VzICl7XG4gICAgICAgICAgICAgICAgICAgIGlmICggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1lc3NhZ2VzLCBtKSAmJiBtLmluZGV4T2YodG9waWMpID09PSAwICl7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhIGRlc2NlbmRhbnQgb2YgdGhlIHRvcGljIGV4aXN0czpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzVG9waWMgICAgPSB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnICYmICggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1lc3NhZ2VzLCB2YWx1ZSkgfHwgZGVzY2VuZGFudFRvcGljRXhpc3RzKHZhbHVlKSApLFxuICAgICAgICAgICAgaXNUb2tlbiAgICA9ICFpc1RvcGljICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycsXG4gICAgICAgICAgICBpc0Z1bmN0aW9uID0gdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nLFxuICAgICAgICAgICAgcmVzdWx0ID0gZmFsc2UsXG4gICAgICAgICAgICBtLCBtZXNzYWdlLCB0O1xuXG4gICAgICAgIGlmIChpc1RvcGljKXtcbiAgICAgICAgICAgIFB1YlN1Yi5jbGVhclN1YnNjcmlwdGlvbnModmFsdWUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yICggbSBpbiBtZXNzYWdlcyApe1xuICAgICAgICAgICAgaWYgKCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoIG1lc3NhZ2VzLCBtICkgKXtcbiAgICAgICAgICAgICAgICBtZXNzYWdlID0gbWVzc2FnZXNbbV07XG5cbiAgICAgICAgICAgICAgICBpZiAoIGlzVG9rZW4gJiYgbWVzc2FnZVt2YWx1ZV0gKXtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG1lc3NhZ2VbdmFsdWVdO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgLy8gdG9rZW5zIGFyZSB1bmlxdWUsIHNvIHdlIGNhbiBqdXN0IHN0b3AgaGVyZVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoaXNGdW5jdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKCB0IGluIG1lc3NhZ2UgKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobWVzc2FnZSwgdCkgJiYgbWVzc2FnZVt0XSA9PT0gdmFsdWUpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBtZXNzYWdlW3RdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG59KSk7XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdGlkOiBtb2R1bGVJZCxcblx0XHRsb2FkZWQ6IGZhbHNlLFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcblx0bW9kdWxlLmxvYWRlZCA9IHRydWU7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuX193ZWJwYWNrX3JlcXVpcmVfXy5uID0gKG1vZHVsZSkgPT4ge1xuXHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cblx0XHQoKSA9PiAobW9kdWxlWydkZWZhdWx0J10pIDpcblx0XHQoKSA9PiAobW9kdWxlKTtcblx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgeyBhOiBnZXR0ZXIgfSk7XG5cdHJldHVybiBnZXR0ZXI7XG59OyIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm5tZCA9IChtb2R1bGUpID0+IHtcblx0bW9kdWxlLnBhdGhzID0gW107XG5cdGlmICghbW9kdWxlLmNoaWxkcmVuKSBtb2R1bGUuY2hpbGRyZW4gPSBbXTtcblx0cmV0dXJuIG1vZHVsZTtcbn07IiwiaW1wb3J0IFB1YlN1YiBmcm9tICdwdWJzdWItanMnO1xuXG5jb25zdCBnYW1lQm9hcmQgPSAoXG4gICAgZnVuY3Rpb24gKCkge1xuICAgICAgICBsZXQgX2JvYXJkID0gbmV3IEFycmF5KDkpLmZpbGwoJycpO1xuXG4gICAgICAgIGNvbnN0IF9jaGVja1dpbkhvcml6b250YWwgPSBmdW5jdGlvbiAobWFyaywgYm9hcmQgPSBfYm9hcmQpIHtcbiAgICAgICAgICAgIC8vY2hlY2sgaWYgYW55IGxpbmUgaGFzIHRocmVlIGNvbnNlY3V0aXZlIG1hcmtzIG9mIGFueSBraW5kXG4gICAgICAgICAgICBjb25zdCB3aW4gPSBib2FyZC5zbGljZSgwLCA3KS5zb21lKChjZWxsLCBpKSA9PiB7XG4gICAgICAgICAgICAgICAgLy9jaGVjayBvbmx5IGV2ZXJ5IHRocmVlIG1hcmtzIGlmIHRoZSBuZXh0IHR3byBhcmUgdGhlIHNhbWVcbiAgICAgICAgICAgICAgICByZXR1cm4gY2VsbCA9PT0gbWFyayAmJiBpICUgMyA9PT0gMCAmJiBjZWxsID09PSBib2FyZFtpICsgMV0gJiYgY2VsbCA9PT0gYm9hcmRbaSArIDJdXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgcmV0dXJuIHdpblxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgX2NoZWNrV2luVmVydGljYWwgPSBmdW5jdGlvbiAobWFyaywgYm9hcmQgPSBfYm9hcmQpIHtcbiAgICAgICAgICAgIC8vY2hlY2sgdmVydGljYWwgbGluZXNcbiAgICAgICAgICAgIGNvbnN0IHdpbiA9IGJvYXJkLnNsaWNlKDAsIDMpLnNvbWUoKGNlbGwsIGkpID0+IHtcbiAgICAgICAgICAgICAgICAvL2NoZWNrIGluIHRoZSBmaXJzdCByb3cgaWYgdGhlIHR3byBiZWxvdyBhcmUgdGhlIHNhbWVcbiAgICAgICAgICAgICAgICByZXR1cm4gY2VsbCA9PT0gbWFyayAmJiBjZWxsID09PSBib2FyZFtpICsgM10gJiYgY2VsbCA9PT0gYm9hcmRbaSArIDZdXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgcmV0dXJuIHdpblxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgX2NoZWNrV2luRGlhZ29uYWwgPSBmdW5jdGlvbiAobWFyaywgYm9hcmQgPSBfYm9hcmQpIHtcbiAgICAgICAgICAgIGNvbnN0IHdpbiA9IGJvYXJkLnNsaWNlKDAsIDMpLnNvbWUoKGNlbGwsIGkpID0+IHtcbiAgICAgICAgICAgICAgICAvL2NoZWNrIGV2ZXJ5IGluZGV4IDAgYW5kIDJcbiAgICAgICAgICAgICAgICBpZiAoaSA9PT0gMCAmJiBjZWxsID09PSBtYXJrICYmIGNlbGwgPT09IGJvYXJkWzRdKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjZWxsID09PSBib2FyZFs4XVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaSA9PSAyICYmIGNlbGwgPT09IG1hcmsgJiYgY2VsbCA9PT0gYm9hcmRbNF0pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNlbGwgPT09IGJvYXJkWzZdXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIHJldHVybiB3aW5cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNoZWNrVGllID0gZnVuY3Rpb24gKGJvYXJkID0gX2JvYXJkKSB7XG4gICAgICAgICAgICByZXR1cm4gYm9hcmQuZXZlcnkoKGNlbGwpID0+IGNlbGwgIT0gJycpXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjaGVja1dpbiA9IGZ1bmN0aW9uIChtYXJrLCBib2FyZCA9IF9ib2FyZCkge1xuICAgICAgICAgICAgcmV0dXJuIF9jaGVja1dpbkhvcml6b250YWwobWFyaywgYm9hcmQpIHx8IF9jaGVja1dpblZlcnRpY2FsKG1hcmssIGJvYXJkKSB8fCBfY2hlY2tXaW5EaWFnb25hbChtYXJrLCBib2FyZCk7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IF91cGRhdGUgPSBmdW5jdGlvbiAobXNnLCBkYXRhKSB7XG4gICAgICAgICAgICAvL2V4dHJhY3QgZGF0YSBmcm9tIFB1YlN1YlxuICAgICAgICAgICAgY29uc3Qge2NlbGxOdW0sIG1hcmt9ID0gZGF0YTtcblxuICAgICAgICAgICAgaWYgKF9ib2FyZFtjZWxsTnVtXSA9PSAnJykgey8vZG9uJ3QgdXBkYXRlIGlmIGNlbGwgaGFzIGFscmVhZHkgYmVlbiBwbGF5ZWRcbiAgICAgICAgICAgICAgICBfYm9hcmRbY2VsbE51bV0gPSBtYXJrO1xuXG4gICAgICAgICAgICAgICAgLy95YSEgZGlzcGxheUNvbnRyb2xsZXIucmVuZGVyKF9ib2FyZCwgY2VsbE51bSk7XG4gICAgICAgICAgICAgICAgLy95YSEgZGlzcGxheUNvbnRyb2xsZXIuY2hhbmdlU3RhdGVEaXNwbGF5KG5hbWUsIGNoZWNrV2luKG1hcmspLCBfY2hlY2tUaWUoKSlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgLy9zdWJzY3JpYmUgdG8gZXZlbnQgdHJpZ2dlcmVkIHdoZW4gcGxheWVyIGFkZHMgYSBtYXJrXG4gICAgICAgIFB1YlN1Yi5zdWJzY3JpYmUoJ21hcmstYWRkZWQnLCBfdXBkYXRlKVxuXG4gICAgICAgIGNvbnN0IF9yZXN0YXJ0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgX2JvYXJkID0gbmV3IEFycmF5KDkpLmZpbGwoJycpO1xuICAgICAgICAgICAgLy95YSBkaXNwbGF5Q29udHJvbGxlci5yZW5kZXIoX2JvYXJkKVxuICAgICAgICB9XG5cbiAgICAgICAgUHViU3ViLnN1YnNjcmliZSgnZ2FtZS1yZXN0YXJ0JywgX3Jlc3RhcnQpXG5cbiAgICAgICAgY29uc3QgZ2V0Qm9hcmQgPSAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gX2JvYXJkXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHsgY2hlY2tUaWUsIGNoZWNrV2luLCBnZXRCb2FyZCB9XG4gICAgfVxuKSgpO1xuXG5jb25zdCBwb3BVcCA9IChcbiAgICBmdW5jdGlvbigpe1xuICAgICAgICBjb25zdCBfcG9wdXAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjcG9wLXVwJyk7XG4gICAgICAgIGNvbnN0IF9wb3B1cEZvcm0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZm9ybS1wbGF5ZXItbmFtZXMnKTtcbiAgICAgICAgY29uc3QgX3BvcHVwQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3BvcC11cC1idXR0b24nKTtcbiAgICAgICAgY29uc3QgX2Nob29zZVBsYXllcnNCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjY2hvb3NlLXBsYXllcnMtYnV0dG9uJyk7XG4gICAgICAgIGNvbnN0IF92aXNpYmxlQXJlYSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyN2aXNpYmxlLWFyZWEnKTtcblxuXG4gICAgICAgIGNvbnN0IF90b2dnbGVQb3B1cCA9ICgpID0+IHsgXG4gICAgICAgICAgICBfcG9wdXAuY2xhc3NMaXN0LnRvZ2dsZSgnaW52aXNpYmxlJylcbiAgICAgICAgICAgIF92aXNpYmxlQXJlYS5mb3JFYWNoKChhcmVhKSA9PiBhcmVhLmNsYXNzTGlzdC50b2dnbGUoJ2ludmlzaWJsZScpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIF9jaG9vc2VQbGF5ZXJzQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgX3RvZ2dsZVBvcHVwKTtcblxuICAgICAgICAvL3Nob3cgZ2FtZSBhZnRlciBwcmVzc2luZyBzdGFydCBidXR0b24gaW4gcG9wIHVwXG4gICAgICAgIF9wb3B1cEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgICAgICAvL3VzZWQgdG8gZGlzcGxheSBlcnJvciBpZiBib3RoIHBsYXllcnMgYXJlIEFJc1xuICAgICAgICAgICAgY29uc3QgYWxlcnRBcmVhID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3BvcC11cC1hbGVydCcpXG4gICAgICAgICAgICBpZiAoX3BvcHVwRm9ybS5jaGVja1ZhbGlkaXR5KCkpIHtcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoX3BvcHVwRm9ybSlcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdQbGF5ZXJEYXRhID0gT2JqZWN0LmZyb21FbnRyaWVzKGZvcm1EYXRhLmVudHJpZXMoKSlcblxuICAgICAgICAgICAgICAgIGNvbnN0IHBsYXllcjFOYW1lID0gbmV3UGxheWVyRGF0YVsncGxheWVyMU5hbWUnXTtcbiAgICAgICAgICAgICAgICBjb25zdCBwbGF5ZXIyTmFtZSA9IG5ld1BsYXllckRhdGFbJ3BsYXllcjJOYW1lJ107XG4gICAgICAgICAgICAgICAgY29uc3QgcGxheWVyMVR5cGUgPSBuZXdQbGF5ZXJEYXRhWydwbGF5ZXIxVHlwZSddO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBsYXllcjJUeXBlID0gbmV3UGxheWVyRGF0YVsncGxheWVyMlR5cGUnXTtcblxuICAgICAgICAgICAgICAgIC8vc3RvcCBnYW1lIGZyb20gc3RhcnRpbmcgaWYgYm90aCBhcmUgQUlzXG4gICAgICAgICAgICAgICAgaWYgKHBsYXllcjFUeXBlICE9ICdodW1hbicgJiYgcGxheWVyMlR5cGUgIT0gJ2h1bWFuJykge1xuICAgICAgICAgICAgICAgICAgICBhbGVydEFyZWEuaW5uZXJUZXh0ID0gJ0F0IGxlYXN0IG9uZSBoYXMgdG8gYmUgaHVtYW4hJztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBfdG9nZ2xlUG9wdXAoKTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwbGF5ZXIxID0gKHBsYXllcjFUeXBlID09ICdodW1hbicpID9cbiAgICAgICAgICAgICAgICAgICAgICAgIFBsYXllcihwbGF5ZXIxTmFtZSwgJzAnKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICBBSVBsYXllcihwbGF5ZXIxTmFtZSwgJzAnLCBwbGF5ZXIxVHlwZSk7Ly9hZGQgZGlmZmljdWx0eVxuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBsYXllcjIgPSAocGxheWVyMlR5cGUgPT0gJ2h1bWFuJykgP1xuICAgICAgICAgICAgICAgICAgICAgICAgUGxheWVyKHBsYXllcjJOYW1lLCAneCcpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgIEFJUGxheWVyKHBsYXllcjJOYW1lLCAneCcsIHBsYXllcjJUeXBlKTsvL2FkZCBkaWZmaWN1bHR5XG5cbiAgICAgICAgICAgICAgICAgICAgUHViU3ViLnB1Ymxpc2goJ2dhbWUtc3RhcnQnLCB7cGxheWVyMSwgcGxheWVyMn0pXG4gICAgICAgICAgICAgICAgICAgIF9wb3B1cEZvcm0ucmVzZXQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbikoKVxuXG4vL21hbmFnZXMgYWxsIGdhbWUgdXBkYXRlc1xuY29uc3QgZGlzcGxheUNvbnRyb2xsZXIgPSAoXG4gICAgZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCBfZ2FtZUFyZWEgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZ2FtZS1hcmVhJyk7XG4gICAgICAgIGNvbnN0IF9nYW1lQ2VsbHMgPSBBcnJheS5mcm9tKF9nYW1lQXJlYS5jaGlsZHJlbik7XG4gICAgICAgIGNvbnN0IF9zdGF0ZURpc3BsYXkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc3RhdGUtZGlzcGxheScpO1xuICAgICAgICBjb25zdCBfcmVzdGFydEJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNyZXN0YXJ0LWJ1dHRvbicpO1xuXG4gICAgICAgIGNvbnN0IF9jZWxsTGlzdGVuZXJGdW5jID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy9zZW5kIHRoZSBjZWxsIGFzIGEgbnVtYmVyXG4gICAgICAgICAgICBQdWJTdWIucHVibGlzaCgnY2VsbC1wcmVzc2VkJywgcGFyc2VJbnQodGhpcy5nZXRBdHRyaWJ1dGUoJ2RhdGEnKSkpXG4gICAgICAgIH07XG5cblxuICAgICAgICAvL3Jlc3RhcnQgd2l0aCBidXR0b25cbiAgICAgICAgX3Jlc3RhcnRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgICBfc3RhdGVEaXNwbGF5LnN0eWxlLmNvbG9yID0gJyc7XG4gICAgICAgICAgICAvL3lhIGdhbWUucmVzdGFydCgpXG4gICAgICAgICAgICBQdWJTdWIucHVibGlzaCgnZ2FtZS1yZXN0YXJ0JywnJyk7XG4gICAgICAgIH0pO1xuXG5cbiAgICAgICAgY29uc3QgX3Jlc3RhcnRDZWxscyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIF9nYW1lQ2VsbHMuZm9yRWFjaCgoY2VsbCkgPT4ge1xuICAgICAgICAgICAgICAgIGNlbGwuY2hpbGRyZW5bMF0uY2xhc3NMaXN0LnJlbW92ZSgnY2hvc2VuJyk7XG4gICAgICAgICAgICAgICAgY2VsbC5jbGFzc0xpc3QucmVtb3ZlKCdjaG9zZW4nKTtcbiAgICAgICAgICAgICAgICBjZWxsLmNsYXNzTGlzdC5yZW1vdmUoJ2NpcmNsZScpXG4gICAgICAgICAgIH1cbiAgICAgICAgICAgIClcbiAgICAgICAgfTtcblxuICAgICAgICAvL3VwZGF0ZXMgRE9NXG4gICAgICAgIGNvbnN0IF9yZW5kZXIgPSBmdW5jdGlvbiAobXNnLCBkYXRhKSB7XG4gICAgICAgICAgICAvL19yZW5kZXIgaWYgZmlyc3QgcGxheWVyIGlzbid0IEFJLlxuICAgICAgICAgICAgICAgIGNvbnN0IGJvYXJkID0gZ2FtZUJvYXJkLmdldEJvYXJkKCk7XG4gICAgICAgICAgICAgICAgY29uc3QgeyBjZWxsTnVtIH0gPSBkYXRhO1xuICAgICAgICAgICAgICAgIF9nYW1lQ2VsbHMuZm9yRWFjaCgoY2VsbCwgaSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgaW1hZ2VQYXRoXG4gICAgICAgICAgICAgICAgICAgIC8vX3JlbmRlciBpbWFnZXNcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJvYXJkW2ldID09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbWFnZVBhdGggPSAnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgY2VsbC5jbGFzc0xpc3QucmVtb3ZlKCdjaG9zZW4nKVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9kZWFjdGl2YXRlIGNlbGwgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBjZWxsLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgX2NlbGxMaXN0ZW5lckZ1bmMpXG4gICAgICAgICAgICAgICAgICAgICAgICBpbWFnZVBhdGggPSBib2FyZFtpXSA9PSAneCcgP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICcuL2ltYWdlcy9jcm9zcy5wbmcnIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnLi9pbWFnZXMvY2lyY2xlLnBuZyc7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjZWxsTnVtID09IGkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjZWxsLmNoaWxkcmVuWzBdLmNsYXNzTGlzdC5hZGQoJ2Nob3NlbicpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2VsbC5jbGFzc0xpc3QuYWRkKCdjaG9zZW4nKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAvL2NoYW5nZSBpbWcgc291cmNlXG4gICAgICAgICAgICAgICAgY2VsbC5jaGlsZHJlblswXS5zZXRBdHRyaWJ1dGUoJ3NyYycsIGltYWdlUGF0aCk7XG4gICAgICAgICAgICB9KSAgICBcbiAgICAgICAgfTtcblxuXG4gICAgICAgIGNvbnN0IF9jaGFuZ2VTdGF0ZURpc3BsYXkgPSBmdW5jdGlvbiAobXNnLCBkYXRhKSB7XG4gICAgICAgICAgICBsZXQgdGV4dFxuICAgICAgICAgICAgaWYgKG1zZyA9PSAnbWFyay1hZGRlZCcpIHtcbiAgICAgICAgICAgIGNvbnN0IHtuYW1lLCBtYXJrfSA9IGRhdGE7XG4gICAgICAgICAgICBjb25zdCB3aW4gPSBnYW1lQm9hcmQuY2hlY2tXaW4obWFyayk7XG4gICAgICAgICAgICBjb25zdCB0aWUgPSBnYW1lQm9hcmQuY2hlY2tUaWUoKTtcblxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvL2dldCB0aGUgb3RoZXIgcGxheWVyIHRvIHBvc3Qgd2hvc2UgdHVybiBpcyBuZXh0XG4gICAgICAgICAgICBjb25zdCBuZXh0UGxheWVyID0gZ2FtZS5nZXRQbGF5ZXIxWyduYW1lJ10gPT0gbmFtZSA/XG4gICAgICAgICAgICAgICAgZ2FtZS5nZXRQbGF5ZXIyKCkgOlxuICAgICAgICAgICAgICAgIGdhbWUuZ2V0UGxheWVyMSgpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvL2NoYW5nZSBjbGFzcyBmb3IgZGl2OmhvdmVyXG4gICAgICAgICAgICBfZ2FtZUNlbGxzLmZvckVhY2goKGNlbGwpID0+IGNlbGwuY2xhc3NMaXN0LnRvZ2dsZSgnY2lyY2xlJykpO1xuXG4gICAgICAgICAgICAvL2lmIHRoZSBuZXh0IHBsYXllciBpcyBBSVxuICAgICAgICAgICAgaWYgKG5leHRQbGF5ZXIuaGFzT3duUHJvcGVydHkoJ2FkZFJhbmRvbScpKSB7XG4gICAgICAgICAgICAgICAgLy9zdG9wIHBsYXllciBmcm9tIGNob29zaW5nIGZvciB0aGVtXG4gICAgICAgICAgICAgICAgX2dhbWVDZWxscy5mb3JFYWNoKChjZWxsKSA9PiBjZWxsLmNsYXNzTGlzdC5hZGQoJ2Nob3NlbicpKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAod2luKSB7XG4gICAgICAgICAgICAgICAgdGV4dCA9IGAke25hbWV9IHdvbiFgXG4gICAgICAgICAgICAgICAgX3N0YXRlRGlzcGxheS5zdHlsZS5jb2xvciA9ICd2YXIoLS1jb2xvci1jb21wbGVtZW50YXJ5Mi1kYXJrJztcbiAgICAgICAgICAgICAgICBfZGVhY3RpdmF0ZUNlbGxzKCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRpZSkge1xuICAgICAgICAgICAgICAgIF9zdGF0ZURpc3BsYXkuc3R5bGUuY29sb3IgPSAndmFyKC0tY29sb3ItY29tcGxlbWVudGFyeTEtZGFyayknO1xuICAgICAgICAgICAgICAgIHRleHQgPSBgSXQncyBhIHRpZSFgXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRleHQgPSBgJHtuZXh0UGxheWVyLmdldE5hbWUoKX0ncyB0dXJuYFxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgICAgICB0ZXh0ID0gYCR7ZGF0YVsncGxheWVyMiddLmdldE5hbWUoKX0ncyB0dXJuYCBcbiAgICAgICAgfVxuICAgICAgICAgICAgX3N0YXRlRGlzcGxheS5pbm5lclRleHQgPSB0ZXh0O1xuICAgICAgICB9O1xuXG5cbiAgICAgICAgLy9hZGQgZXZlbnQgbGlzdGVuZXJzIHRvIGNlbGxzIHRvIHVwZGF0ZSB3aGVuIHByZXNzZWQgYnkgcGxheWVyXG4gICAgICAgIGNvbnN0IF9hY3RpdmF0ZUNlbGxzID0gKCkgPT4ge1xuICAgICAgICAgICAgX2dhbWVDZWxscy5mb3JFYWNoKFxuICAgICAgICAgICAgICAgIChjZWxsKSA9PiBjZWxsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgX2NlbGxMaXN0ZW5lckZ1bmMpKVxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IF9kZWFjdGl2YXRlQ2VsbHMgPSAoKSA9PiB7XG4gICAgICAgICAgICBfZ2FtZUNlbGxzLmZvckVhY2goXG4gICAgICAgICAgICAgICAgKGNlbGwpID0+IGNlbGwucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBfY2VsbExpc3RlbmVyRnVuYykpXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBfZGVhY3RpdmF0ZUhvdmVyID0gKCkgPT4ge1xuICAgICAgICAgICAgX2dhbWVDZWxscy5mb3JFYWNoKCAoY2VsbCkgPT4gY2VsbC5jbGFzc0xpc3QuYWRkKCdjaG9zZW4nKSlcbiAgICAgICAgfVxuXG4gICAgICAgIFB1YlN1Yi5zdWJzY3JpYmUoJ21hcmstYWRkZWQnLCBfcmVuZGVyKTtcbiAgICAgICAgUHViU3ViLnN1YnNjcmliZSgnbWFyay1hZGRlZCcsIF9jaGFuZ2VTdGF0ZURpc3BsYXkpO1xuICAgICAgICBQdWJTdWIuc3Vic2NyaWJlKCdnYW1lLXN0YXJ0JywgIF9yZXN0YXJ0Q2VsbHMpO1xuICAgICAgICBQdWJTdWIuc3Vic2NyaWJlKCdnYW1lLXN0YXJ0JywgX2FjdGl2YXRlQ2VsbHMpO1xuICAgICAgICBQdWJTdWIuc3Vic2NyaWJlKCdnYW1lLXN0YXJ0JywgX2NoYW5nZVN0YXRlRGlzcGxheSk7XG4gICAgICAgIFB1YlN1Yi5zdWJzY3JpYmUoJ2dhbWUtc3RhcnQnLCBfcmVuZGVyKTtcbiAgICAgICAgUHViU3ViLnN1YnNjcmliZSgnYWktdHVybi1zdGFydCcsIF9kZWFjdGl2YXRlSG92ZXIpO1xuICAgICAgICBQdWJTdWIuc3Vic2NyaWJlKCdhaS10dXJuLXN0YXJ0JywgX2RlYWN0aXZhdGVDZWxscylcbiAgICAgICAgUHViU3ViLnN1YnNjcmliZSgnYWktdHVybi1lbmQnLCBfYWN0aXZhdGVDZWxscyk7XG4gICAgICAgIFB1YlN1Yi5zdWJzY3JpYmUoJ2dhbWUtcmVzdGFydCcsIF9yZW5kZXIpXG5cbiAgICB9KSgpO1xuXG4vL2ZhY3RvcnkgZnVuY3Rpb24gdG8gY3JlYXRlIGEgcGxheWVyXG5jb25zdCBQbGF5ZXIgPSBmdW5jdGlvbiAobmFtZSwgbWFyaykge1xuICAgIGNvbnN0IF9tYXJrID0gbWFyaztcblxuICAgIGNvbnN0IGFkZE1hcmsgPSBmdW5jdGlvbiAoY2VsbE51bSkgey8vYWRkcyBhIG1hcmsgb24gZ2FtZUJvYXJkXG4gICAgICAgIFB1YlN1Yi5wdWJsaXNoKCdtYXJrLWFkZGVkJywge2NlbGxOdW0sIG1hcms6X21hcmssIG5hbWV9KVxuICAgIH1cblxuICAgIGNvbnN0IGdldE5hbWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuYW1lXG4gICAgfVxuXG5cbiAgICByZXR1cm4geyBhZGRNYXJrLCBnZXROYW1lIH1cbn1cblxuY29uc3QgQUlQbGF5ZXIgPSBmdW5jdGlvbiAobmFtZSwgbWFyaywgZGlmZmljdWx0eSkge1xuICAgIC8vaW5oZXJpdCBmcm9tIFBsYXllclxuICAgIGNvbnN0IHByb3RvdHlwZSA9IFBsYXllcihuYW1lLCBtYXJrKTtcbiAgICBjb25zdCBfQUlNYXJrID0gbWFyaztcblxuICAgIGNvbnN0IF9leHRyYWN0RW1wdHlJbmRleGVzID0gKGJvYXJkKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGJvYXJkLnJlZHVjZSgoYWNjLCBjZWxsLCBpKSA9PiB7XG4gICAgICAgICAgICBpZiAoY2VsbCA9PT0gJycgfHwgdHlwZW9mIChjZWxsKSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICBhY2MucHVzaChpKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFjY1xuICAgICAgICB9LCBbXSlcbiAgICAgICAgcmV0dXJuIHJlc3VsdFxuICAgIH1cblxuICAgIC8vbmV3IG1ldGhvZHNcbiAgICBjb25zdCBhZGRSYW5kb20gPSAoKSA9PiB7XG4gICAgICAgIC8vY2hlY2sgd2hpY2ggY2VsbHMgYXJlIGVtcHR5IGFuZCBleHRyYWN0IHRoZWlyIGluZGV4ZXNcbiAgICAgICAgY29uc3QgZW1wdHlDZWxsc0luZGV4ZXMgPSBfZXh0cmFjdEVtcHR5SW5kZXhlcyhnYW1lQm9hcmQuZ2V0Qm9hcmQoKSlcbiAgICAgICAgLy9jaG9vc2UgYXQgcmFuZG9tIGZyb20gdGhvc2UgaW5kZXhlc1xuICAgICAgICBjb25zdCByYW5kb21FbXB0eUluZGV4ID0gZW1wdHlDZWxsc0luZGV4ZXNbXG4gICAgICAgICAgICBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBlbXB0eUNlbGxzSW5kZXhlcy5sZW5ndGgpXG4gICAgICAgIF1cbiAgICAgICAgLy9hZGQgbWFyayB0aGVyZSBhZnRlciByYW5kb20gZGVsYXlcbiAgICAgICAgY29uc3QgcmFuZG9tRGVsYXkgPSAoTWF0aC5yYW5kb20oKSAqIDEwMDApICsgNTAwO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIFB1YlN1Yi5wdWJsaXNoKCdhaS10dXJuLWVuZCcpO1xuICAgICAgICAgICAgLy95YSBkaXNwbGF5Q29udHJvbGxlci5hY3RpdmF0ZUNlbGxzKCk7XG4gICAgICAgICAgICBwcm90b3R5cGUuYWRkTWFyayhyYW5kb21FbXB0eUluZGV4KVxuICAgICAgICB9LFxuICAgICAgICAgICAgcmFuZG9tRGVsYXkpO1xuICAgIH07XG5cbiAgICBjb25zdCBhZGRNaW5pTWF4ID0gKCkgPT4ge1xuICAgICAgICAvL09yaWdpbmFsIGFsZ29yaXRobSBpbXBsZW1lbnRhdGlvbiBieSBBaG1hbmQgQUJkb2xzYWhlYlxuICAgICAgICAvL2h0dHBzOi8vd3d3LmZyZWVjb2RlY2FtcC5vcmcvbmV3cy9ob3ctdG8tbWFrZS15b3VyLXRpYy10YWMtdG9lLWdhbWUtdW5iZWF0YWJsZS1ieS11c2luZy10aGUtbWluaW1heC1hbGdvcml0aG0tOWQ2OTBiYWQ0YjM3L1xuICAgICAgICBjb25zdCBfaHVtYW5NYXJrID0gbWFyayA9PT0gJ3gnID8gJzAnIDogJ3gnO1xuXG4gICAgICAgIGNvbnN0IF9pbml0aWFsQm9hcmQgPSBnYW1lQm9hcmQuZ2V0Qm9hcmQoKS5tYXAoKHgsIGkpID0+IHtcbiAgICAgICAgICAgIGlmICh4ID09ICcnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHhcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkvL2NvcHkgYXJyYXlcblxuICAgICAgICBjb25zdCBtaW5pTWF4ID0gZnVuY3Rpb24gKG5ld01hcmsgPSBfQUlNYXJrLCBuZXdCb2FyZCA9IF9pbml0aWFsQm9hcmQpIHtcbiAgICAgICAgICAgIGNvbnN0IGVtcHR5Q2VsbHNJbmRleGVzID0gX2V4dHJhY3RFbXB0eUluZGV4ZXMobmV3Qm9hcmQpO1xuICAgICAgICAgICAgY29uc3QgX29wcG9uZW50TWFyayA9IG5ld01hcmsgPT0gJ3gnID8gJzAnIDogJ3gnO1xuXG4gICAgICAgICAgICBpZiAoZ2FtZUJvYXJkLmNoZWNrV2luKF9odW1hbk1hcmssIG5ld0JvYXJkKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHNjb3JlOiAtMTAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChnYW1lQm9hcmQuY2hlY2tXaW4oX0FJTWFyaywgbmV3Qm9hcmQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc2NvcmU6IDEwIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZW1wdHlDZWxsc0luZGV4ZXMubGVuZ3RoID09IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzY29yZTogMCB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyBhbiBhcnJheSB0byBjb2xsZWN0IGFsbCB0aGUgb2JqZWN0c1xuICAgICAgICAgICAgbGV0IG1vdmVzID0gW107XG5cbiAgICAgICAgICAgIC8vIGxvb3AgdGhyb3VnaCBhdmFpbGFibGUgc3BvdHNcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZW1wdHlDZWxsc0luZGV4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAvL2NyZWF0ZSBhbiBvYmplY3QgZm9yIGVhY2ggYW5kIHN0b3JlIHRoZSBpbmRleCBvZiB0aGF0IHNwb3QgXG4gICAgICAgICAgICAgICAgbGV0IG1vdmUgPSB7fTtcbiAgICAgICAgICAgICAgICBtb3ZlLmluZGV4ID0gbmV3Qm9hcmRbZW1wdHlDZWxsc0luZGV4ZXNbaV1dO1xuXG4gICAgICAgICAgICAgICAgLy8gc2V0IHRoZSBlbXB0eSBzcG90IHRvIHRoZSBjdXJyZW50IHBsYXllclxuICAgICAgICAgICAgICAgIG5ld0JvYXJkW2VtcHR5Q2VsbHNJbmRleGVzW2ldXSA9IG5ld01hcms7XG5cbiAgICAgICAgICAgICAgICAvKmNvbGxlY3QgdGhlIHNjb3JlIHJlc3VsdGVkIGZyb20gY2FsbGluZyBtaW5pbWF4IFxuICAgICAgICAgICAgICAgICAgb24gdGhlIG9wcG9uZW50IG9mIHRoZSBjdXJyZW50IHBsYXllciovXG4gICAgICAgICAgICAgICAgbGV0IHJlc3VsdCA9IG1pbmlNYXgoX29wcG9uZW50TWFyaywgbmV3Qm9hcmQubWFwKHggPT4geCkpO1xuICAgICAgICAgICAgICAgIG1vdmUuc2NvcmUgPSByZXN1bHQuc2NvcmU7XG5cbiAgICAgICAgICAgICAgICAvLyByZXNldCB0aGUgc3BvdCB0byBlbXB0eVxuICAgICAgICAgICAgICAgIG5ld0JvYXJkW2VtcHR5Q2VsbHNJbmRleGVzW2ldXSA9IG1vdmUuaW5kZXg7XG5cbiAgICAgICAgICAgICAgICAvLyBwdXNoIHRoZSBvYmplY3QgdG8gdGhlIGFycmF5XG4gICAgICAgICAgICAgICAgbW92ZXMucHVzaChtb3ZlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gaWYgaXQgaXMgdGhlIGNvbXB1dGVyJ3MgdHVybiBsb29wIG92ZXIgdGhlIG1vdmVzIGFuZCBjaG9vc2UgdGhlIG1vdmUgd2l0aCB0aGUgaGlnaGVzdCBzY29yZVxuICAgICAgICAgICAgbGV0IGJlc3RNb3ZlO1xuXG4gICAgICAgICAgICBpZiAobmV3TWFyayA9PT0gX0FJTWFyaykge1xuICAgICAgICAgICAgICAgIGxldCBiZXN0U2NvcmUgPSAtMTAwMDA7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBbaSwgbW92ZV0gb2YgbW92ZXMuZW50cmllcygpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtb3ZlLnNjb3JlID4gYmVzdFNjb3JlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiZXN0U2NvcmUgPSBtb3ZlLnNjb3JlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYmVzdE1vdmUgPSBpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1vdmUuc2NvcmUgPT09IGJlc3RTY29yZSkgey8vY2hvb3NlIGF0IHJhbmRvbSBpZiBpdHMgdGhlIHNhbWUgc2NvcmVcbiAgICAgICAgICAgICAgICAgICAgICAgIGJlc3RTY29yZSA9IG1vdmUuc2NvcmU7XG4gICAgICAgICAgICAgICAgICAgICAgICBiZXN0TW92ZSA9IFtiZXN0TW92ZSwgaV1bTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMildXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgLy8gZWxzZSBsb29wIG92ZXIgdGhlIG1vdmVzIGFuZCBjaG9vc2UgdGhlIG1vdmUgd2l0aCB0aGUgbG93ZXN0IHNjb3JlXG4gICAgICAgICAgICAgICAgbGV0IGJlc3RTY29yZSA9IDEwMDAwO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgW2ksIG1vdmVdIG9mIG1vdmVzLmVudHJpZXMoKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobW92ZS5zY29yZSA8IGJlc3RTY29yZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmVzdFNjb3JlID0gbW92ZS5zY29yZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJlc3RNb3ZlID0gaTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtb3ZlLnNjb3JlID09PSBiZXN0U2NvcmUpIHsvL2Nob29zZSBhdCByYW5kb20gaWYgaXRzIHRoZSBzYW1lIHNjb3JlXG4gICAgICAgICAgICAgICAgICAgICAgICBiZXN0U2NvcmUgPSBtb3ZlLnNjb3JlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYmVzdE1vdmUgPSBbYmVzdE1vdmUsIGldW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIpXVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG1vdmVzW2Jlc3RNb3ZlXVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYmVzdE1vdmUgPSBtaW5pTWF4KG1hcmssIF9pbml0aWFsQm9hcmQpO1xuXG4gICAgICAgIC8vYWRkIG1hcmsgdGhlcmUgYWZ0ZXIgcmFuZG9tIGRlbGF5XG4gICAgICAgIGNvbnN0IHJhbmRvbURlbGF5ID0gKE1hdGgucmFuZG9tKCkgKiA1MDApICsgNTAwO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIFB1YlN1Yi5wdWJsaXNoKCdhaS10dXJuLWVuZCcpO1xuICAgICAgICAgICAgLy95YSBkaXNwbGF5Q29udHJvbGxlci5hY3RpdmF0ZUNlbGxzKCk7XG4gICAgICAgICAgICBwcm90b3R5cGUuYWRkTWFyayhiZXN0TW92ZS5pbmRleClcbiAgICAgICAgfSwgcmFuZG9tRGVsYXkpO1xuICAgIH07XG5cbiAgICBjb25zdCBnZXREaWZmaWN1bHR5ID0gKCkgPT4ge1xuICAgICAgICByZXR1cm4gZGlmZmljdWx0eTtcbiAgICB9XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHByb3RvdHlwZSwgeyBhZGRSYW5kb20sIGFkZE1pbmlNYXgsIGdldERpZmZpY3VsdHkgfSlcbn1cblxuLy9tYW5hZ2VzIHRoZSBmbG93IG9mIHRoZSBnYW1lLlxuY29uc3QgZ2FtZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgbGV0IGNvdW50ZXIgPSAwO1xuICAgIGxldCBfcGxheWVyMTtcbiAgICBsZXQgX3BsYXllcjI7XG5cbiAgICBjb25zdCBnZXRQbGF5ZXIxID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBfcGxheWVyMVxuICAgIH1cblxuICAgIGNvbnN0IGdldFBsYXllcjIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIF9wbGF5ZXIyXG4gICAgfVxuXG4gICAgY29uc3QgX3N0YXJ0ID0gZnVuY3Rpb24obXNnLCBkYXRhKSB7XG4gICAgICAgIC8vd2hlbiByZXN0YXJ0aW5nLCBsZWF2ZSBzYW1lIHBsYXllcnNcbiAgICAgICAgX3BsYXllcjEgPSBkYXRhWydwbGF5ZXIxJ10gPyBkYXRhWydwbGF5ZXIxJ10gOiBfcGxheWVyMTtcbiAgICAgICAgX3BsYXllcjIgPSBkYXRhWydwbGF5ZXIyJ10gPyBkYXRhWydwbGF5ZXIyJ10gOiBfcGxheWVyMjtcbiAgICAgICAgY291bnRlciA9IDA7XG4gICAgICAgIC8veWEgZGlzcGxheUNvbnRyb2xsZXIucmVzdGFydENlbGxzKCk7XG4gICAgICAgIC8veWEgZGlzcGxheUNvbnRyb2xsZXIuY2hhbmdlU3RhdGVEaXNwbGF5KHRoaXMucGxheWVyMi5nZXROYW1lKCkpXG4gICAgICAgIC8veWEgZGlzcGxheUNvbnRyb2xsZXIuYWN0aXZhdGVDZWxscygpO1xuICAgICAgICAvL2lmIHRoZSBmaXJzdCBwbGF5ZXIgaXMgQUkgbWFrZSBpdCBwbGF5XG4gICAgICAgIF9wbGF5QUkoX3BsYXllcjEpO1xuICAgICAgICAvL25vISBpZighX3BsYXllcjEuaGFzT3duUHJvcGVydHkoJ2FkZFJhbmRvbScpKXtcbiAgICAgICAgLy8gZGlzcGxheUNvbnRyb2xsZXIucmVuZGVyKGdhbWVCb2FyZC5nZXRCb2FyZCgpKVxuICAgICAgICAvLyB9XG4gICAgfTtcblxuICAgIFB1YlN1Yi5zdWJzY3JpYmUoJ2dhbWUtc3RhcnQnLCBfc3RhcnQpO1xuXG4gICAgLy9wbGF5cyBhIHR1cm5cbiAgICBjb25zdCBfdHVybiA9IGZ1bmN0aW9uIChtc2csIGRhdGEpIHtcbiAgICAgICAgY29uc3QgY2VsbE51bSA9IGRhdGFcbiAgICAgICAgLy9hbHRlcm5hdGUgdHVybnMgYmV0d2VlbiBwbGF5ZXJzXG4gICAgICAgIGlmIChjb3VudGVyICUgMiA9PSAwKSB7XG4gICAgICAgICAgICBfcGxheWVyMS5hZGRNYXJrKGNlbGxOdW0pO1xuICAgICAgICAgICAgY291bnRlcisrXG4gICAgICAgICAgICAvL2NoZWNrIGlmIHBsYXllcjIgaXMgQUlcbiAgICAgICAgICAgIF9wbGF5QUkoX3BsYXllcjIpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfcGxheWVyMi5hZGRNYXJrKGNlbGxOdW0pO1xuICAgICAgICAgICAgY291bnRlcisrXG4gICAgICAgICAgICAvL2NoZWNrIGlmIHBsYXllcjEgaXMgQUlcbiAgICAgICAgICAgIF9wbGF5QUkoX3BsYXllcjEpXG5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICB9XG5cbiAgICBQdWJTdWIuc3Vic2NyaWJlKCdjZWxsLXByZXNzZWQnLCBfdHVybilcblxuICAgIGNvbnN0IF9wbGF5QUkgPSBmdW5jdGlvbiAocGxheWVyKSB7XG4gICAgICAgIC8vY2hlY2sgaWYgcGxheWVyIGlzIEFJXG4gICAgICAgIGlmIChwbGF5ZXIuaGFzT3duUHJvcGVydHkoJ2FkZFJhbmRvbScpICYmICFnYW1lQm9hcmQuY2hlY2tXaW4oJ3gnKSAmJiAhZ2FtZUJvYXJkLmNoZWNrV2luKCcwJykpIHtcbiAgICAgICAgICAgIGlmIChjb3VudGVyID09IDApIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnc3RhcnRhaScpXG4gICAgICAgICAgICAgICAgLy95YSBkaXNwbGF5Q29udHJvbGxlci5kZWFjdGl2YXRlSG92ZXIoKTtcbiAgICAgICAgICAgICAgICBQdWJTdWIucHVibGlzaCgnYWktdHVybi1zdGFydCcsICcnKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy9zZW5kcyB0aGUgY3VycmVudCBib2FyZCBzbyB0aGF0IEFJIGNhbiBjaG9vc2UgZnJvbSBlbXB0eSBjZWxsc1xuICAgICAgICAgICAgaWYgKHBsYXllci5nZXREaWZmaWN1bHR5KCkgPT0gJ2hhcmQnKSB7XG4gICAgICAgICAgICAgICAgcGxheWVyLmFkZE1pbmlNYXgoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7IC8vaWYgaXQncyBlYXN5IGRpZmZpY3VsdHlcbiAgICAgICAgICAgICAgICBwbGF5ZXIuYWRkUmFuZG9tKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvdW50ZXIrK1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgUHViU3ViLnN1YnNjcmliZSgnZ2FtZS1yZXN0YXJ0JywgX3N0YXJ0KVxuXG4gICAgcmV0dXJuIHtnZXRQbGF5ZXIxLCBnZXRQbGF5ZXIyIH1cbn1cbikoKVxuXG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=