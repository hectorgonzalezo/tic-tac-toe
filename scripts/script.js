//module for gameboard
const gameBoard = (
    function () {
        let _board = new Array(9).fill('');
        // let _board = ['0', '', 'x', 'x', '', 'x', '', '0', '0']

        const _checkWinHorizontal = function (mark, board = _board) {
            //check if any line has three consecutive marks of any kind
            const win = board.slice(0, 7).some((cell, i) => {
                //check only every three marks if the next two are the same
                return cell == mark && i % 3 == 0 && cell == board[i + 1] && cell == board[i + 2]
            })
            return win
        }

        const _checkWinVertical = function (mark, board = _board) {
            //check vertical lines
            const win = board.slice(0, 3).some((cell, i) => {
                //check in the first row if the two below are the same
                return cell == mark && cell == board[i + 3] && cell == board[i + 6]
            })
            return win
        }

        const _checkWinDiagonal = function (mark, board = _board) {
            const win = board.slice(0, 3).some((cell, i) => {
                //check every index 0 and 2
                if (i == 0 && cell == mark && cell == board[4]) {
                    return cell == board[8]
                } else if (i == 2 && cell == mark && cell == board[4]) {
                    return cell == board[6]
                } else {
                    return false
                }
            })
            return win
        }

        const _checkTie = function (board = _board) {
            return board.every((cell) => cell != '')
        }

        const checkWin = function (mark, board = _board) {
            return _checkWinHorizontal(mark, board) || _checkWinVertical(mark, board) || _checkWinDiagonal(mark, board);

        }

        const update = function (cellNum, mark, name) {
            if (_board[cellNum] == '') {//don't update if cell has already been played
                _board[cellNum] = mark;
                displayController.render(_board);
                displayController.changeStateDisplay(name, checkWin(mark), _checkTie())
            };
        }

        const restart = function () {
            _board = new Array(9).fill('');
            displayController.render(_board)
        }

        const getBoard = () => {
            return _board
        }
        return {checkWin, update, restart, getBoard }
    }
)()

//manages all DOM updates
const displayController = (
    function () {
        const _gameArea = document.querySelector('#game-area')
        const _gameCells = Array.from(_gameArea.children);
        const _stateDisplay = document.querySelector('#state-display')
        const _restartButton = document.querySelector('#restart-button')
        const _popup = document.querySelector('#pop-up')
        const _popupForm = document.querySelector('#form-player-names')
        const _popupButton = document.querySelector('#pop-up-button')
        const _visibleArea = document.querySelectorAll('#visible-area')

        //add event listeners to cells to update when pressed by player
        const activateCells = () => {
            _gameCells.forEach(
                (cell) => cell.addEventListener('click', _cellListenerFunc))
        };

        const _deactivateCells = () => {
            _gameCells.forEach(
                (cell) => cell.removeEventListener('click', _cellListenerFunc))
        }

        const _cellListenerFunc = function () {
            game.turn(this.getAttribute('data'));
        }

        //restart with button
        _restartButton.addEventListener('click', () => {
            _stateDisplay.style.color = '';
            game.restart()
        });

        //updates DOM
        const render = function (board) {
            _gameCells.forEach((cell, i) => {
                let imagePath
                //render images
                if (board[i] == '') {
                    imagePath = ''
                } else {
                    imagePath = board[i] == 'x' ?
                        '../images/cross.png' :
                        '../images/circle.png';
                }
                //change img source
                cell.children[0].setAttribute('src', imagePath)

            })
        }

        //show game after pressing start button in pop up
        _popupButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (_popupForm.checkValidity()) {
                _visibleArea.forEach((area) => area.classList.toggle('invisible'));
                _popup.classList.toggle('invisible');

                const formData = new FormData(_popupForm)
                const newPlayerData = Object.fromEntries(formData.entries())

                const player1Name = newPlayerData['player1Name'];
                const player2Name = newPlayerData['player2Name'];
                (newPlayerData)

                //create Players
                game.player1 = (newPlayerData['player1Type'] == 'human') ?
                    Player(player1Name, '0') :
                    AIPlayer(player1Name, '0', newPlayerData['player1Type']);//add difficulty

                game.player2 = (newPlayerData['player2Type'] == 'human') ?
                    Player(player2Name, 'x') :
                    AIPlayer(player2Name, 'x', newPlayerData['player2Type']);//add difficulty

                game.start();
            }
        })

        const changeStateDisplay = function (player, win = false, tie = false) {
            let text
            //get the name of the other player to post whose turn is next
            const nextPlayer = game.player1.getName() == player ?
                game.player2.getName() :
                game.player1.getName();

            if (win) {
                text = `${player} won!`
                _stateDisplay.style.color = 'red';
                _deactivateCells();
            } else if (tie) {
                _stateDisplay.style.color = 'blue';
                text = `It's a tie!`
            } else {
                text = `${nextPlayer}'s turn`
            }
            _stateDisplay.innerText = text;
        }
        return { render, changeStateDisplay, activateCells }
    })();

//factory function to create a player
const Player = function (name, mark) {
    const _mark = mark;

    const addMark = function (cellNum) {//adds a mark on gameBoard
        gameBoard.update(cellNum, _mark, name);
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
            if (cell == '' || typeof (cell) == 'number') {
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
        //add mark there
        prototype.addMark(randomEmptyIndex);
    };

    const addMiniMax = () => {
        //Original algorithm implementation by Ahmand ABdolsaheb
        //https://www.freecodecamp.org/news/how-to-make-your-tic-tac-toe-game-unbeatable-by-using-the-minimax-algorithm-9d690bad4b37/
        const _humanMark = 'x' ? '0' : 'x';  

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

                let result = miniMax(_opponentMark, newBoard);
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
                for (let i = 0; i < moves.length; i++) {
                    if (moves[i].score > bestScore) {
                        bestScore = moves[i].score;
                        bestMove = i;
                    }
                }
            } else {

                // else loop over the moves and choose the move with the lowest score
                let bestScore = 10000;
                for (let i = 0; i < moves.length; i++) {
                    if (moves[i].score < bestScore) {
                        bestScore = moves[i].score;
                        bestMove = i;
                    }
                }
            }
            // console.log(moves)
            return moves[bestMove]
        }

        const bestMove = miniMax();

        // return the chosen move (object) from the moves array
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

    const start = function () {
        displayController.changeStateDisplay(this.player2.getName())
        displayController.activateCells();
        //if the first player is AI make it play
        _playAI(this.player1)
        displayController.render(gameBoard.getBoard())
    };

    //plays a turn
    const turn = function (cellNum) {
        //alternate turns between players
        if (counter % 2 == 0) {
            this.player1.addMark(cellNum);
            //check if player2 is AI
            _playAI(this.player2)
        } else {
            this.player2.addMark(cellNum);
            //check if player1 is AI
            _playAI(this.player1)

        }
        counter++
    }

    const _playAI = function (player) {
        console.log(player)
        if (player.hasOwnProperty('addRandom') && !gameBoard.checkWin('x') && !gameBoard.checkWin('0')) {//check if player is AI
            //sends the current board so that AI can choose from empty cells
            console.log('ai play')
            if (player.getDifficulty() == 'hard') {
                player.addMiniMax();
            } else { //if it's easy dificulty
                player.addRandom()
            }
            counter++
        }
    }

    const restart = function () {
        counter = 0;
        gameBoard.restart();
        this.start();
    }

    let player1;
    let player2;

    return { start, turn, restart, player1, player2 }
}
)()

