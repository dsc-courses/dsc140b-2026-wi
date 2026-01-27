// 3D Point Cloud Visualization with Principal Components
// Shows a prolate spheroid (football shape) with eigenvectors

const PASTELRED = "#d20000";
const PASTELBLUE = "#007aff";
const PASTELGREEN = "#8fc34f";
const POINTCOLOR = "#4a4a4a";

// Eigenvalues (variances along each principal direction)
const LAMBDA1 = 9.0;   // largest - along the length
const LAMBDA2 = 3.24;  // medium
const LAMBDA3 = .5;  // smallest - thin direction

// Standard deviations
const STD1 = Math.sqrt(LAMBDA1);  // 3.0
const STD2 = Math.sqrt(LAMBDA2);  // 1.8
const STD3 = Math.sqrt(LAMBDA3);  // 0.4

const NUM_POINTS = 200;

let points = [];

// Generate points from a 3D Gaussian (prolate spheroid)
function generatePoints() {
    points = [];

    // Box-Muller transform for generating normal random numbers
    function randn() {
        let u1 = Math.random();
        let u2 = Math.random();
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }

    for (let i = 0; i < NUM_POINTS; i++) {
        // Generate in principal component space
        let z1 = randn() * STD1;  // along first PC (largest spread)
        let z2 = randn() * STD2;  // along second PC (medium spread)
        let z3 = randn() * STD3;  // along third PC (smallest spread)

        points.push({x: z1, y: z2, z: z3});
    }
}

function sketch_3d(sketch) {

    let canvasSize = 500;
    let scale = 40;

    // Manual rotation tracking for touch support
    let angleX = 0.4;
    let angleY = 0.3;
    let dragging = false;
    let lastX, lastY;

    // Animation state for projections
    let animationProgress = 0;  // 0 = original positions, 1 = projected positions
    const ANIMATION_SPEED = 0.03;  // How fast the animation progresses per frame
    let wasShowingProjections = false;  // Track previous state to detect toggle

    sketch.setup = function() {
        let div = sketch.select('#canvas-3d');
        canvasSize = Math.min(div.width * 0.9, 600);
        let canvas = sketch.createCanvas(canvasSize, canvasSize, sketch.WEBGL);
        canvas.parent('canvas-3d');

        // Prevent default touch behavior on canvas to avoid scrolling
        canvas.elt.addEventListener('touchstart', function(e) {
            if (e.touches.length === 1) {
                e.preventDefault();
                dragging = true;
                lastX = e.touches[0].clientX;
                lastY = e.touches[0].clientY;
            }
        }, { passive: false });

        canvas.elt.addEventListener('touchmove', function(e) {
            if (dragging && e.touches.length === 1) {
                e.preventDefault();
                let dx = e.touches[0].clientX - lastX;
                let dy = e.touches[0].clientY - lastY;
                angleY += dx * 0.01;
                angleX -= dy * 0.01;
                lastX = e.touches[0].clientX;
                lastY = e.touches[0].clientY;
            }
        }, { passive: false });

        canvas.elt.addEventListener('touchend', function(e) {
            dragging = false;
        });

        generatePoints();

        // Update eigenvalue display
        sketch.select('#lambda1').html(LAMBDA1.toFixed(2));
        sketch.select('#lambda2').html(LAMBDA2.toFixed(2));
        sketch.select('#lambda3').html(LAMBDA3.toFixed(2));
    }

    sketch.mousePressed = function() {
        if (sketch.mouseX > 0 && sketch.mouseX < canvasSize &&
            sketch.mouseY > 0 && sketch.mouseY < canvasSize) {
            dragging = true;
            lastX = sketch.mouseX;
            lastY = sketch.mouseY;
        }
    }

    sketch.mouseReleased = function() {
        dragging = false;
    }

    sketch.mouseDragged = function() {
        if (dragging) {
            let dx = sketch.mouseX - lastX;
            let dy = sketch.mouseY - lastY;
            angleY += dx * 0.01;
            angleX -= dy * 0.01;
            lastX = sketch.mouseX;
            lastY = sketch.mouseY;
        }
    }

    sketch.draw = function() {
        sketch.background(255);

        // Apply rotation
        sketch.rotateX(angleX);
        sketch.rotateY(angleY);


        // Draw coordinate axes (faint)
        sketch.strokeWeight(1);
        sketch.stroke(200);
        let axisLen = 150;
        sketch.line(-axisLen, 0, 0, axisLen, 0, 0);
        sketch.line(0, -axisLen, 0, 0, axisLen, 0);
        sketch.line(0, 0, -axisLen, 0, 0, axisLen);

        // Check projection state and update animation
        let showProjections = sketch.select("#show-projections").checked();

        // When projections is toggled on, uncheck residuals
        if (showProjections && !wasShowingProjections) {
            sketch.select("#show-residuals").elt.checked = false;
        }
        wasShowingProjections = showProjections;

        // Animate towards target state
        if (showProjections && animationProgress < 1) {
            animationProgress = Math.min(1, animationProgress + ANIMATION_SPEED);
        } else if (!showProjections && animationProgress > 0) {
            animationProgress = Math.max(0, animationProgress - ANIMATION_SPEED);
        }

        // Draw points (interpolated between original and projected positions)
        sketch.noStroke();
        sketch.fill(POINTCOLOR);
        for (let p of points) {
            // Original position
            let origX = p.x * scale;
            let origY = -p.z * scale;  // z maps to screen y
            let origZ = p.y * scale;   // y maps to screen z

            // Projected position (onto PC1-PC2 plane, which is y=0 in screen coords)
            let projX = p.x * scale;
            let projY = 0;
            let projZ = p.y * scale;

            // Interpolate based on animation progress
            let drawX = sketch.lerp(origX, projX, animationProgress);
            let drawY = sketch.lerp(origY, projY, animationProgress);
            let drawZ = sketch.lerp(origZ, projZ, animationProgress);

            sketch.push();
            sketch.translate(drawX, drawY, drawZ);
            sketch.sphere(4);
            sketch.pop();
        }

        // Draw eigenvectors if checkbox is checked
        let showEigenvectors = sketch.select("#show-eigenvectors").checked();
        if (showEigenvectors) {
            drawEigenvector(1, 0, 0, STD1 * 1.5, PASTELRED, scale);   // PC1 along x
            drawEigenvector(0, 0, 1, STD2 * 1.5, PASTELBLUE, scale);  // PC2 along z (shown as y in view)
            drawEigenvector(0, 1, 0, STD3 * 1.5, PASTELGREEN, scale); // PC3 along y (shown as z in view)
        }

        // Draw residuals if checkbox is checked
        let showResiduals = sketch.select("#show-residuals").checked();

        // Draw projection plane and lines when animating or showing projections
        if (animationProgress > 0) {
            drawProjections(scale, animationProgress);
        }

        // Draw the PC1-PC2 plane if residuals are shown (and not already drawn by projections)
        if (showResiduals && animationProgress === 0) {
            drawPlane(scale);
        }

        if (showResiduals) {
            drawResiduals(scale);
        }
    }

    function drawEigenvector(dx, dy, dz, length, color, s) {
        sketch.stroke(color);
        sketch.strokeWeight(4);

        let x1 = -dx * length * s;
        let y1 = dy * length * s;
        let z1 = -dz * length * s;
        let x2 = dx * length * s;
        let y2 = -dy * length * s;
        let z2 = dz * length * s;

        sketch.line(x1, y1, z1, x2, y2, z2);

        // Draw arrow head
        sketch.push();
        sketch.translate(x2, y2, z2);
        sketch.fill(color);
        sketch.noStroke();
        sketch.sphere(8);
        sketch.pop();
    }

    function drawProjections(s, progress) {
        // Lines fade out as points collapse onto the plane
        let lineAlpha = sketch.map(progress, 0, 1, 100, 0);
        sketch.stroke(150, 150, 150, lineAlpha);
        sketch.strokeWeight(1);

        // Project onto PC1-PC2 plane (z=0 in our coordinate system)
        for (let p of points) {
            // Original position
            let origX = p.x * s;
            let origY = -p.z * s;
            let origZ = p.y * s;

            // Projected position
            let px = p.x * s;
            let py = 0;
            let pz = p.y * s;

            // Current animated position
            let currX = sketch.lerp(origX, px, progress);
            let currY = sketch.lerp(origY, py, progress);
            let currZ = sketch.lerp(origZ, pz, progress);

            // Draw line from current point position to projection (fades as they converge)
            if (lineAlpha > 1) {
                sketch.line(currX, currY, currZ, px, py, pz);
            }
        }

        // Draw the projection plane (PC1-PC2 plane)
        drawPlane(s);
    }

    function drawResiduals(s) {
        sketch.stroke(180, 100, 180, 180);  // Purple color for residuals
        sketch.strokeWeight(1);

        for (let p of points) {
            // Original position
            let origX = p.x * s;
            let origY = -p.z * s;
            let origZ = p.y * s;

            // Projected position (onto PC1-PC2 plane)
            let px = p.x * s;
            let py = 0;
            let pz = p.y * s;

            // Draw residual line from original to projection
            sketch.line(origX, origY, origZ, px, py, pz);
        }
    }

    function drawPlane(s) {
        sketch.push();
        sketch.fill(200, 200, 200, 50);
        sketch.noStroke();
        sketch.rotateX(sketch.HALF_PI);
        sketch.plane(STD1 * 3 * s, STD2 * 3 * s);
        sketch.pop();
    }
}

new p5(sketch_3d, 'canvas-3d');
