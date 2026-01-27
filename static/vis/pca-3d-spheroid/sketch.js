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

// Rotation angles (radians) to rotate data away from standard basis
const ROTATE_X = 0.6;   // rotation around x-axis
const ROTATE_Y = 0.8;   // rotation around y-axis
const ROTATE_Z = 0.4;   // rotation around z-axis

let points = [];

// Principal component directions after rotation (unit vectors)
let pc1Dir = {x: 1, y: 0, z: 0};
let pc2Dir = {x: 0, y: 1, z: 0};
let pc3Dir = {x: 0, y: 0, z: 1};

// Project a point onto the PC1-PC2 plane (remove PC3 component)
function projectOntoPC1PC2(p) {
    // Projection: p_proj = p - (p · pc3Dir) * pc3Dir
    let dot = p.x * pc3Dir.x + p.y * pc3Dir.y + p.z * pc3Dir.z;
    return {
        x: p.x - dot * pc3Dir.x,
        y: p.y - dot * pc3Dir.y,
        z: p.z - dot * pc3Dir.z
    };
}

// Apply rotation matrix (Rz * Ry * Rx) to a point
function rotatePoint(x, y, z) {
    // Rotation around X-axis
    let cosX = Math.cos(ROTATE_X), sinX = Math.sin(ROTATE_X);
    let y1 = y * cosX - z * sinX;
    let z1 = y * sinX + z * cosX;
    let x1 = x;

    // Rotation around Y-axis
    let cosY = Math.cos(ROTATE_Y), sinY = Math.sin(ROTATE_Y);
    let x2 = x1 * cosY + z1 * sinY;
    let z2 = -x1 * sinY + z1 * cosY;
    let y2 = y1;

    // Rotation around Z-axis
    let cosZ = Math.cos(ROTATE_Z), sinZ = Math.sin(ROTATE_Z);
    let x3 = x2 * cosZ - y2 * sinZ;
    let y3 = x2 * sinZ + y2 * cosZ;
    let z3 = z2;

    return {x: x3, y: y3, z: z3};
}

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

        // Rotate to misalign with standard basis
        let rotated = rotatePoint(z1, z2, z3);
        points.push(rotated);
    }

    // Compute rotated principal component directions
    pc1Dir = rotatePoint(1, 0, 0);
    pc2Dir = rotatePoint(0, 1, 0);
    pc3Dir = rotatePoint(0, 0, 1);
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

            // Projected position (onto PC1-PC2 plane)
            let proj = projectOntoPC1PC2(p);
            let projX = proj.x * scale;
            let projY = -proj.z * scale;
            let projZ = proj.y * scale;

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
            drawEigenvector(pc1Dir.x, pc1Dir.z, pc1Dir.y, STD1 * 1.5, PASTELRED, scale);   // PC1
            drawEigenvector(pc2Dir.x, pc2Dir.z, pc2Dir.y, STD2 * 1.5, PASTELBLUE, scale);  // PC2
            drawEigenvector(pc3Dir.x, pc3Dir.z, pc3Dir.y, STD3 * 1.5, PASTELGREEN, scale); // PC3
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

        // Project onto PC1-PC2 plane
        for (let p of points) {
            // Original position
            let origX = p.x * s;
            let origY = -p.z * s;
            let origZ = p.y * s;

            // Projected position
            let proj = projectOntoPC1PC2(p);
            let px = proj.x * s;
            let py = -proj.z * s;
            let pz = proj.y * s;

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
            let proj = projectOntoPC1PC2(p);
            let px = proj.x * s;
            let py = -proj.z * s;
            let pz = proj.y * s;

            // Draw residual line from original to projection
            sketch.line(origX, origY, origZ, px, py, pz);
        }
    }

    function drawPlane(s) {
        // Draw the PC1-PC2 plane as a quad using the rotated principal directions
        let extent1 = STD1 * 1.5;
        let extent2 = STD2 * 1.5;

        // Four corners of the plane: ±extent1*pc1Dir ± extent2*pc2Dir
        let corners = [
            { x: extent1 * pc1Dir.x + extent2 * pc2Dir.x,
              y: extent1 * pc1Dir.y + extent2 * pc2Dir.y,
              z: extent1 * pc1Dir.z + extent2 * pc2Dir.z },
            { x: extent1 * pc1Dir.x - extent2 * pc2Dir.x,
              y: extent1 * pc1Dir.y - extent2 * pc2Dir.y,
              z: extent1 * pc1Dir.z - extent2 * pc2Dir.z },
            { x: -extent1 * pc1Dir.x - extent2 * pc2Dir.x,
              y: -extent1 * pc1Dir.y - extent2 * pc2Dir.y,
              z: -extent1 * pc1Dir.z - extent2 * pc2Dir.z },
            { x: -extent1 * pc1Dir.x + extent2 * pc2Dir.x,
              y: -extent1 * pc1Dir.y + extent2 * pc2Dir.y,
              z: -extent1 * pc1Dir.z + extent2 * pc2Dir.z }
        ];

        sketch.push();
        sketch.fill(200, 200, 200, 50);
        sketch.noStroke();
        sketch.beginShape();
        for (let c of corners) {
            // Convert to screen coordinates
            sketch.vertex(c.x * s, -c.z * s, c.y * s);
        }
        sketch.endShape(sketch.CLOSE);
        sketch.pop();
    }
}

new p5(sketch_3d, 'canvas-3d');
