/* JAVASCRIPT SNAKE by Oliver Pavletic */

const CELL_SIZE = 25;
const NUM_FOOD_PIECES = 10;
const GAME_CONT_COLOR = "black"; // TODO: delete eventually
const CELL_COLOR_SCHEME = { empty: "white", food: "yellow", snake: "red" };

class Cell {
    constructor(x, y, size, status, colorScheme) {
        this.x = x;
        this.y = y;
        this.size = size;
        // TODO: make this an enum with symbols?
        this.status = status; // empty, food, or snake
        this.colorScheme = colorScheme;
        this.id = `cell-${x}-${y}`; // DOM id
    }

    setStatus(newStatus) {
        this.status = newStatus;
        let cell = document.getElementById(this.id);
        cell.style.background = this.colorScheme[this.status];
    }

    get html() {
        return this.generateHTML();
    }

    generateHTML() {
        let div = document.createElement("div");
        div.style.background = this.colorScheme[this.status];
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

// Game Manager:
function startGame(newCells) {
    let cells = newCells;
    let width = cells.length;
    let height = cells[0].length;
    spawnFood();

    // spawn intial food
    function spawnFood() {
        let foodCoordinates = []; // track coordinate to avoid duplicates
        for (var i = 0; i < NUM_FOOD_PIECES; i++) {
            let randomCell = { x: 0, y: 0 };
            do {
                randomCell = { x: Math.floor(Math.random() * width), y: Math.floor(Math.random() * height) };
            } while (foodCoordinates.some(e => e.x === randomCell.x && e.y === randomCell.y));

            cells[randomCell.x][randomCell.y].setStatus("food");
            foodCoordinates.push(randomCell);
        }
    }

    // spawn snake
    // for the begining, the snake should just be a block
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