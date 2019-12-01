// "global" variables
var canMove = true;

var SCREEN_WIDTH = 360;
var SCREEN_HEIGHT = 640;
var SIZE_FACTOR = SCREEN_WIDTH * SCREEN_HEIGHT / 640000;

// module aliases
var Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Events = Matter.Events;

// create an engine
var engine = Engine.create();

// create a renderer
var render = Render.create({
    element: document.body,
    canvas: canvas,
    options: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT},
    engine: engine
});

// creates all necessary game objects

var base = Bodies.rectangle(SCREEN_WIDTH/2, SCREEN_HEIGHT - 110 * SIZE_FACTOR, 100 * SIZE_FACTOR,  160 * SIZE_FACTOR, {isStatic: true});
var mouth = Bodies.rectangle(SCREEN_WIDTH/2, SCREEN_HEIGHT - 165 * SIZE_FACTOR, 60 * SIZE_FACTOR, 60 * SIZE_FACTOR, {isStatic: true});
var teethA = Bodies.polygon(SCREEN_WIDTH/2 - 30 * SIZE_FACTOR, SCREEN_HEIGHT - 200 * SIZE_FACTOR, 3, 20 * SIZE_FACTOR , {isStatic: true})
Body.rotate(teethA, 7 * (Math.PI/6));
var teethB = Bodies.polygon(SCREEN_WIDTH/2 + 30 * SIZE_FACTOR, SCREEN_HEIGHT - 200 * SIZE_FACTOR, 3, 20 * SIZE_FACTOR, {isStatic: true})
Body.rotate(teethB, 7 * (Math.PI/6));
var fruit = Bodies.circle(SCREEN_WIDTH/2, 50, 7.5 * SIZE_FACTOR, {isStatic: true});
var ground = Bodies.rectangle(SCREEN_WIDTH/2 - 10, SCREEN_HEIGHT, SCREEN_WIDTH + 20, 110 * SIZE_FACTOR, {isStatic: true});
ground.collisionFilter.mask = -1;
var butWidth = 100 * SIZE_FACTOR;
var butHeight = 50 * SIZE_FACTOR;
var button = Bodies.rectangle(SCREEN_WIDTH - butWidth *2, butHeight * 2, butWidth, butHeight, {isStatic: true});

var border0 = Bodies.rectangle(0, SCREEN_HEIGHT/2, 2, SCREEN_HEIGHT, {isStatic: true}),
    border1 = Bodies.rectangle(SCREEN_WIDTH, SCREEN_HEIGHT/2, 2, SCREEN_HEIGHT, {isStatic: true});


// add all of the bodies to the world
World.add(engine.world, [ground, base, fruit, teethA, teethB, mouth, button, border0, border1]);

// run the engine
Engine.run(engine);

// run the renderer
Render.run(render);

// activates on hold and drag
function move(event){
    if(canMove){
        var mousex = event.touches[0].clientX;

        Body.translate(mouth, {x: mousex - mouth.position.x, y: 0});
        Body.translate(teethA, {x: mousex - teethA.position.x - 30 * SIZE_FACTOR, y: 0});
        Body.translate(teethB, {x: mousex - teethB.position.x + 30 * SIZE_FACTOR, y: 0});
        Body.translate(base, {x: mousex - base.position.x, y: 0});
    }
}

// makes the player unable to move and starts the fruit's physics
function phase2(){
    canMove = false;
    Body.setStatic(fruit, false);
}

// checks if the start button is pressed
function startHuh(event){
    var mousex = event.touches[0].clientX;
    var mousey = event.touches[0].clientY;
    var butxrange = [button.position.x - butWidth/2, button.position.x + butWidth/2];
    var butyrange = [button.position.y - butHeight/2, button.position.y + butHeight/2];
    if(mousex >= butxrange[0] && mousex <= butxrange[1] && mousey >= butyrange[0] && mousey <= butyrange[1]){
        phase2();
    }
}

// runs collision events (win/lose)
Events.on(engine, 'collisionStart', function(event) {
    var pairs = event.pairs;
    var bodyA = pairs[0].bodyA;
    var bodyB = pairs[0].bodyB;

    if(bodyA === fruit || bodyB === fruit)
    {
        // if one is mouth and the other is fruit, win condition
        if(bodyA === mouth || bodyB === mouth){
            console.log("win");
        }
        // if one is floor and the other is floor, lose
        if(bodyA === ground || bodyB === ground){
            console.log("lose");
        }
    }
});

function decode(shapesText){
    var parse = JSON.parse(shapesText).info;
        shapes = [];

    for(var i = 0; i < parse.length; i++) {
        var shape;

        switch(parse[i].shapeType){
            case 0:
                shape = Bodies.rectangle(parse[i].xpos, parse[i].ypos, parse[i].properties.length, parse[i].properties.length, {isStatic: true});
                break;
            case 1:
                shape = Bodies.rectangle(parse[i].xpos, parse[i].ypos, parse[i].properties.width, parse[i].properties.height, {isStatic: true});
                break;
            case 2:
                shape = Bodies.circle(parse[i].xpos, parse[i].ypos, parse[i].properties.radius, {isStatic: true});
                break;
            case 3:
            case 4:
                shape = Bodies.trapezoid(parse[i].xpos, parse[i].ypos, parse[i].properties.width, parse[i].properties.height, parse[i].properties.slope, {isStatic: true});
        }

        shape.collisionFilter.mask = -1;
        shape.friction = 0.025;
        Body.rotate(shape, parse[i].rotation);

        shapes[i] = shape;
    }

    return shapes;
}