/* JAVASCRIPT SNAKE by Oliver Pavletic */

const cellSize = 25;
const gameContainerColor = "black"; // TODO: delete eventually
const cellColorScheme = { empty: "white", food: "yellow", snake: "red" };

class Cell {
    constructor(x, y, size, status, colorScheme) {
        this.x = x;
        this.y = y;
        this.size = size;
        // TODO: make this an enum with symbols?
        this.status = status; // empty, food, or snake
        this.colorScheme = colorScheme;
    }

    get html() {
        return this.generateHTML();
    }

    generateHTML() {
        let div = document.createElement("div");
        div.style.background = this.colorScheme[this.status];
        div.style.height = `${this.size}px`;
        div.style.width = `${this.size}px`;
        console.log(this.x);
        div.style.position = "absolute";
        div.style.left = `${this.x * this.size}px`;
        div.style.top = `${this.y * this.size}px`;
        div.style.border = "solid";
        return div;
    }
}

window.onload = () => {
    // Get screen dimensions
    let bounds = getBounds();
    let screenHeight = bounds.height;
    let screenWidth = bounds.width;

    // Number of cells vertically and horizontally 
    let gameHeightInCells = Math.floor(screenHeight / cellSize);
    let gameWidthInCells = Math.floor(screenWidth / cellSize);

    // Game container dimensions
    let gameContainerHeight = gameHeightInCells * cellSize;
    let gameContainerWidth = gameWidthInCells * cellSize;

    // Define game container 
    let gameContainer = document.createElement("div");
    gameContainer.style.background = gameContainerColor;
    gameContainer.style.height = `${gameContainerHeight}px`;
    gameContainer.style.width = `${gameContainerWidth}px`;
    gameContainer.id = "game-container";

    // Define cell matrix

    let cells = [];
    for (var i = 0; i < gameWidthInCells; i++) {
        cells[i] = [];
        for (var j = 0; j < gameHeightInCells; j++) {
            // assign cell to corresponding index in the cells matrix
            cells[i][j] = new Cell(i, j, cellSize, "empty", cellColorScheme);
            // append newly created cell to game container
            gameContainer.appendChild(cells[i][j].html);
        }
    }

    // Append game container to document body
    document.body.appendChild(gameContainer);
}

// there should be one source of truth ...

// we should have some mechanism of spawning food 

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