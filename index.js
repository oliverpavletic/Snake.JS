/** 
 *  Project: JAVASCRIPT SNAKE 
 *  Author: Oliver Pavletic 
 *  Date: May 2019
 * */

const FRAME_INTERVAL = 100; // miliseconds
const GAME_DIMS = { HEIGHT_IN_CELLS: 27, WIDTH_IN_CELLS: 48, MARGIN_IN_CELLS: 5, ASPECT_RATIO: (16 / 9) };
const NUM_FOOD_PIECES = 10;
const SNAKE_INIT_SIZE = 5;
const SNAKE_INIT_DIR = "RIGHT";
const VALID_STATUS = ["empty", "snake", "food"];

class Cell {
    constructor(x, y, size, status) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.status = status; // empty, food or snake 
        this.id = `cell-${x}-${y}`; // DOM id
    }

    setStatus(newStatus) {
        if (VALID_STATUS.includes(newStatus)) {
            document.getElementById(this.id).className = newStatus;
            this.status = newStatus;
        }
    }

    get html() {
        return this.generateHTML();
    }

    generateHTML() {
        let div = document.createElement("div");
        div.className = this.status;
        div.style.height = `${this.size}px`;
        div.style.width = `${this.size}px`;
        div.style.position = "absolute";
        div.style.left = `${this.x * this.size}px`;
        div.style.top = `${this.y * this.size}px`;
        div.id = this.id;
        return div;
    }
}

class SnakeGame {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.container = document.querySelector('#snake-container');
        this.cells = [];
        this.snakeCoordinates = [];
        this.foodCoordinates = [];
        this.snakeDirection = SNAKE_INIT_DIR;
        this.snakeDirectionStack = [];
        this.intervalId = null;
        this.gameScore = 0;
        this.gameIsPaused = false;
        this.createCells();
        this.spawnFood();
        this.spawnSnake();
    }

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
        this.cells = cells;
    }

    spawnFood() {
        let numExistingFoodPieces = this.foodCoordinates.length;
        let randomCell = null;

        // spawn as many food pieces s.t the total pieces of food is always equal to NUM_FOOD_PIECES
        for (var i = 0; i < NUM_FOOD_PIECES - numExistingFoodPieces; i++) {

            // do-while to avoid duplicate food pieces and collisions with snake coordinates
            do {
                randomCell = { x: Math.floor(Math.random() * GAME_DIMS.WIDTH_IN_CELLS), y: Math.floor(Math.random() * GAME_DIMS.HEIGHT_IN_CELLS) };
            } while ((this.foodCoordinates.concat(this.snakeCoordinates)).some(e => e.x === randomCell.x && e.y === randomCell.y));

            this.cells[randomCell.x][randomCell.y].setStatus("food");
            this.foodCoordinates.push(randomCell);
        }
    }

    spawnSnake() {
        let coordinates = [];

        // add center cell to snake
        let center = { x: Math.floor(GAME_DIMS.WIDTH_IN_CELLS / 2), y: Math.floor(GAME_DIMS.HEIGHT_IN_CELLS / 2) };
        this.cells[center.x][center.y].setStatus("snake");
        coordinates.push(center);

        // add remaining cells to snake
        for (var i = 0; i < SNAKE_INIT_SIZE - 1; i++) {
            this.cells[center.x - (i + 1)][center.y].setStatus("snake");
            coordinates.push({ x: center.x - (i + 1), y: center.y });
        }

        this.snakeCoordinates = coordinates;
    }

    // starts the game
    run() {
        this.addEventListeners(); // request new frame every FRAME_INTERVAL
        this.startAnimation();
    }

    addEventListeners() {
        document.getElementById('pause-btn').addEventListener('click', this.togglePauseScreen.bind(this));

        // add event listener to enable snake direction change
        window.addEventListener("keydown", e => {
            if (e.key === "p") {
                this.togglePauseScreen();
            } else if (!this.gameIsPaused && !e.repeat) {
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
                }
            }
        });
    }

    togglePauseScreen() {
        clearInterval(this.intervalId);
        let pauseDisplay = document.getElementById("pause-display");
        let pauseButton = null;
        this.gameIsPaused = !this.gameIsPaused;
        if (!this.gameIsPaused) { // restart game
            pauseButton = document.getElementById('pause-btn-special');
            pauseButton.id = "pause-btn";
            pauseDisplay.style.zIndex = "-1";
            this.startAnimation();
        } else { // pause game
            pauseDisplay.style.zIndex = "1";
            pauseButton = document.getElementById('pause-btn');
            pauseButton.id = "pause-btn-special";
        }
    }

    startAnimation() {
        this.intervalId = setInterval(this.nextFrame.bind(this), FRAME_INTERVAL);
    }

    nextFrame() {
        if (this.gameIsPaused) return;

        const firstCoordinates = this.snakeCoordinates[0];
        const lastCoordinates = this.snakeCoordinates[this.snakeCoordinates.length - 1];
        let nextCoordinates = firstCoordinates;

        this.evalSnakeDirection();

        nextCoordinates = this.getNextCoordinates(firstCoordinates, this.snakeDirection);

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
    }

    evalSnakeDirection() {
        let prevDirection = this.snakeDirection;
        do {
            this.snakeDirection = this.snakeDirectionStack.pop();
        } while (hasConflict(prevDirection, this.snakeDirection));

        if (this.snakeDirection === undefined) this.snakeDirection = prevDirection;
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
                break;
        }
        return nextCoordinates;
    }

    fatalCollision(nextCoordinates) {
        if (nextCoordinates.x > GAME_DIMS.WIDTH_IN_CELLS - 1 || nextCoordinates.y > GAME_DIMS.HEIGHT_IN_CELLS - 1
            || nextCoordinates.y < 0 || nextCoordinates.x < 0
            || this.snakeCoordinates.some(e => e.x === nextCoordinates.x && e.y === nextCoordinates.y)) {
            return true;
        }
        return false;
    }

    gameOver() {
        this.gameIsPaused = true;
        document.getElementById('pause-btn-wrapper').style.zIndex = 1;
        document.getElementById('game-over-display').style.opacity = ".5";
        setTimeout(() => document.getElementById('game-over-text').style.zIndex = 3, 1000);
        setTimeout(() => document.getElementById('play-again-text').style.zIndex = 3, 1000);
        document.getElementById('play-again-text').addEventListener('click', this.newGame.bind(this));
    }

    newGame() {
        this.emptyAllCells();
        this.removeGameOverDisplay();
        this.snakeDirection = SNAKE_INIT_DIR;
        this.spawnFood();
        this.resetScore();
        this.spawnSnake();
        this.gameIsPaused = false;
        this.nextFrame();
        document.getElementById('pause-btn-wrapper').style.zIndex = 2;
    }

    emptyAllCells() {
        let cellsToClear = this.foodCoordinates.concat(this.snakeCoordinates);
        this.foodCoordinates = [];
        this.snakeCoordinates = [];
        for (var i = 0, j = cellsToClear.length; i < j; i++) {
            this.cells[cellsToClear[i].x][cellsToClear[i].y].setStatus("empty");
        }
    }

    removeGameOverDisplay() {
        document.getElementById('play-again-text').removeEventListener('click', this.newGame.bind(this));
        document.getElementById('game-over-display').style.opacity = "0";
        document.getElementById('game-over-text').style.zIndex = -1;
        document.getElementById('play-again-text').style.zIndex = -1;
    }

    resetScore() {
        document.getElementById('score').innerHTML = 0;
        this.gameScore = 0;
    }

    addNextToSnake(nextCoordinates) {
        this.cells[nextCoordinates.x][nextCoordinates.y].setStatus("snake");
        this.snakeCoordinates.unshift(nextCoordinates);
    }

    getFoodCollisionIndex(nextCoordinates) {
        return this.foodCoordinates.findIndex(e => e.x === nextCoordinates.x && e.y === nextCoordinates.y);
    }

    eatFood(foodIndex) {
        // remove food
        this.foodCoordinates.splice(foodIndex, 1);
        // respawn food
        this.spawnFood();
        // update score 
        this.incrementScore();
        // TODO: digest animation ?
    }

    incrementScore() {
        document.getElementById('score').innerHTML = ++this.gameScore;
    }

    removeLastFromSnake(lastCoordinates) {
        this.cells[lastCoordinates.x][lastCoordinates.y].setStatus("empty");
        this.snakeCoordinates.pop();
    }

}

// set up the game board and cells
window.onload = () => {
    let dimensions = getScreenDimensions();
    let cellSize = setupScreen(dimensions)
    let game = new SnakeGame(cellSize);
    game.run();
}


// STYLE: is 'get' an appropriate prefix?
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

// STYLE: is it appropriate to use Object.assign?
function setupScreen(screenDimensions) {
    Object.assign(this, screenDimensions);

    let gameContainer = document.getElementById('game-container');
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

// determines if there is a directional conflict
function hasConflict(firstDirection, secondDirection) {
    if (firstDirection === "UP" && secondDirection === "DOWN") return true;
    if (firstDirection === "DOWN" && secondDirection === "UP") return true;
    if (firstDirection === "LEFT" && secondDirection === "RIGHT") return true;
    if (firstDirection === "RIGHT" && secondDirection === "LEFT") return true;
    return false
}

// returns window dimension bounds (px)
function getBounds() {
    var e = window,
        a = "inner";
    if (!("innerWidth" in window)) {
        a = "client";
        e = document.documentElement || document.body;
    }
    return { width: e[a + "Width"], height: e[a + "Height"] };
}