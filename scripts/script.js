//module for gameboard
const gameBoard = (
    function () {
        let _board = new Array(9).fill('');

        const restart = function () {
            _board = new Array(9).fill('');
            displayController.render(_board)
        }

        const update = function (cellNum, mark, name) {
            // console.log(mark)
            if (_board[cellNum] == '') {//don't update if cell has already been played
                _board[cellNum] = mark;
                displayController.render(_board);
                displayController.changeStateDisplay(name, _checkWin(), _checkTie())
            };
        }

        const _checkTie = function () {
            return _board.every((cell) => cell != '')
        }

        const _checkWin = function () {
            return _checkWinHorizontal() || _checkWinVertical() || _checkWinDiagonal();

        }

        const _checkWinHorizontal = function () {
            //check if any line has three consecutive marks of any kind
            const win = _board.slice(0, 7).some((cell, i) => {
                //check only every three marks if the next two are the same
                return cell != '' && i % 3 == 0 && cell == _board[i + 1] && cell == _board[i + 2]
            })
            return win
        }

        const _checkWinVertical = function () {
            //check vertical lines
            const win = _board.slice(0, 3).some((cell, i) => {
                //check in the first row if the two below are the same
                return cell != '' && cell == _board[i + 3] && cell == _board[i + 6]
            })
            return win
        }

        const _checkWinDiagonal = function () {
            const win = _board.slice(0, 3).some((cell, i) => {
                //check every index 0 and 2
                if (i == 0 && cell != '' && cell == _board[4]) {
                    return cell == _board[8]
                } else if (i == 2 && cell != '' && cell == _board[4]) {
                    return cell == _board[6]
                } else {
                    return false
                }
            })
            return win
        }
        const getBoard = () => {
            return _board
        }
        return { update, restart, getBoard }
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
                if(board[i] == ''){
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
                const player2Name = newPlayerData['player2Name']

                //create Players
                game.player1 = (newPlayerData['player1Type'] == 'human') ? 
                Player(player1Name, '0') :
                AIPlayer(player1Name, '0');

                game.player2 = (newPlayerData['player2Type'] == 'human') ? 
                Player(player2Name, 'x') :
                AIPlayer(player2Name, 'x');

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


    return { addMark, getName}
}

const AIPlayer = function(name, mark) {
    //inherit from Player
    const {addMark, getName} = Player(name, mark);

    //new methods
    const addRandom = (board) => {
        //check which cells are empty and extract their indexes
        const emptyCellsIndexes= board.reduce((acc,cell, i) => {
            if (cell == ''){
                acc.push(i)
            }
            return acc
        }, [])
        //choose at random from those indexes
        const randomEmptyIndex = emptyCellsIndexes[
            Math.floor(Math.random() * emptyCellsIndexes.length)
        ]
        //add mark there
        addMark(randomEmptyIndex);
    }
    return {addMark, getName, addRandom}
}

//manages the flow of the game.
const game = (function () {
    let counter = 0;

    const start = function () {
        displayController.changeStateDisplay(this.player2.getName())
        displayController.activateCells();
        //if the first player is AI make it play
        _playAI(this.player1)
    };
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

    const _playAI = function(player){
        //check if player is AI
        if(player.hasOwnProperty('addRandom')){
        //sends the current board so that AI can choose from empty cells
            player.addRandom(gameBoard.getBoard())
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

