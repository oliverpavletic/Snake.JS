/* JAVASCRIPT SNAKE by Oliver Pavletic */

// TODO: declutter global scope

// TODO: font Press Start 2P

// FEATURES:
// TODO: animate 'eating' food: food moves through the snake, when it reaches the end it animates from yellow to red
// TODO: game over screen
// TODO: pause screen
// TODO: main menu screen
// TODO: options
// TODO: maps/difficulties/etc.

const FRAME_INTERVAL = 100; // miliseconds
const GAME_DIMS = { HEIGHT_IN_CELLS: 27, WIDTH_IN_CELLS: 48, MARGIN_IN_CELLS: 5, ASPECT_RATIO: (16 / 9) };
// const CELL_SIZE = 25; NO LONGER NEEDED, cell size now dependent on screen
const NUM_FOOD_PIECES = 1;
const SNAKE_INIT_SIZE = 5; // TODO: what if this is larger than the initial board?
const SNAKE_INIT_DIR = "RIGHT";
const GAME_CONT_COLOR = "grey"; // TODO: delete eventually
const SNAKE_CONT_COLOR = "black"; // TODO: delete eventually
const CELL_COLOR_SCHEME = { empty: "white", food: "yellow", snake: "red", digest: "green" };
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
        //div.style.border = "solid";
        // div.className = "cell" TODO: modify using style sheet selectors! reduce clutter & repition!
        div.id = this.id;
        return div;
    }
}

// set up the game board and cells
window.onload = () => {
    // TODO!!: clean up this section 
    // TODO: investiage percentages to make this easier!!!


    // modify body style
    document.body.style.margin = "0px";

    // get screen dimensions (px)
    let bounds = getBounds();
    let screenHeight = bounds.height;
    let screenWidth = bounds.width;

    // TODO: the cell size should be defined by EITHER width or height depending on if the 
    // ratio is above 16:9 or below
    let screenAspectRatio = screenWidth / screenHeight;
    let gameAspectRation = GAME_DIMS.WIDTH_IN_CELLS / GAME_DIMS.HEIGHT_IN_CELLS;

    let totalWidthInCells = null;
    let totalHeightInCells = null;
    let cellSize = null;
    let heightCorrection = 0;
    let widthCorrection = 0;
    let topMargin = 0;
    let sideMargin = 0;

    // max out the height, compensate the width
    if (gameAspectRation < screenAspectRatio) {
        // total height (cells)
        totalHeightInCells = GAME_DIMS.HEIGHT_IN_CELLS + (2 * GAME_DIMS.MARGIN_IN_CELLS);
        // cell size (px)
        cellSize = Math.floor(screenHeight / totalHeightInCells);
        // width correction (px)
        widthCorrection = screenWidth - (GAME_DIMS.WIDTH_IN_CELLS * cellSize);
        // top
        topMargin = GAME_DIMS.MARGIN_IN_CELLS * cellSize;
        // side
        sideMargin = widthCorrection / 2;
        console.log("1");
    } else {
        // total width (cells)
        totalWidthInCells = GAME_DIMS.WIDTH_IN_CELLS + (2 * GAME_DIMS.MARGIN_IN_CELLS);
        // cell size (px)
        cellSize = Math.floor(screenWidth / totalWidthInCells);
        // height correction
        heightCorrection = screenHeight - (GAME_DIMS.HEIGHT_IN_CELLS * cellSize);
        // top
        topMargin = heightCorrection / 2;
        // side
        sideMargin = GAME_DIMS.MARGIN_IN_CELLS * cellSize;
        console.log("2");
    }

    console.log(`Screen Height: ${screenHeight}`);
    console.log(`Total Height (cells) ${totalHeightInCells}`);
    console.log(`Cell size: ${cellSize}`);
    console.log(`Top Margin: ${topMargin}`);

    // define game container 
    let gameContainer = document.createElement("div");
    gameContainer.style.background = GAME_CONT_COLOR;
    gameContainer.style.position = "relative";
    gameContainer.style.height = `${screenHeight}px`;
    gameContainer.style.width = `${screenWidth}px`;
    gameContainer.id = "game-container";

    // define score display
    let scoreDisplay = document.createElement("div");
    scoreDisplay.style.position = "absolute";
    scoreDisplay.style.bottom = `${screenHeight}px`;
    scoreDisplay.style.right = `${screenWidth - (sideMargin + (cellSize * GAME_DIMS.WIDTH_IN_CELLS))}px`;
    scoreDisplay.style.fontSize = `${cellSize}px`;
    scoreDisplay.innerHTML = "SCORE: <span id=\"score\">0</span>";
    scoreDisplay.style.color = "white";
    scoreDisplay.background = "red";
    scoreDisplay.id = "score-display";

    // define snake container 
    let snakeContainer = document.createElement("div");
    snakeContainer.style.background = SNAKE_CONT_COLOR;
    snakeContainer.style.top = `${topMargin}px`;
    snakeContainer.style.left = `${sideMargin}px`;
    snakeContainer.style.position = "relative";
    snakeContainer.style.display = "inline-block";
    snakeContainer.id = "snake-container";

    // define cell matrix
    let cells = [];
    for (var i = 0; i < GAME_DIMS.WIDTH_IN_CELLS; i++) {
        cells[i] = [];
        for (var j = 0; j < GAME_DIMS.HEIGHT_IN_CELLS; j++) {
            // assign cell to corresponding index in the cells matrix
            cells[i][j] = new Cell(i, j, cellSize, "empty");
            // append newly created cell to game container
            snakeContainer.appendChild(cells[i][j].html);
        }
    }

    // append score display to game container
    gameContainer.appendChild(scoreDisplay);

    // append snake container to game container
    gameContainer.appendChild(snakeContainer);

    // append game container to document body
    document.body.appendChild(gameContainer);

    // game board is now set up, start game and pass newly created cells
    startGame(cells);
}

// TODO: implement a more robust resizing mechanism

// If screen is resized, reload the page
//window.onresize = function () { location.reload(); }

// game manager
function startGame(newCells) {
    let cells = newCells;
    let gameWidthInCells = cells.length;
    let gameHeightInCells = cells[0].length;
    let snakeCoordinates = spawnSnake();
    let foodCoordinates = spawnFood([]);
    let snakeDirection = SNAKE_INIT_DIR;
    let snakeDirectionStack = [];
    let gameScore = 0;

    // TODO: refactor to combine cell.setStatus and coordinates.push, thinking about one source of truth,
    // and how to make it difficult to have conflicting 'truths'
    // have one function where changing the status of a given cell also adds it to coordinates and such

    // TODO: refactor spawnSnake() to make it more stateless and so it can be used in the frame updating? well that would be more inefficent so idk..

    // spawn snake 
    function spawnSnake() {
        let coordinates = [];

        // add center cell to snake
        let center = { x: Math.floor(gameWidthInCells / 2), y: Math.floor(gameHeightInCells / 2) };
        cells[center.x][center.y].setStatus("snake"); // FLAG: refactor
        coordinates.push(center);

        // add remaining cells to snake
        for (var i = 0; i < SNAKE_INIT_SIZE - 1; i++) {
            cells[center.x - (i + 1)][center.y].setStatus("snake"); // FLAG: refactor
            coordinates.push({ x: center.x - (i + 1), y: center.y });
        }

        return coordinates;
    }

    // TODO: test issue with food respawn... not always respawning all food

    // spawn intial food
    function spawnFood(oldFoodCoordinates) {
        let newFoodCoordinates = oldFoodCoordinates;
        let numExistingFoodPieces = newFoodCoordinates.length;
        let randomCell = null;

        // spawn as many food pieces s.t the total pieces of food is always equal to NUM_FOOD_PIECES
        for (var i = 0; i < NUM_FOOD_PIECES - numExistingFoodPieces; i++) {

            // do-while to avoid duplicate food pieces and collisions with snake coordinates
            do {
                randomCell = { x: Math.floor(Math.random() * gameWidthInCells), y: Math.floor(Math.random() * gameHeightInCells) };
            } while ((newFoodCoordinates.concat(snakeCoordinates)).some(e => e.x === randomCell.x && e.y === randomCell.y));

            cells[randomCell.x][randomCell.y].setStatus("food"); // FLAG: refactor
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
        let foodIndex = foodCoordinates.findIndex(e => e.x === next.x && e.y === next.y);

        if (foodIndex !== -1) {
            // remove food
            foodCoordinates.splice(foodIndex, 1);
            // respawn food
            foodCoordinates = spawnFood(foodCoordinates);
            // update score 
            document.getElementById('score').innerHTML = ++gameScore;
            // TODO: digest animation
            // make current cell turn SPECIAL COLOR until to its left is red, and right is white!
        } else {
            // no food collision: remove last cell from snake
            cells[last.x][last.y].setStatus("empty");
            snakeCoordinates.pop();
        }

        // request new frame every FRAME_INTERVAL
        setTimeout(() => { frameRequest = window.requestAnimationFrame(nextFrame) }, FRAME_INTERVAL)
    }

    // request first frame
    nextFrame();
}

// TODO: reduce the need for this by instead representing directions with numbers.. or even enum! doing some div or mod stuff
// helper function: return true if the direction arguments conflict, otherwise return false (even if an argument is undefined)
function conflict(firstDir, secondDir) {
    if (firstDir === "UP" && secondDir === "DOWN") return true;
    if (firstDir === "DOWN" && secondDir === "UP") return true;
    if (firstDir === "LEFT" && secondDir === "RIGHT") return true;
    if (firstDir === "RIGHT" && secondDir === "LEFT") return true;
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