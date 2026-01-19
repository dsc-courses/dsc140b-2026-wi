// ok, so, basically this code is not good
// i don't know javascript
// chatgpt most wrote of the below
PASTELRED = "#d20000";
PASTELBLUE = "#007aff";
PASTELPURPLE = "#6E66BA";
PASTELYELLOW = "#FBC05E";
PASTELGREEN = "#8fc34f";

function make_data_0() {

    let x = [
        -3.4, -2.8, -2.1, -1.4, -0.9, 0.5, .9, 1.7, 2.3, 3.2, 3.5, 4.2
    ];

    let y = Array(x.length).fill(0);

    let delta = [
        -0.31420552,  0.58716784,
        -0.14771454,  0.1945921 , -0.08954943,
        -0.42894763,  0.38777209, -0.50625193,
        0.63611341, 0.86743565, -.31, .32
    ];

    for (let i=0; i<x.length; i++) {
        y[i] = 0 + delta[i];
    }

    return [x, y]
}

function make_data() {

    let x = [
        -3.4, -2.8, -2.1, -1.4, -0.9, 0.5, .9, 1.7, 2.3, 3.2, 3.5, 4.2
    ];

    let y = Array(x.length).fill(0);

    let delta = [
        -0.31420552,  0.58716784,
        -0.14771454,  0.1945921 , -0.08954943,
        -0.82894763,  0.68777209, -0.70625193,
        -0.93611341, -0.86743565, -.31, .32
    ];

    for (let i=0; i<x.length; i++) {
        y[i] = x[i] + delta[i];
    }

    return [x, y]
}

function make_data_2() {
    let x = [
        -3.4, -2.8, -2.1, -1.4, -0.9, 0.5, .9, 1.7, 2.3, 3.2, 3.5, 4.2
    ];

    let y = Array(x.length).fill(0);

    let delta = [
        -0.31420552,  0.58716784,
        -0.14771454,  0.1945921 , -0.08954943,
        -0.82894763,  0.68777209, -0.70625193,
        -0.93611341, -0.86743565, -.31, .32
    ];

    for (let i=0; i<x.length; i++) {
        y[i] = Math.abs(x[i]) + delta[i];
    }

    return [x, y]
}


function sketch_scatter (sketch) {

    let figure;
    let data;
    let x;
    let y;

    let theta;
    let u1;
    let u2;

    let variance;
    let variances = {};

    function rotate(pt, theta) {
        return [
            Math.cos(theta) * pt[0] - Math.sin(theta) * pt[1],
            Math.sin(theta) * pt[0] + Math.cos(theta) * pt[1]
        ]
    }

    function draw_unit_vector() {
        figure.plot([0, 2*u1], [0, 2*u2]);

        let arrow_width = .075;

        let t1 = rotate([1.9, arrow_width], theta);
        let t2 = rotate([1.9, -arrow_width], theta);

        st0 = figure.screen_coordinates([2*u1, 2*u2]);
        st1 = figure.screen_coordinates(t1);
        st2 = figure.screen_coordinates(t2);

        sketch.triangle(...st0, ...st1, ...st2);
    }

    function draw_projections() {
        for (let i=0; i<x.length; i++) {
            let ox = x[i];
            let oy = y[i];

            let dp = ox * u1 + oy * u2;

            let px = dp * u1;
            let py = dp * u2;

            sketch.noFill();
            sketch.stroke("black");
            sketch.strokeWeight(2);

            figure.scatter([px], [py], 15);

            sketch.noFill();

            sketch.stroke(PASTELRED);
            sketch.strokeWeight(2);
            sketch.drawingContext.setLineDash([5, 5]);

            figure.plot([ox, px], [oy, py]);

            sketch.drawingContext.setLineDash([]);

        }
    }

    function compute_variance() {

        function computeVariance(arr) {
            const n = arr.length;
            const mean = arr.reduce((acc, val) => acc + val, 0) / n;
            const variance = arr.reduce((acc, val) => acc + (val - mean) ** 2, 0) / n;
            return variance;
        }

        let zs = [];
        for (let i=0; i<x.length; i++) {
            let ox = x[i];
            let oy = y[i];

            let z = ox * u1 + oy * u2;
            zs.push(z);
        }

        let v = computeVariance(zs);
        variances[theta] = v;
        return v;
    }

    function draw_variance() {
        const sortedKeys = Object.keys(variances).sort();

        let data_choice = sketch.select('#dataset').value();
        let s;
        if (data_choice == 1) {
            s = .25;
        } else {
            s = .5;
        }
        for (const key of sortedKeys) {
            let value = variances[key];
            let px = Math.cos(key) * value * s;
            let py = Math.sin(key) * value * s;
            sketch.noStroke();
            sketch.fill(PASTELPURPLE);
            figure.scatter([px], [py]);
        }
    }

    function draw_dashed_line() {
        sketch.drawingContext.setLineDash([10, 10]);

        sketch.stroke(PASTELBLUE + '55')
        figure.plot([-9*u1, 9*u1], [-9*u2, 9*u2]);

        sketch.drawingContext.setLineDash([]);
    }

    sketch.setup = function() {
        let div = sketch.select('#canvas-scatter');

        // put setup code here
        let w = div.width * .75
        let scale = w / 8;
        sketch.createCanvas(w, w);
        figure = new Figure(sketch, [0, 0], [-4, 4], [-4, 4], scale, scale);

        let data_choice = sketch.select('#dataset');
        data_choice.changed(
            () => {
                variances = [];
            }
        );

        let clearButton = sketch.select('#clear');
        clearButton.mousePressed(() => {
          variances = [];
        });
    }


    sketch.draw = function() {
        sketch.background('#fff');

        let data_choice = sketch.select('#dataset').value();
        if (data_choice == 1) {
            data = make_data();
        } else if (data_choice == 0) {
            data = make_data_0();
        } else {
            data = make_data_2();
        }

        [x, y] = data;

        theta = sketch.select('#theta').value();
        u1 = Math.cos(theta);
        u2 = Math.sin(theta);

        sketch.select('#u1').html(u1.toFixed(3));
        sketch.select('#u2').html(u2.toFixed(3));

        sketch.strokeWeight(2);
        sketch.stroke('black');
        sketch.fill("#000000");
        figure.draw_axes();
        figure.scatter(x, y);

        sketch.stroke(PASTELBLUE);
        sketch.strokeWeight(5);

        draw_unit_vector();
        draw_dashed_line();
        let show_proj = sketch.select("#show-projections").checked();
        if (show_proj) {
            draw_projections();
        }

        variance = compute_variance();
        sketch.select('#variance').html(variance.toFixed(3));

        let show_variances = sketch.select("#show-variances").checked();
        if (show_variances) {
            draw_variance();
        }

    }

}

new p5(sketch_scatter, 'canvas-scatter');
