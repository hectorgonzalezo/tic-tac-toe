"use strict"
import PubSub from 'pubsub-js';

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

        PubSub.subscribe('game-start', _restart);
        //subscribe to event triggered when player adds a mark
        PubSub.subscribe('mark-added', _update);

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

                    PubSub.publish('game-start', { player1, player2 });
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
            PubSub.publish('cell-pressed', this.getAttribute('data'));
        };


        //restart with button
        _restartButton.addEventListener('click', () => {
            _stateDisplay.style.color = '';
            PubSub.publish('game-start', { 'player1': game.getPlayer1(), 'cellNum': 9 })
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

        PubSub.subscribe('mark-added', _render);
        PubSub.subscribe('game-start', _restartCells);
        PubSub.subscribe('game-start', _activateCells);
        PubSub.subscribe('game-start', _changeStateDisplay);
        PubSub.subscribe('game-start', _render);
        PubSub.subscribe('ai-turn-start', _deactivateHover);
        PubSub.subscribe('ai-turn-start', _deactivateCells)
        PubSub.subscribe('ai-turn-end', _activateCells);

        PubSub.subscribe('turn-passed', _changeStateDisplay);

    })();

//factory function to create a player
const Player = function (name, mark) {
    const _mark = mark;

    const addMark = function (cellNum) {//adds a mark on gameBoard
        PubSub.publish('mark-added', { cellNum, mark: _mark, name })
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
        PubSub.publish('ai-turn-end');
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

        PubSub.publish('ai-turn-end');
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
        PubSub.publish('turn-passed', { name, mark, nextPlayer })
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
    
                PubSub.publish('ai-turn-start', '');
    
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

    PubSub.subscribe('game-start', _start);
    PubSub.subscribe('cell-pressed', _turn);

    return { getPlayer1, getPlayer2 }
}
)()