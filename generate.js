var canv = canvas;
var beatable = 0;
var total = 0;

var SCREEN_WIDTH = 300;
var SCREEN_HEIGHT = 600;
var SIZE_FACTOR = SCREEN_WIDTH * SCREEN_HEIGHT / 640000;

// all variables from gen are global to allow for data replacement
var engine,
    renderer,
    time,
    border0,
    border1,
    shapes,
    ground,
    hits,
    win,
    xposs,
    fruit,
    rand,
    genshapes,
    encodedShapes;

// module aliases
var Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Events = Matter.Events;

function gen() {
    // create an engine
    engine = Engine.create();

    // create a renderer
    render = Render.create({
        element: document.body,
        canvas: canv,
        options: {
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT},
        engine: engine
    });

    time = setTimeout( function(){kill(render, engine);} , 5000);

    shapes = [];

    border0 = Bodies.rectangle(0, SCREEN_HEIGHT/2, 2, SCREEN_HEIGHT, {isStatic: true});
    border1 = Bodies.rectangle(SCREEN_WIDTH, SCREEN_HEIGHT/2, 2, SCREEN_HEIGHT, {isStatic: true});

    ground = Bodies.rectangle(SCREEN_WIDTH/2, SCREEN_HEIGHT, SCREEN_WIDTH + 200, 400 * SIZE_FACTOR, {isStatic: true});
    ground.collisionFilter.mask = -1;

    hits = 0;
    win = false;
    xposs = [];

    fruit = [];
    fruit[0] = Bodies.circle(SCREEN_WIDTH/2, 50, 5 * SIZE_FACTOR);
    fruit[1] = Bodies.circle(SCREEN_WIDTH/2, 50, 5 * SIZE_FACTOR);
    fruit[2] = Bodies.circle(SCREEN_WIDTH/2, 51, 5 * SIZE_FACTOR);
    fruit[3] = Bodies.circle(SCREEN_WIDTH/2, 50, 5 * SIZE_FACTOR);
    fruit[4] = Bodies.circle(SCREEN_WIDTH/2, 49, 5 * SIZE_FACTOR);

    for(var i = 0; i < fruit.length; i++) {
        fruit[i].collisionFilter.group = -1;
    }

    shapes = [ground, border0, border1].concat(fruit);

    rand = Math.ceil(Math.random() * 7) + 3;

    genshapes = [];
    encodedShapes = [];

    for(var i = 0; i < rand; i++) {
        var randshape = Math.floor(Math.random() * 5);

        var randX = Math.random() * (SCREEN_WIDTH - 200) + 100,
            randY = Math.random() * (SCREEN_HEIGHT - 450) + 200;
        
        var shape;
            prop = {};

        switch(randshape){

            // 0 for square
            // default should never trigger. added here for contingency
            default:
            case 0:
                var side = Math.random() * 200 * SIZE_FACTOR + 1;
                prop = {
                    length : side
                };
                shape = Bodies.rectangle(randX, randY, side, side, {isStatic: true});
                break;

            // 1 for rectangle
            case 1:
                var width = Math.random() * 180 * SIZE_FACTOR + 20,
                    height = Math.random() * 180 * SIZE_FACTOR + 20;
                prop = {
                    width : width,
                    height : height
                };
                shape = Bodies.rectangle(randX, randY, width, height, {isStatic: true});
                break;

            // 2 for circle
            case 2:
                var radius = Math.random() * 100 * SIZE_FACTOR + 1;
                prop = {
                    radius : radius
                };
                shape = Bodies.circle(randX, randY, radius, {isStatic: true});
                break;

            // 3 and 4 for isoceles or right triangle
            case 3:
            case 4:
                var slope = randshape - 2,
                    width = Math.random() * 180 * SIZE_FACTOR + 20,
                    height = Math.random() * 180 * SIZE_FACTOR + 20;
                prop = {
                    slope : slope,
                    width : width,
                    height : height
                }
                shape = Bodies.trapezoid(randX, randY, width, height, slope, {isStatic: true});
                break;
        }
        shape.collisionFilter.mask = -1;

        rot = Math.random() * 2 * Math.PI;

        Body.rotate(shape, rot);
        genshapes[i] = shape;

        encodeShape = {
            xpos : randX,
            ypos : randY,
            shapeType : randshape,
            rotation : rot,
            properties : prop
        };
        encodedShapes[i] = encodeShape;
    }

    shapes = shapes.concat(genshapes);

    // add all of the bodies to the world
    World.add(engine.world, shapes);

    // run the engine
    Engine.run(engine);

    // run the renderer
    Render.run(render);

    //console.log(shapes);

    Events.on(engine, 'collisionStart', function(event) {
        var pairs = event.pairs;
        var bodyA = pairs[0].bodyA;
        var bodyB = pairs[0].bodyB;

        // level is considered not beatable if fruit does not move
        if((bodyA === fruit[0] || bodyB === fruit[0]) && (bodyA === ground || bodyB === ground)){
            if(fruit[0].position.x == SCREEN_WIDTH/2) {
                clearTimeout(time);
                kill(render, engine);
            }
        }
    });

    Events.on(engine, 'collisionActive', function(event) {
        var pairs = event.pairs;
        var bodyA = pairs[0].bodyA;
        var bodyB = pairs[0].bodyB;

        for(var i = 0; i < fruit.length; i++) {
            if((bodyA === fruit[i] || bodyB === fruit[i]) && (bodyA === ground || bodyB === ground)){
                xposs[i] = fruit[i].position.x;
                fruit[i].position.y = SCREEN_HEIGHT + 1000;
                hits++;
                win = hits >= fruit.length;

                if(win)
                {
                    clearTimeout(time);
                    kill(render, engine);
                }
            }
        }
    });
}

// stops render and engine and makes it ready to restart

function kill(render, engine) {
    console.log("Score: " + score());

    Matter.Render.stop(render); // this only stop renderer but not destroy canvas
    Matter.World.clear(engine.world);
    Matter.Engine.clear(engine);

    render.canvas.remove();
    render.canvas = null;
    render.context = null;
    render.textures = {};

    total++;

    console.log("Ratio: " + beatable + " : " + total + " (" + 100 * beatable/total + "%)");
    gen();
}

function variance(nums) {
    console.log("Nums: " + nums);
    var mean = 0,
        numerator = 0;
    for (var i = 0; i < nums.length; i++) {
        mean += nums[i];
    }
    mean /= nums.length;

    for (var i = 0; i < nums.length; i++) {
        numerator += Math.pow(nums[i] - mean, 2);
    }
    return numerator/(nums.length - 1);
}

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
        Body.rotate(shape, parse[i].rotation);

        shapes[i] = shape;
    }

    return shapes;
}

    // Scoring algorithm
    // Finds distance from error fruit to real fruit, and adds it together
    function score()
    {
        // returns -1 if not beatable
        if(!win){
            return -1;
        }
        beatable++;
        var vari = variance(xposs);
        
        //saveGameplayData(vari, JSON.stringify(encodedShapes));
        return vari;
    }

    function saveGameplayData(score, geo){
  
        var payload = {
          LevelID: randomID(8),
          Score : score,
          Geometry : geo
        };
      
        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://api.thebraingamelab.org/peachgobblerlevelsave');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function() {
          if(xhr.status == 200){
          }
        };
        xhr.send(JSON.stringify(payload));     
      }

      function randomID(length){
        var result = '';
        length = (typeof length == 'undefined') ? 32 : length;
        var chars = '0123456789abcdefghjklmnopqrstuvwxyz';
        for(var i = 0; i<length; i++){
          result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    }

gen();