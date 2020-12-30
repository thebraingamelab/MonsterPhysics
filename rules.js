const values = {
    "fill_colors": ['red', 'green', 'blue'],
    "line_colors": ['red', 'green', 'blue'],
    "shape": ['triangle', 'rectangle', 'circle']
};

function makeRules() {
    let variable = randomElement(Object.entries(values));
    let randArray = shuffle([0, 1, 2]);
    let result = {};

    variable[1].forEach((key, i) => result[key] = randArray[i])
    return [variable[0], result];
}

let randomElement = (list) => list[Math.floor(Math.random() * list.length)];

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}