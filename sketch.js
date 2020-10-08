// constants
var SCREEN_WIDTH = 360;
var SCREEN_HEIGHT = 640;
var SIZE_FACTOR = SCREEN_WIDTH * SCREEN_HEIGHT / 640000;

var BALL_RADIUS = SCREEN_WIDTH/20;
var MOUTH_SIZE = SCREEN_WIDTH/5;

// module aliases
var Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Events = Matter.Events;

// creates an engine
var engine = Engine.create()

// Makes gravity that scales with height
// for some reason, at SIZE_FACTOR, collisions are not detected but they are at 95% original speed 
engine.world.gravity.y = SIZE_FACTOR * .95;

var render;

// creates all necessary game objects
var base = Bodies.rectangle(SCREEN_WIDTH / 2, SCREEN_HEIGHT - 110 * SIZE_FACTOR, 100 * SIZE_FACTOR, 160 * SIZE_FACTOR, { isStatic: true });
var mouth = Bodies.rectangle(SCREEN_WIDTH / 2, SCREEN_HEIGHT - 170 * SIZE_FACTOR, MOUTH_SIZE, MOUTH_SIZE/2, { isStatic: true });
var teethA = Bodies.polygon(SCREEN_WIDTH / 2 - 30 * SIZE_FACTOR, SCREEN_HEIGHT - 200 * SIZE_FACTOR, 3, 20 * SIZE_FACTOR, { isStatic: true })
Body.rotate(teethA, 7 * (Math.PI / 6));
var teethB = Bodies.polygon(SCREEN_WIDTH / 2 + 30 * SIZE_FACTOR, SCREEN_HEIGHT - 200 * SIZE_FACTOR, 3, 20 * SIZE_FACTOR, { isStatic: true })
Body.rotate(teethB, 7 * (Math.PI / 6));
var fruit;
var ground = Bodies.rectangle(SCREEN_WIDTH / 2 - 10, SCREEN_HEIGHT, SCREEN_WIDTH + 20, 110 * SIZE_FACTOR, { isStatic: true });
ground.collisionFilter.mask = -1;
var butWidth = 150 * SIZE_FACTOR;
var butHeight = 100 * SIZE_FACTOR;
var button = Bodies.rectangle(SCREEN_WIDTH - butHeight * 1.5, butHeight * 1.5, butWidth, butHeight, { isStatic: true });

var canMovePlayer = true;

var x = Bodies.circle(50, 50, 50, {isStatic : true});
var y = Bodies.circle(25, 25, 25, {isStatic : true});

var levelQueue = [[x], [y], [x], [y]];

function render_func() {

    canMovePlayer = true;

    // why does fruit keep it's gravity?
    // it should clear after intitializing the new fruit
    // maybe place an object under it that's invisible?
    // or make a super script that intializes this script every time
    fruit = Bodies.circle(SCREEN_WIDTH / 2, 50, BALL_RADIUS, {isStatic : true});
    fruit.collisionFilter.group = -1;

    // create a renderer
    render = Render.create({
        element: document.body,
        canvas: canvas,
        options: {
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT
        },
        engine: engine
    });

    // add all of the bodies to the world
    if(levelQueue.length != 0) {
        World.add(engine.world, [ground, base, fruit, teethA, teethB, mouth, button].concat(levelQueue.shift())/*.concat(decode(levelQueue.shift()))*/);
    }

    // run the engine
    Engine.run(engine);

    // run the renderer
    Render.run(render);
}

function clear() {
    console.log("cleared");
    World.clear(engine.world);
    Engine.clear(engine);
    Render.stop(render);
    render.context = null;
    render.textures = {};

    render_func();
}

// activates on hold and drag
function move(event) {
    if (canMovePlayer) {
        var mousex = event.touches[0].clientX;
        if (mousex > SCREEN_WIDTH) {
            mousex = SCREEN_WIDTH;
        }
        if (mousex < 0) {
            mousex = 0;
        }

        Body.translate(mouth, { x: mousex - mouth.position.x, y: 0 });
        Body.translate(teethA, { x: mousex - teethA.position.x - 30 * SIZE_FACTOR, y: 0 });
        Body.translate(teethB, { x: mousex - teethB.position.x + 30 * SIZE_FACTOR, y: 0 });
        Body.translate(base, { x: mousex - base.position.x, y: 0 });
    }
}

// makes the player unable to move and starts the fruit's physics
function phase2() {
    canMovePlayer = false;
    Body.setStatic(fruit, false);
}

// checks if the start button is pressed
function startHuh(event) {
    var mousex = event.touches[0].clientX;
    var mousey = event.touches[0].clientY;
    var butxrange = [button.position.x - butWidth / 2, button.position.x + butWidth / 2];
    var butyrange = [button.position.y - butHeight / 2, button.position.y + butHeight / 2];
    if (mousex >= butxrange[0] && mousex <= butxrange[1] && mousey >= butyrange[0] && mousey <= butyrange[1]) {
        phase2();
    }
}

// runs collision events (win/lose)
Events.on(engine, 'collisionStart', function (event) {
    var pairs = event.pairs;
    var bodyA = pairs[0].bodyA;
    var bodyB = pairs[0].bodyB;

    if (bodyA === fruit || bodyB === fruit) {
        // if one is mouth and the other is fruit, win condition
        if (bodyA === mouth || bodyB === mouth) {
            console.log("win");
            // uses the difference in position of the bodies to calculate accuracy
            console.log(Math.abs(bodyA.position.x - bodyB.position.x));
            clear();
        }
        // if one is ground and the other is fruit, lose
        if (bodyA === ground || bodyB === ground) {
            console.log("lose");
            clear();
        }
    }
});

// takes in a level json, returns the level as an array of Matte.js Bodies
function decode(shapesText) {
    var parse = JSON.parse(shapesText);
    console.log(parse);
    shapes = [];

    for (var i = 0; i < parse.length; i++) {
        var shape;

        switch (parse[i].shapeType) {
            case 0:
                shape = Bodies.rectangle(parse[i].xpos, parse[i].ypos, parse[i].properties.length, parse[i].properties.length, { isStatic: true });
                break;
            case 1:
                shape = Bodies.rectangle(parse[i].xpos, parse[i].ypos, parse[i].properties.width, parse[i].properties.height, { isStatic: true });
                break;
            case 2:
                shape = Bodies.circle(parse[i].xpos, parse[i].ypos, parse[i].properties.radius, { isStatic: true });
                break;
            // possibly remove/revise triangles/trapezoids to deal with phasing issue
            // phasing issues seem to be resolved with bigger fruit and slower gravity
            case 3:
            case 4:
                shape = Bodies.trapezoid(parse[i].xpos, parse[i].ypos, parse[i].properties.width, parse[i].properties.height, parse[i].properties.slope, { isStatic: true });
        }

        shape.collisionFilter.mask = -1;
        shape.friction = 0.025;
        Body.rotate(shape, parse[i].rotation);

        shapes[i] = shape;
    }

    return shapes;
}

render_func();