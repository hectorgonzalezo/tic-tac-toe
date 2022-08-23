//module for gameboard
const gameBoard = (
    function () {
        const _board = new Array(9).fill('');

        const update = function (cellNum, mark, name) {
            // console.log(mark)
            if (_board[cellNum] == '') {//don't update if cell has already been played
                _board[cellNum] = mark;
                displayController.render(_board);
                displayController.changeState(name, _checkWin(), _checkTie())
            }
        }

        const _checkTie = function () {
            return _board.every((cell) => cell != '')
        }

        const _checkWin = function(){
            return _checkWinHorizontal() || _checkWinVertical() || _checkWinDiagonal();
            
        }

        const _checkWinHorizontal = function(){
            //check if any line has three consecutive marks of any kind
            const win = _board.slice(0, 7).some((cell, i) => {
                //check only every three marks if the next two are the same
                return cell != '' && i%3 == 0 && cell == _board[i+1] && cell == _board[i+2]
            })
            return win
        }

        const _checkWinVertical = function() {
            //check vertical lines
            const win = _board.slice(0, 3).some((cell, i) => {
                //check in the first row if the two below are the same
                return cell != '' && cell == _board[i+3] && cell == _board[i+6]
            })
            return win 
        }

        const _checkWinDiagonal = function() {
            const win = _board.slice(0, 3).some((cell, i) => {
                //check every index 0 and 2
                if (i == 0 && cell != '' && cell == _board[4]){
                    return cell ==_board[8]
                } else if (i == 2 && cell != '' && cell == _board[4]){
                    return cell == _board[6]
                } else{
                    return false
                }
            })
            return win  
        }

        return { update }
    }
)()

//manages all DOM updates
const displayController = (
    function () {
        const _gameArea = document.querySelector('#game-area')
        const _gameSquares = Array.from(_gameArea.children);
        const _stateDisplay = document.querySelector('#state-display')
        
        //add event listeners to squares to update when pressed by player
        _gameSquares.forEach(
            (square, cellNum) => square.addEventListener('click', (e) => {
                // gameBoard.update(cellNum, 'x');
                game.turn(cellNum)
            }))
        
        //updates DOM
        const render = function (board) {
            _gameSquares.forEach((square, i) => {
                square.innerText = board[i]
            })
        }

        const changeState = function (player, win=false, tie=false) {
            let text
            if (win) {
                text = `${player} won.` 
            } else if(tie) {
                text = `It's a tie!`
            } else {
            text = `${player}'s turn.`
            }
            _stateDisplay.innerText = text;
        }
        return {render, changeState}
    })();

//factory function to create a player
const Player = function (name, mark) {
    const _mark = mark;

    const addMark = function (cellNum) {//adds a mark on gameBoard
        gameBoard.update(cellNum, _mark, name);
        // displayController.changeState(name)
    }
    return {addMark}
}

const game = (function () {
    let counter = 0;
    const turn = function(cellNum) {
        //alternate turns between players
        if(counter%2 == 0){
            player1.addMark(cellNum);
        } else {
            player2.addMark(cellNum);
        }
        counter++
    }

    const restart = function() {
        counter = 0;
    }
    return{turn, restart}
}
)()

// gameBoard.render();

let player1 = Player('Hector', '0');
let player2 = Player('Juan', 'x')

player1.addMark(1)
player2.addMark(4)