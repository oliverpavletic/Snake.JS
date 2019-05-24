/* JAVASCRIPT SNAKE by Oliver Pavletic */

// TODO: declutter global scope

const FRAME_INTERVAL = 200; // miliseconds
const CELL_SIZE = 25;
const NUM_FOOD_PIECES = 10;
const SNAKE_INIT_SIZE = 5; // TODO: what if this is larger than the initial board?
const SNAKE_INIT_DIR = "RIGHT";
const GAME_CONT_COLOR = "black"; // TODO: delete eventually
const CELL_COLOR_SCHEME = { empty: "white", food: "yellow", snake: "red" };
let frameRequest = null;

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
        div.style.border = "solid";
        div.id = this.id;
        return div;
    }
}

// set up the game board and cells
window.onload = () => {
    // Get screen dimensions
    let bounds = getBounds();
    let screenHeight = bounds.height;
    let screenWidth = bounds.width;

    // Number of cells vertically and horizontally 
    let gameHeightInCells = Math.floor(screenHeight / CELL_SIZE);
    let gameWidthInCells = Math.floor(screenWidth / CELL_SIZE);

    // Game container dimensions
    let gameContainerHeight = gameHeightInCells * CELL_SIZE;
    let gameContainerWidth = gameWidthInCells * CELL_SIZE;

    // Define game container 
    let gameContainer = document.createElement("div");
    gameContainer.style.background = GAME_CONT_COLOR;
    gameContainer.style.height = `${gameContainerHeight}px`;
    gameContainer.style.width = `${gameContainerWidth}px`;
    gameContainer.id = "game-container";

    // Define cell matrix
    let cells = [];
    for (var i = 0; i < gameWidthInCells; i++) {
        cells[i] = [];
        for (var j = 0; j < gameHeightInCells; j++) {
            // assign cell to corresponding index in the cells matrix
            cells[i][j] = new Cell(i, j, CELL_SIZE, "empty");
            // append newly created cell to game container
            gameContainer.appendChild(cells[i][j].html);
        }
    }

    // Append game container to document body
    document.body.appendChild(gameContainer);

    // Game board is now set up, start game and pass newly created cells
    startGame(cells);
}

// TODO: implement a more robust resizing mechanism

// If screen is resized, reload the page
window.onresize = function () { location.reload(); }

// game manager
function startGame(newCells) {
    let cells = newCells;
    let gameWidthInCells = cells.length;
    let gameHeightInCells = cells[0].length;
    let snakeCoordinates = spawnSnake();
    let foodCoordinates = spawnFood([]);
    let snakeDirection = SNAKE_INIT_DIR;
    let snakeDirectionStack = [];

    // TODO: refactor to combine cell.setStatus and coordinates.push, thinking about one source of truth,
    // and how to make it difficult to have conflicting 'truths'
    // have one function where changing the status of a given cell also adds it to coordinates and such

    // TODO: refactor spawnSnake() to make it more stateless and so it can be used in the frame updating? well that would be more inefficent so idk..

    // spawn snake 
    function spawnSnake() {
        let coordinates = [];

        // add center cell to snake
        let center = { x: Math.floor(gameWidthInCells / 2), y: Math.floor(gameHeightInCells / 2) };
        cells[center.x][center.y].setStatus("snake");
        coordinates.push(center);

        // add remaining cells to snake
        for (var i = 0; i < SNAKE_INIT_SIZE - 1; i++) {
            cells[center.x - (i + 1)][center.y].setStatus("snake");
            coordinates.push({ x: center.x - (i + 1), y: center.y });
        }

        return coordinates;
    }

    // spawn intial food
    function spawnFood(oldFoodCoordinates) {
        let newFoodCoordinates = oldFoodCoordinates;
        const numExistingFoodPieces = newFoodCoordinates.length;

        // spawn as many food pieces s.t the total pieces of food is always equal to NUM_FOOD_PIECES
        for (var i = 0; i < NUM_FOOD_PIECES - numExistingFoodPieces; i++) {
            let randomCell = null;

            // do-while to avoid duplicate food pieces and collisions with snake coordinates
            do {
                randomCell = { x: Math.floor(Math.random() * gameWidthInCells), y: Math.floor(Math.random() * gameHeightInCells) };
            } while ((newFoodCoordinates.concat(snakeCoordinates)).some(e => e.x === randomCell.x && e.y === randomCell.y));

            cells[randomCell.x][randomCell.y].setStatus("food");
            newFoodCoordinates.push(randomCell);
        }

        return newFoodCoordinates;
    }

    // add event listener to enable snake direction change
    window.addEventListener("keydown", e => {
        // button is not held down such that it is automatically repeating
        if (!e.repeat) {
            // arrow keys and WASD
            switch (e.key) {
                case "ArrowUp":
                case "w":
                    snakeDirectionStack.unshift("UP");
                    break;
                case "ArrowDown":
                case "s":
                    snakeDirectionStack.unshift("DOWN");
                    break;
                case "ArrowLeft":
                case "a":
                    snakeDirectionStack.unshift("LEFT");
                    break;
                case "ArrowRight":
                case "d":
                    snakeDirectionStack.unshift("RIGHT");
                    break;
                case " ":
                    alert("GAME OVER, REFRESH");
                    stop();
                    break;
            }
        }
    });

    // update next frame
    function nextFrame() {
        const first = snakeCoordinates[0];
        const last = snakeCoordinates[snakeCoordinates.length - 1];
        let next = first;
        let prevDirection = snakeDirection;

        do {
            snakeDirection = snakeDirectionStack.pop();
        } while (conflict(prevDirection, snakeDirection));

        if (snakeDirection === undefined) snakeDirection = prevDirection;

        switch (snakeDirection) {
            case "UP":
                next = { x: first.x, y: first.y - 1 };
                break;
            case "DOWN":
                next = { x: first.x, y: first.y + 1 };
                break;
            case "LEFT":
                next = { x: first.x - 1, y: first.y };
                break;
            case "RIGHT":
                next = { x: first.x + 1, y: first.y };
                break;
        }

        // handle game border collision
        if (next.x > gameWidthInCells - 1 || next.y > gameHeightInCells - 1 || next.y < 0 || next.x < 0) {
            alert("GAME OVER, YOU CRASHED!");
            cancelAnimationFrame(frameRequest);
            return;
        }

        // handle snake collision
        if (snakeCoordinates.some(e => e.x === next.x && e.y === next.y)) {
            alert("GAME OVER, YOU RAN INTO YOUR OWN SNAKE!");
            cancelAnimationFrame(frameRequest);
            return;
        }

        // no fatal collisions, so add next cell to snake 
        cells[next.x][next.y].setStatus("snake");
        snakeCoordinates.unshift(next);

        // handle food collision       
        let foodIndex = foodCoordinates.findIndex(e => e.x === next.x && e.y === first.y);

        if (foodIndex !== -1) {
            // remove food
            foodCoordinates.splice(foodIndex, 1);
            // respawn food
            foodCoordinates = spawnFood(foodCoordinates);
            // TODO: update score 
        } else {
            // no food collision: remove last cell from snake
            cells[last.x][last.y].setStatus("empty");
            snakeCoordinates.pop();
        }

        // request new frame every FRAME_INTERVAL
        setTimeout(() => { frameRequest = window.requestAnimationFrame(nextFrame) }, FRAME_INTERVAL)

        // helper function: return true if the direction arguments conflict, otherwise return false (even if an argument is undefined)
        function conflict(firstDir, secondDir) {
            if (firstDir === "UP" && secondDir === "DOWN") return true;
            if (firstDir === "DOWN" && secondDir === "UP") return true;
            if (firstDir === "LEFT" && secondDir === "RIGHT") return true;
            if (firstDir === "RIGHT" && secondDir === "LEFT") return true;
            return false
        }
    }

    // request first frame
    nextFrame();
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