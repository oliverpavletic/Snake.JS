/* JAVASCRIPT SNAKE by Oliver Pavletic */

const FRAME_INTERVAL = 100; // miliseconds
const GAME_DIMS = { HEIGHT_IN_CELLS: 27, WIDTH_IN_CELLS: 48, MARGIN_IN_CELLS: 5, ASPECT_RATIO: (16 / 9) };
const NUM_FOOD_PIECES = 1;
const SNAKE_INIT_SIZE = 5;
const SNAKE_INIT_DIR = "RIGHT";

// TODO: CSS Class Variables
const GAME_CONT_COLOR = "#75aaff";
const CELL_COLOR_SCHEME = { empty: "#d4e2fc", food: "yellow", snake: "red", digest: "green" };

class Cell {
    constructor(x, y, size, status) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.status = status; // empty, food or snake 
        this.id = `cell-${x}-${y}`; // DOM id
    }

    setStatus(newStatus) {
        this.status = newStatus;
        let cell = document.getElementById(this.id);
        cell.style.background = CELL_COLOR_SCHEME[this.status];
    }

    get html() {
        return this.generateHTML();
    }

    generateHTML() {
        let div = document.createElement("div");
        div.style.background = CELL_COLOR_SCHEME[this.status];
        div.style.height = `${this.size}px`;
        div.style.width = `${this.size}px`;
        div.style.position = "absolute";
        div.style.left = `${this.x * this.size}px`;
        div.style.top = `${this.y * this.size}px`;
        //div.style.border = "solid";
        // div.className = "cell" TODO: modify using style sheet selectors! reduce clutter & repition!
        div.id = this.id;
        return div;
    }
}

// set up the game board and cells
window.onload = () => {
    let dimensions = getScreenDimensions();
    let cellSize = setupScreen(dimensions)
    let game = new SnakeGame(cellSize);
    game.start();
}

// If screen is resized, reload the page
// window.onresize = function () { location.reload(); }

// TODO: think of a better name for this ... 
function getScreenDimensions() {
    let bounds = getBounds();

    let screenDimensions = {
        screenHeight: bounds.height,
        screenWidth: bounds.width,
        heightCorrection: 0,
        widthCorrection: 0,
        topMargin: 0,
        sideMargin: 0
    };

    let gameHeightInCells = null;
    let gameWidthInCells = null;
    let screenAspectRatio = screenDimensions.screenWidth / screenDimensions.screenHeight;
    let gameAspectRation = GAME_DIMS.WIDTH_IN_CELLS / GAME_DIMS.HEIGHT_IN_CELLS;

    // max out the height, compensate the width
    if (gameAspectRation < screenAspectRatio) {
        // total height (cells)
        gameHeightInCells = GAME_DIMS.HEIGHT_IN_CELLS + (2 * GAME_DIMS.MARGIN_IN_CELLS);
        // cell size (px)
        screenDimensions.cellSize = Math.floor(screenDimensions.screenHeight / gameHeightInCells);
        // width correction (px)
        screenDimensions.widthCorrection = screenDimensions.screenWidth - (GAME_DIMS.WIDTH_IN_CELLS * screenDimensions.cellSize);
        // top
        screenDimensions.topMargin = GAME_DIMS.MARGIN_IN_CELLS * screenDimensions.cellSize; ``
        // side
        screenDimensions.sideMargin = screenDimensions.widthCorrection / 2;
    } else {
        // total width (cells)
        gameWidthInCells = GAME_DIMS.WIDTH_IN_CELLS + (2 * GAME_DIMS.MARGIN_IN_CELLS);
        // cell size (px)
        screenDimensions.cellSize = Math.floor(screenDimensions.screenWidth / gameWidthInCells);
        // height correction
        screenDimensions.heightCorrection = screenDimensions.screenHeight - (GAME_DIMS.HEIGHT_IN_CELLS * screenDimensions.cellSize);
        // top
        screenDimensions.topMargin = screenDimensions.heightCorrection / 2;
        // side
        screenDimensions.sideMargin = GAME_DIMS.MARGIN_IN_CELLS * screenDimensions.cellSize;
    }

    return screenDimensions;
}

function setupScreen(dimensions) {
    Object.assign(this, dimensions);

    let gameContainer = document.getElementById('game-container');
    gameContainer.style.background = GAME_CONT_COLOR;
    gameContainer.style.height = `${screenHeight}px`;
    gameContainer.style.width = `${screenWidth}px`;

    let scoreDisplay = document.getElementById('score-display');
    scoreDisplay.style.fontSize = `${cellSize}px`;
    scoreDisplay.style.padding = `${cellSize / 2}px`;

    let pauseButton = document.getElementById('pause-btn-wrapper')
    pauseButton.style.right = `${-(cellSize * GAME_DIMS.WIDTH_IN_CELLS)}px`;
    pauseButton.style.fontSize = `${cellSize}px`;
    pauseButton.style.padding = `${cellSize / 2}px`;

    let snakeContainer = document.getElementById('snake-container');
    snakeContainer.style.top = `${topMargin}px`;
    snakeContainer.style.left = `${sideMargin}px`;

    let pauseDisplay = document.getElementById('pause-display');
    pauseDisplay.style.height = `${cellSize * GAME_DIMS.HEIGHT_IN_CELLS}px`;
    pauseDisplay.style.width = `${cellSize * GAME_DIMS.WIDTH_IN_CELLS}px`;

    let gameOverDisplay = document.getElementById('game-over-display')
    gameOverDisplay.style.height = `${cellSize * GAME_DIMS.HEIGHT_IN_CELLS}px`;
    gameOverDisplay.style.width = `${cellSize * GAME_DIMS.WIDTH_IN_CELLS}px`;

    let gameOverText = document.getElementById('game-over-text');
    gameOverText.style.width = `${cellSize * GAME_DIMS.WIDTH_IN_CELLS}px`;
    gameOverText.style.fontSize = `${2 * cellSize}px`;
    gameOverText.style.top = `${cellSize * ((GAME_DIMS.HEIGHT_IN_CELLS * .5) - 4)}px`;
    gameOverText.style.padding = `${cellSize / 2}px`;

    let playAgainText = document.getElementById('play-again-text');
    playAgainText.style.fontSize = `${cellSize}px`;
    playAgainText.style.padding = `${cellSize / 2}px`;

    return cellSize;
}

// game manager
class SnakeGame {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.container = document.querySelector('#snake-container');
        this.cells = this.createCells();
        this.snakeCoordinates = this.spawnSnake();
        this.foodCoordinates = this.spawnFood([]);
        this.snakeDirection = SNAKE_INIT_DIR;
        this.snakeDirectionStack = [];
        this.gameScore = 0;
        this.gameIsPaused = false;
        this.frameRequest = null;
    }

    start() {
        // add event listener for pause button 
        document.getElementById('pause-btn').addEventListener('click', this.togglePauseScreen.bind(this));

        // add event listener to enable snake direction change
        window.addEventListener("keydown", e => {
            // button is not held down such that it is automatically repeating
            if (!e.repeat) {
                // arrow keys and WASD
                switch (e.key) {
                    case "ArrowUp":
                    case "w":
                        this.snakeDirectionStack.unshift("UP");
                        break;
                    case "ArrowDown":
                    case "s":
                        this.snakeDirectionStack.unshift("DOWN");
                        break;
                    case "ArrowLeft":
                    case "a":
                        this.snakeDirectionStack.unshift("LEFT");
                        break;
                    case "ArrowRight":
                    case "d":
                        this.snakeDirectionStack.unshift("RIGHT");
                        break;
                    case "p":
                        this.togglePauseScreen();
                        break;
                }
            }
        });
        this.nextFrame();
    }

    // TODO: refactor to combine cell.setStatus and coordinates.push, thinking about one source of truth,
    // and how to make it difficult to have conflicting 'truths'
    // have one function where changing the status of a given cell also adds it to coordinates and such

    // create cells
    createCells() {
        // define cell matrix
        let cells = [];
        for (var i = 0; i < GAME_DIMS.WIDTH_IN_CELLS; i++) {
            cells[i] = [];
            for (var j = 0; j < GAME_DIMS.HEIGHT_IN_CELLS; j++) {
                // assign cell to corresponding index in the cells matrix
                cells[i][j] = new Cell(i, j, this.cellSize, "empty");
                // append newly created cell to game container
                // TODO: append to local element and then add to DOM? efficiency question...
                this.container.appendChild(cells[i][j].html);
            }
        }
        return cells;
    }

    // spawn snake 
    spawnSnake() {
        let coordinates = [];

        // add center cell to snake
        let center = { x: Math.floor(GAME_DIMS.WIDTH_IN_CELLS / 2), y: Math.floor(GAME_DIMS.HEIGHT_IN_CELLS / 2) };
        this.cells[center.x][center.y].setStatus("snake"); // FLAG: refactor
        coordinates.push(center);

        // add remaining cells to snake
        for (var i = 0; i < SNAKE_INIT_SIZE - 1; i++) {
            this.cells[center.x - (i + 1)][center.y].setStatus("snake"); // FLAG: refactor
            coordinates.push({ x: center.x - (i + 1), y: center.y });
        }

        return coordinates;
    }

    // spawn intial food
    spawnFood(oldFoodCoordinates) {
        let newFoodCoordinates = oldFoodCoordinates;
        let numExistingFoodPieces = newFoodCoordinates.length;
        let randomCell = null;

        // spawn as many food pieces s.t the total pieces of food is always equal to NUM_FOOD_PIECES
        for (var i = 0; i < NUM_FOOD_PIECES - numExistingFoodPieces; i++) {

            // do-while to avoid duplicate food pieces and collisions with snake coordinates
            do {
                randomCell = { x: Math.floor(Math.random() * GAME_DIMS.WIDTH_IN_CELLS), y: Math.floor(Math.random() * GAME_DIMS.HEIGHT_IN_CELLS) };
            } while ((newFoodCoordinates.concat(this.snakeCoordinates)).some(e => e.x === randomCell.x && e.y === randomCell.y));

            this.cells[randomCell.x][randomCell.y].setStatus("food"); // FLAG: refactor
            newFoodCoordinates.push(randomCell);
        }

        return newFoodCoordinates;
    }


    togglePauseScreen() {
        let pauseDisplay = document.getElementById("pause-display");
        let pauseButton = null;
        this.gameIsPaused = !this.gameIsPaused;
        if (!this.gameIsPaused) { // restart game
            pauseButton = document.getElementById('pause-btn-special');
            pauseButton.id = "pause-btn";
            pauseDisplay.style.zIndex = "-1";
            this.nextFrame();
        } else { // pause game
            window.cancelAnimationFrame(this.frameRequest);
            pauseDisplay.style.zIndex = "1";
            pauseButton = document.getElementById('pause-btn');
            pauseButton.id = "pause-btn-special";
        }
    }

    newGame() {
        this.emptyAllCells();
        this.removeGameOverDisplay();
        this.snakeDirection = SNAKE_INIT_DIR;
        this.foodCoordinates = this.spawnFood([]);
        this.resetScore();
        this.snakeCoordinates = this.spawnSnake();
        this.gameIsPaused = false;
        this.nextFrame();
    }

    gameOver() {
        window.cancelAnimationFrame(this.frameRequest);
        this.gameIsPaused = true;
        document.getElementById('game-over-display').style.opacity = ".5";
        setTimeout(() => document.getElementById('game-over-text').style.zIndex = 3, 1000);
        setTimeout(() => document.getElementById('play-again-text').style.zIndex = 3, 1000);
        document.getElementById('play-again-text').addEventListener('click', this.newGame.bind(this));
    }

    removeGameOverDisplay() {
        document.getElementById('play-again-text').removeEventListener('click', this.newGame.bind(this));
        document.getElementById('game-over-display').style.opacity = "0";
        document.getElementById('game-over-text').style.zIndex = -1;
        document.getElementById('play-again-text').style.zIndex = -1;
    }

    emptyAllCells() {
        let cellsToClear = this.foodCoordinates.concat(this.snakeCoordinates);
        this.foodCoordinates = [];
        this.snakeCoordinates = [];
        for (var i = 0, j = cellsToClear.length; i < j; i++) {
            this.cells[cellsToClear[i].x][cellsToClear[i].y].setStatus("empty");
        }
    }

    incrementScore() {
        document.getElementById('score').innerHTML = ++this.gameScore;
    }

    resetScore() {
        document.getElementById('score').innerHTML = 0;
        this.gameScore = 0;
    }

    getNextCoordinates(initial, direction) {
        let nextCoordinates = null;
        switch (direction) {
            case "UP":
                nextCoordinates = { x: initial.x, y: initial.y - 1 };
                break;
            case "DOWN":
                nextCoordinates = { x: initial.x, y: initial.y + 1 };
                break;
            case "LEFT":
                nextCoordinates = { x: initial.x - 1, y: initial.y };
                break;
            case "RIGHT":
                nextCoordinates = { x: initial.x + 1, y: initial.y };
                break;
            // arbitrary default to avoid fatal error
            default:
                // RIGHT
                nextCoordinates = { x: initial.x + 1, y: initial.y };
                console.log("Illegal direction passed to getNextCoordinates");
                break;
        }
        return nextCoordinates;
    }

    addNextToSnake(nextCoordinates) {
        this.cells[nextCoordinates.x][nextCoordinates.y].setStatus("snake");
        this.snakeCoordinates.unshift(nextCoordinates);
    }

    removeLastFromSnake(lastCoordinates) {
        this.cells[lastCoordinates.x][lastCoordinates.y].setStatus("empty");
        this.snakeCoordinates.pop();
    }

    eatFood(foodIndex) {
        // remove food
        this.foodCoordinates.splice(foodIndex, 1);
        // respawn food
        this.foodCoordinates = this.spawnFood(this.foodCoordinates);
        // update score 
        this.incrementScore();
        // TODO: digest animation ?
    }

    getFoodCollisionIndex(nextCoordinates) {
        return this.foodCoordinates.findIndex(e => e.x === nextCoordinates.x && e.y === nextCoordinates.y);
    }

    fatalCollision(nextCoordinates) {
        if (nextCoordinates.x > GAME_DIMS.WIDTH_IN_CELLS - 1 || nextCoordinates.y > GAME_DIMS.HEIGHT_IN_CELLS - 1
            || nextCoordinates.y < 0 || nextCoordinates.x < 0
            || this.snakeCoordinates.some(e => e.x === nextCoordinates.x && e.y === nextCoordinates.y)) {
            return true;
        }
        return false;
    }

    evalSnakeDirection() {
        let prevDirection = this.snakeDirection;
        do {
            this.snakeDirection = this.snakeDirectionStack.pop();
        } while (conflict(prevDirection, this.snakeDirection));

        if (this.snakeDirection === undefined) this.snakeDirection = prevDirection;
    }

    nextFrame() {
        if (this.gameIsPaused) return;

        const firstCoordinates = this.snakeCoordinates[0];
        const lastCoordinates = this.snakeCoordinates[this.snakeCoordinates.length - 1];
        let nextCoordinates = firstCoordinates;

        this.evalSnakeDirection();

        nextCoordinates = this.getNextCoordinates(firstCoordinates, this.snakeDirection);

        // TODO: proper style for return and call function even if return value is not important and unused.
        if (this.fatalCollision(nextCoordinates)) return this.gameOver();

        // no fatal collisions, so add next cell to snake 
        this.addNextToSnake(nextCoordinates);

        // handle food collision   
        let foodIndex = this.getFoodCollisionIndex(nextCoordinates);

        if (foodIndex !== -1) {
            // food collision
            this.eatFood(foodIndex);
        } else {
            // no food collision
            this.removeLastFromSnake(lastCoordinates);
        }

        // request new frame every FRAME_INTERVAL
        setTimeout(() => { this.frameRequest = window.requestAnimationFrame(this.nextFrame.bind(this)) }, FRAME_INTERVAL);
    }

}

// TODO: reduce the need for this by instead representing directions with numbers.. or even enum! doing some div or mod stuff
// helper function: return true if the direction arguments conflict, otherwise return false (even if an argument is undefined)
function conflict(firstDirection, secondDirection) {
    if (firstDirection === "UP" && secondDirection === "DOWN") return true;
    if (firstDirection === "DOWN" && secondDirection === "UP") return true;
    if (firstDirection === "LEFT" && secondDirection === "RIGHT") return true;
    if (firstDirection === "RIGHT" && secondDirection === "LEFT") return true;
    return false
}

// returns window dimension bounds in px
function getBounds() {
    var e = window,
        a = "inner";
    if (!("innerWidth" in window)) {
        a = "client";
        e = document.documentElement || document.body;
    }
    return { width: e[a + "Width"], height: e[a + "Height"] };
}