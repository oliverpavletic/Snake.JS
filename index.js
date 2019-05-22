/* JAVASCRIPT SNAKE by Oliver Pavletic */

const FRAME_INTERVAL = 500; // miliseconds
const CELL_SIZE = 25;
const NUM_FOOD_PIECES = 10;
const SNAKE_INIT_SIZE = 5; // TODO: what if this is larger than the initial board?
const GAME_CONT_COLOR = "black"; // TODO: delete eventually
const CELL_COLOR_SCHEME = { empty: "white", food: "yellow", snake: "red" };
let frameRequest = null;

class Cell {
    constructor(x, y, size, status) {
        this.x = x;
        this.y = y;
        this.size = size;
        // TODO: make this an enum with symbols?
        this.status = status; // empty, food, or snake
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

// Set up the game board and cells
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
            cells[i][j] = new Cell(i, j, CELL_SIZE, "empty", CELL_COLOR_SCHEME);
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
    let snakeCoordiantes = spawnSnake();
    let foodCoordinates = spawnFood([]);
    let snakeDirection = "RIGHT";

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
        // if we already have food coordinates, use them
        let newFoodCoordinates = oldFoodCoordinates;
        const numExistingFoodPieces = newFoodCoordinates.length;
        // spawn as many food pieces s.t the total pieces of food is always equal to NUM_FOOD_PIECES
        for (var i = 0; i < NUM_FOOD_PIECES - numExistingFoodPieces; i++) {
            let randomCell = { x: 0, y: 0 };
            // do-while to avoid duplicate food pieces and collisions with snake coordinates
            do {
                randomCell = { x: Math.floor(Math.random() * gameWidthInCells), y: Math.floor(Math.random() * gameHeightInCells) };
            } while ((newFoodCoordinates.concat(snakeCoordiantes)).some(e => e.x === randomCell.x && e.y === randomCell.y));

            cells[randomCell.x][randomCell.y].setStatus("food");
            newFoodCoordinates.push(randomCell);
        }
        return newFoodCoordinates;
    }

    // TODO:
    // add dir to stack
    // every frame, take the topmost valid dir and clear the stack!

    // add event listener to enable snake direction change
    window.addEventListener("keydown", e => {
        // button is not held down such that it is automatically repeating
        if (!e.repeat) {
            // arrow keys and WASD
            switch (e.key) {
                case "ArrowUp":
                case "w":
                    if (snakeDirection !== "DOWN") snakeDirection = "UP";
                    break;
                case "ArrowDown":
                case "s":
                    if (snakeDirection !== "UP") snakeDirection = "DOWN";
                    break;
                case "ArrowLeft":
                case "a":
                    if (snakeDirection !== "RIGHT") snakeDirection = "LEFT";
                    break;
                case "ArrowRight":
                case "d":
                    if (snakeDirection !== "LEFT") snakeDirection = "RIGHT";
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
        const first = snakeCoordiantes[0];
        const last = snakeCoordiantes[snakeCoordiantes.length - 1];
        let next = first;

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
            console.log(frameRequest);
            cancelAnimationFrame(frameRequest);
            return;
        }
        // TODO: handle snake collision
        if (snakeCoordiantes.some(e => e.x === next.x && e.y === next.y)) {
            console.log(frameRequest);
            alert("GAME OVER, YOU RAN INTO YOUR OWN SNAKE!");
            cancelAnimationFrame(frameRequest);
            return;
        }
        // TODO: press up and left really fast... it lets you go back on your own snake!

        // add next to snake 
        cells[next.x][next.y].setStatus("snake");
        snakeCoordiantes.unshift(next);
        // handle food collision
        let foodIndex = foodCoordinates.findIndex(e => e.x === next.x && e.y === first.y);
        if (foodIndex !== -1) {
            // remove food
            foodCoordinates.splice(foodIndex, 1);
            // respawn food
            foodCoordinates = spawnFood(foodCoordinates);
            // TODO: update score 
        } else {
            // remove last from snake
            cells[last.x][last.y].setStatus("empty");
            snakeCoordiantes.pop();
        }


        setTimeout(() => { frameRequest = window.requestAnimationFrame(nextFrame) }, FRAME_INTERVAL)
    }

    nextFrame();
}


// Spawn Food
// Spawn Snake
// Move Snake
// If Snake pos = food pos, remove food, respawn food... 

// there should be one source of truth ...

// Returns window dimension bounds in px
function getBounds() {
    var e = window,
        a = "inner";
    if (!("innerWidth" in window)) {
        a = "client";
        e = document.documentElement || document.body;
    }
    return { width: e[a + "Width"], height: e[a + "Height"] };
}