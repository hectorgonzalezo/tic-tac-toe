//module for gameboard
const gameBoard = (
    function () {
        let _board = new Array(9).fill('');
        // let _board = ['0', '', 'x', 'x', '', 'x', '', '0', '0']

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

        const _checkTie = function (board = _board) {
            return board.every((cell) => cell != '')
        }

        const checkWin = function (mark, board = _board) {
            return _checkWinHorizontal(mark, board) || _checkWinVertical(mark, board) || _checkWinDiagonal(mark, board);

        }

        const update = function (cellNum, mark, name) {
            if (_board[cellNum] == '') {//don't update if cell has already been played
                _board[cellNum] = mark;
                displayController.render(_board, cellNum);
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
        return { checkWin, update, restart, getBoard }
    }
)()

//manages all DOM updates
const displayController = (
    function () {
        const _gameArea = document.querySelector('#game-area');
        const _gameCells = Array.from(_gameArea.children);
        const _stateDisplay = document.querySelector('#state-display');
        const _restartButton = document.querySelector('#restart-button');
        const _popup = document.querySelector('#pop-up');
        const _popupForm = document.querySelector('#form-player-names');
        const _popupButton = document.querySelector('#pop-up-button');
        const _visibleArea = document.querySelectorAll('#visible-area');



        const _cellListenerFunc = function () {
            game.turn(this.getAttribute('data'));
        }

        //restart with button
        _restartButton.addEventListener('click', () => {
            _stateDisplay.style.color = '';
            game.restart()
            //restart cells
            _gameCells.forEach((cell) => {
                cell.children[0].classList.remove('chosen');
                // cell.classList.remove('chosen');
                cell.classList.add('circle')
            })
        });



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
                const player1Type = newPlayerData['player1Type']
                const player2Type = newPlayerData['player2Type']

                //stop game from starting if both are AIs
                if (player1Type != 'human' && player2Type != 'human') {
                    console.log('At least one has to be human');
                    alertArea.innerText = 'At least one has to be human!'
                } else {
                    _visibleArea.forEach((area) => area.classList.toggle('invisible'));
                    _popup.classList.toggle('invisible');
                    //create Players
                    game.player1 = (player1Type == 'human') ?
                        Player(player1Name, '0') :
                        AIPlayer(player1Name, '0', player1Type);//add difficulty

                    game.player2 = (player2Type == 'human') ?
                        Player(player2Name, 'x') :
                        AIPlayer(player2Name, 'x', player2Type);//add difficulty

                    game.start();
                }
            }
        });

        //updates DOM
        const render = function (board, cellNum = null) {
            _gameCells.forEach((cell, i) => {
                let imagePath
                //render images
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

        const changeStateDisplay = function (player, win = false, tie = false) {
            let text
            //get the other player to post whose turn is next
            const nextPlayer = game.player1.getName() == player ?
                game.player2 :
                game.player1;

            //change class for div:hover
            _gameCells.forEach((cell) => cell.classList.toggle('circle'));

            //if the next player is AI
            if (nextPlayer.hasOwnProperty('addRandom')) {
                //stop player from choosing for them
                _gameCells.forEach((cell) => cell.classList.add('chosen'))
            }

            if (win) {
                text = `${player} won!`
                _stateDisplay.style.color = 'red';
                deactivateCells();
            } else if (tie) {
                _stateDisplay.style.color = 'blue';
                text = `It's a tie!`
            } else {
                text = `${nextPlayer.getName()}'s turn`
            }
            _stateDisplay.innerText = text;
        };

        //add event listeners to cells to update when pressed by player
        const activateCells = () => {
            _gameCells.forEach(
                (cell) => cell.addEventListener('click', _cellListenerFunc))
        };

        const deactivateCells = () => {
            _gameCells.forEach(
                (cell) => cell.removeEventListener('click', _cellListenerFunc))
        }

        const deactivateHover = () => {
            _gameCells.forEach( (cell) => cell.classList.add('chosen'))
        }

        return { render, changeStateDisplay, activateCells, deactivateCells, deactivateHover }
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
            displayController.activateCells();
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
            displayController.activateCells();
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

    const start = function () {
        counter = 0;
        displayController.changeStateDisplay(this.player2.getName())
        displayController.activateCells();
        //if the first player is AI make it play
        _playAI(this.player1);
        if(!this.player1.hasOwnProperty('addRandom')){
        displayController.render(gameBoard.getBoard())
        }
    };

    //plays a turn
    const turn = function (cellNum) {
        //alternate turns between players
        if (counter % 2 == 0) {
            this.player1.addMark(cellNum);
            counter++
            //check if player2 is AI
            _playAI(this.player2)
        } else {
            this.player2.addMark(cellNum);
            counter++
            //check if player1 is AI
            _playAI(this.player1)

        }
        
    }

    const _playAI = function (player) {
        //check if player is AI
        if (player.hasOwnProperty('addRandom') && !gameBoard.checkWin('x') && !gameBoard.checkWin('0')) {
            if (counter == 0) {
                console.log('startai')
                displayController.deactivateHover();
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

    const restart = function () {
        gameBoard.restart();
        this.start();
    }

    let player1;
    let player2;

    return { start, turn, restart, player1, player2 }
}
)()

