//module for gameboard
const gameBoard = (
    function () {
        const _board = new Array(9).fill('');

        const update = function (cellNum, mark) {
            // console.log(mark)
            if (_board[cellNum] == '') {//don't update if cell has already been played
                _board[cellNum] = mark;
                displayController.render(_board);
            }
        }
        return { update }
    }
)()

//manages all DOM updates
const displayController = (
    function () {
        const _gameArea = document.querySelector('#game-area')
        const _gameSquares = Array.from(_gameArea.children);
        
        //add event listeners to squares to update when pressed by player
        _gameSquares.forEach(
            (square, cellNum) => square.addEventListener('click', (e) => {
                gameBoard.update(cellNum, 'x');
            }))
        
        //updates DOM
        const render = function (board) {
            _gameSquares.forEach((square, i) => {
                square.innerText = board[i]
            })
        }
        return {render}
    })();

//factory function to create a player
const Player = function (name, mark) {
    const _mark = mark;
    const sayName = () => console.log(`My name is ${name}`)
    const addMark = function (cellNum) {//adds a mark on gameBoard
        gameBoard.update(cellNum, _mark)
    }
    return { sayName, addMark }
}

const game = (function () {

}
)()

// gameBoard.render();

let player1 = Player('Hector', '0');
let player2 = Player('Juan', 'x')

player1.addMark(1)
player2.addMark(4)