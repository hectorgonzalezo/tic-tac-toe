const gameBoard = (
    function () {
        let _board = new Array(9).fill('x');
        const _gameArea = document.querySelector('#game-area')
        const _gameSquares = Array.from(_gameArea.children);

        const get = function() {
            return _board
        }

        //updates the gamearea on webpage
        const render = function() {
            console.log(_gameSquares)
            _gameSquares.forEach((square, i) => {
                square.innerText = _board[i]
            })
        }

        return {get, render}
    }
)()

const Player = function(name) {
    const sayName = () => console.log(`My name is ${name}`)
    return {sayName}
}

const game = (
    function () {
    }
)()

gameBoard.render();