/* ============================================================
   SWARM — Particle Presets
   Each preset is a function body (as a string) that follows
   the particle API contract.
   ============================================================ */

const PRESET_REGISTRY = {

    /* ----------------------------------------------------------
       1. COSMIC NEURAL NETWORK
       Neurons fire across a cosmic synapse field, forming
       beautiful interconnected node clusters.
       ---------------------------------------------------------- */
    cosmicNeural: `
// Controls
const scale = addControl("scale", "Universe Scale", 10, 120, 55);
const speed = addControl("speed", "Pulse Speed", 0.1, 4.0, 1.2);
const chaos = addControl("chaos", "Synaptic Chaos", 0, 2.0, 0.6);
const branches = addControl("branches", "Neural Branches", 2, 12, 6);

const t = time * speed;
const norm = i / count;
const branchId = (i % Math.round(branches)) / branches;

// Golden angle distribution on a sphere with animated radius
const phi = Math.acos(1 - 2 * norm);
const theta = Math.PI * (1 + Math.sqrt(5)) * i + t * 0.3;

// Layered radius with breathing
const layerWave = Math.sin(norm * 12.0 + t * 1.5) * chaos;
const breathe = 1.0 + 0.12 * Math.sin(t * 0.7 + branchId * 6.28);
const r = scale * breathe * (0.5 + 0.5 * norm + layerWave * 0.15);

// Synaptic jitter
const jx = Math.sin(i * 0.37 + t * 2.1) * chaos * 2.0;
const jy = Math.cos(i * 0.53 + t * 1.7) * chaos * 2.0;
const jz = Math.sin(i * 0.71 + t * 1.3) * chaos * 2.0;

const x = r * Math.sin(phi) * Math.cos(theta) + jx;
const y = r * Math.cos(phi) + jy;
const z = r * Math.sin(phi) * Math.sin(theta) + jz;

target.set(x, y, z);

// Color: hue shifts along branches, brightness pulses
const hue = (branchId + norm * 0.3 + t * 0.02) % 1.0;
const pulse = 0.45 + 0.25 * Math.sin(norm * 20.0 + t * 3.0);
const lightness = 0.35 + pulse * 0.3;
color.setHSL(hue, 0.85, lightness);

if (i === 0) {
    setInfo("Cosmic Neural Network", "20,000 neurons firing across a cosmic synapse field");
    annotate("core", new THREE.Vector3(0, 0, 0), "NUCLEUS");
}
`,

    /* ----------------------------------------------------------
       2. LORENZ ATTRACTOR
       Classic chaotic attractor with beautiful butterfly wings.
       ---------------------------------------------------------- */
    lorenzAttractor: `
const scale = addControl("scale", "Attractor Scale", 0.5, 4.0, 2.0);
const swirl = addControl("swirl", "Swirl Intensity", 0.5, 6.0, 3.0);
const speed = addControl("speed", "Flow Speed", 0.1, 3.0, 0.8);
const spread = addControl("spread", "Wing Spread", 5, 30, 15);
const depth = addControl("depth", "Depth", 5, 40, 20);

const t = time * speed;
const norm = i / count;

// Distribute particles into two wings via parametric Lorenz-like curves
// Wing assignment: even = right, odd = left
const wingSign = (i % 2 === 0) ? 1.0 : -1.0;
const wingNorm = Math.floor(i / 2) / (count * 0.5);

// Spiral angle along wing
const angle = wingNorm * swirl * 6.2832 + t * (0.8 + wingNorm * 0.3);
const wingRadius = wingNorm * spread;

// Lorenz-like Z shape (rises in center, dips at edges)
const zShape = (1.0 - wingNorm) * depth * 1.5;

// Core offset to center the butterfly
const coreX = wingSign * (wingRadius * Math.cos(angle) + spread * 0.35);
const coreY = wingRadius * Math.sin(angle) * 0.7;
const coreZ = zShape * Math.sin(wingNorm * 3.14) - depth * 0.3;

// Add subtle turbulence
const turb = Math.sin(i * 0.37 + t * 1.3) * 1.5;
const px = coreX * scale + turb;
const py = coreY * scale + Math.cos(i * 0.53 + t * 0.7) * 1.0;
const pz = coreZ * scale * 0.5 + Math.sin(i * 0.71 + t * 0.9) * 1.0;

target.set(px, py, pz);

// Color: each wing gets distinct hue, with sparkle
const wingHue = wingSign > 0 ? 0.6 : 0.95;
const hue = (wingHue + wingNorm * 0.12 + t * 0.015) % 1.0;
const sparkle = 0.3 + 0.35 * Math.abs(Math.sin(wingNorm * 15.0 + t * 2.5));
color.setHSL(hue, 0.85, sparkle);

if (i === 0) {
    setInfo("Lorenz Attractor", "Chaotic butterfly — sensitive dependence on initial conditions");
    annotate("left-wing", new THREE.Vector3(-spread * scale, 0, 0), "LEFT WING");
    annotate("right-wing", new THREE.Vector3(spread * scale, 0, 0), "RIGHT WING");
}
`,

    /* ----------------------------------------------------------
       3. 4D TESSERACT (Hypercube)
       A rotating hypercube projected into 3D space.
       ---------------------------------------------------------- */
    tesseract: `
const scale = addControl("scale", "Hypercube Size", 10, 80, 35);
const rotW = addControl("rotW", "4D Rotation W", 0, 5.0, 0.8);
const rotXZ = addControl("rotXZ", "XZ Rotation", 0, 3.0, 0.4);
const speed = addControl("speed", "Rotation Speed", 0.1, 3.0, 0.7);
const breathe = addControl("breathe", "Breathing", 0, 0.5, 0.15);

const t = time * speed;
const norm = i / count;

// Tesseract: 16 vertices, 32 edges
// Proper edge enumeration: for each of 4 dimensions,
// pick the 8 vertices where that dimension's bit = 0,
// and connect each to the vertex with that bit flipped to 1
// dim 0: 8 edges, dim 1: 8 edges, dim 2: 8 edges, dim 3: 8 edges = 32

const edgeId = i % 32;
const along = (Math.floor(i / 32) % 625) / 625.0;

// Which dimension does this edge span?
const dim = Math.floor(edgeId / 8);
// Which vertex (among 8 with bit 'dim' = 0) is the start?
const subIdx = edgeId % 8;

// Build v0: insert a 0 at bit position 'dim'
// subIdx gives 3 bits; we position them around the dim bit
let v0 = 0;
let bit = 0;
for (let d = 0; d < 4; d++) {
    if (d === dim) continue;
    if (subIdx & (1 << bit)) v0 = v0 | (1 << d);
    bit++;
}
// v1 = v0 with bit 'dim' set
const v1 = v0 | (1 << dim);

// Extract 4D coords from vertex bits
const v0x = (v0 & 1) ? 1.0 : -1.0;
const v0y = (v0 & 2) ? 1.0 : -1.0;
const v0z = (v0 & 4) ? 1.0 : -1.0;
const v0w = (v0 & 8) ? 1.0 : -1.0;
const v1x = (v1 & 1) ? 1.0 : -1.0;
const v1y = (v1 & 2) ? 1.0 : -1.0;
const v1z = (v1 & 4) ? 1.0 : -1.0;
const v1w = (v1 & 8) ? 1.0 : -1.0;

// Interpolate along the edge + breathing offset
const br = Math.sin(t * 1.5 + edgeId * 0.5) * breathe;
const ep = along;
let x4 = v0x + (v1x - v0x) * ep;
let y4 = v0y + (v1y - v0y) * ep;
let z4 = v0z + (v1z - v0z) * ep;
let w4 = v0w + (v1w - v0w) * ep;

// Scale breathing
x4 *= (1.0 + br);
y4 *= (1.0 + br);
z4 *= (1.0 + br);
w4 *= (1.0 + br);

// 4D rotation: XW plane
const cw = Math.cos(t * rotW);
const sw = Math.sin(t * rotW);
const rx = x4 * cw - w4 * sw;
const rw = x4 * sw + w4 * cw;

// 4D rotation: YZ plane
const cxz = Math.cos(t * rotXZ);
const sxz = Math.sin(t * rotXZ);
const ry = y4 * cxz - z4 * sxz;
const rz = y4 * sxz + z4 * cxz;

// Extra slow XY rotation
const c2 = Math.cos(t * 0.2);
const s2 = Math.sin(t * 0.2);
const fx = rx * c2 - ry * s2;
const fy = rx * s2 + ry * c2;

// Perspective 4D -> 3D
const d4 = 3.5;
const wDist = d4 - rw;
const projW = d4 / (Math.abs(wDist) < 0.05 ? (wDist < 0 ? -0.05 : 0.05) : wDist);
const px = fx * projW * scale;
const py = fy * projW * scale;
const pz = rz * projW * scale;

target.set(px, py, pz);

// Color: dimension-based hue + depth brightness
const dimHue = dim * 0.25;
const depthShift = (rw + 1.0) * 0.1;
const hue = (dimHue + depthShift + t * 0.02) % 1.0;
const lum = 0.35 + 0.3 * Math.abs(projW) * 0.15;
color.setHSL(Math.abs(hue), 0.85, Math.min(0.8, Math.max(0.2, lum)));

if (i === 0) {
    setInfo("4D Tesseract", "Hypercube with 32 edges rotating through the 4th dimension");
    annotate("center4d", new THREE.Vector3(0, 0, 0), "4D ORIGIN");
}
`,

    /* ----------------------------------------------------------
       4. DNA DOUBLE HELIX
       Twisting strands of life with nucleotide bridges.
       ---------------------------------------------------------- */
    dnaHelix: `
const scale = addControl("scale", "Helix Radius", 5, 40, 18);
const length = addControl("length", "Strand Length", 30, 200, 100);
const twist = addControl("twist", "Twist Rate", 0.5, 8.0, 3.0);
const speed = addControl("speed", "Rotation Speed", 0.1, 3.0, 0.8);
const glow = addControl("glow", "Glow Intensity", 0.2, 1.0, 0.6);

const t = time * speed;
const norm = i / count;

// Determine strand (0 = strand A, 1 = strand B, 2 = bridge)
const strandType = i % 3;
const strandNorm = Math.floor(i / 3) / (count / 3);

// Vertical position
const yPos = (strandNorm - 0.5) * length;

// Helix angle
const angle = strandNorm * twist * 6.28 + t;

let px = 0;
let py = yPos;
let pz = 0;

if (strandType === 0) {
    // Strand A
    px = Math.cos(angle) * scale;
    pz = Math.sin(angle) * scale;
} else if (strandType === 1) {
    // Strand B (opposite side)
    px = Math.cos(angle + 3.14159) * scale;
    pz = Math.sin(angle + 3.14159) * scale;
} else {
    // Bridge connecting strands
    const bridgePos = (Math.sin(i * 0.7) * 0.5 + 0.5);
    px = Math.cos(angle) * scale * (1.0 - bridgePos) + Math.cos(angle + 3.14159) * scale * bridgePos;
    pz = Math.sin(angle) * scale * (1.0 - bridgePos) + Math.sin(angle + 3.14159) * scale * bridgePos;
}

target.set(px, py, pz);

// Colors: A = cyan, B = pink, bridges = gold
let hue = 0;
let sat = 0.9;
let lum = 0.4 + glow * 0.2;

if (strandType === 0) {
    hue = 0.55; // cyan
    lum += Math.sin(strandNorm * 40.0 + t * 2.0) * 0.1;
} else if (strandType === 1) {
    hue = 0.85; // pink
    lum += Math.sin(strandNorm * 40.0 + t * 2.0 + 1.5) * 0.1;
} else {
    hue = 0.12; // gold
    sat = 0.75;
    lum = 0.35 + glow * 0.15;
}

color.setHSL(hue, sat, Math.max(0.15, Math.min(0.8, lum)));

if (i === 0) {
    setInfo("DNA Double Helix", "The molecule of life — twin phosphate strands with nucleotide bridges");
    annotate("top", new THREE.Vector3(0, length * 0.45, 0), "5' END");
    annotate("bottom", new THREE.Vector3(0, -length * 0.45, 0), "3' END");
}
`,

    /* ----------------------------------------------------------
       5. GALAXY SPIRAL
       A grand spiral galaxy with arms, core, and stellar halo.
       ---------------------------------------------------------- */
    galaxySpiral: `
const armCount = addControl("arms", "Spiral Arms", 2, 8, 4);
const radius = addControl("radius", "Galaxy Radius", 20, 120, 65);
const thickness = addControl("thickness", "Disk Thickness", 1, 15, 4);
const speed = addControl("speed", "Rotation Speed", 0.1, 3.0, 0.6);
const tightness = addControl("tightness", "Arm Tightness", 0.5, 4.0, 1.8);

const t = time * speed;
const norm = i / count;

// Separate particles into core (15%), disk (70%), halo (15%)
const region = norm < 0.15 ? 0 : (norm < 0.85 ? 1 : 2);

let px = 0;
let py = 0;
let pz = 0;
let hue = 0;
let sat = 0;
let lum = 0;

if (region === 0) {
    // Core — dense glowing center
    const coreNorm = norm / 0.15;
    const coreR = coreNorm * radius * 0.12;
    const coreAngle = coreNorm * 50.0 + t * 2.0;
    px = Math.cos(coreAngle) * coreR + Math.sin(i * 0.77) * 1.5;
    pz = Math.sin(coreAngle) * coreR + Math.cos(i * 0.63) * 1.5;
    py = (Math.sin(i * 1.3) * 0.5) * thickness * 0.3;
    hue = 0.08 + coreNorm * 0.05;
    sat = 0.6;
    lum = 0.65 + 0.15 * Math.sin(t * 3.0 + i * 0.1);
} else if (region === 1) {
    // Disk — spiral arms
    const diskNorm = (norm - 0.15) / 0.7;
    const armIndex = i % Math.round(armCount);
    const armOffset = (armIndex / armCount) * 6.28318;
    const r = diskNorm * radius;
    const spiralAngle = armOffset + diskNorm * tightness * 3.14 + t * (1.0 - diskNorm * 0.5);

    // Add scatter perpendicular to arm
    const scatter = (Math.sin(i * 0.37) * 0.5 + 0.5) * radius * 0.08;
    px = Math.cos(spiralAngle) * (r + scatter);
    pz = Math.sin(spiralAngle) * (r + scatter);
    py = Math.sin(i * 0.93) * thickness * (1.0 - diskNorm * 0.5);

    hue = 0.6 + diskNorm * 0.2 + armIndex * 0.02;
    sat = 0.8 - diskNorm * 0.3;
    lum = 0.3 + 0.25 * (1.0 - diskNorm);
} else {
    // Halo — sparse outer stars
    const haloNorm = (norm - 0.85) / 0.15;
    const haloR = radius * (0.6 + haloNorm * 0.8);
    const haloPhi = Math.acos(1 - 2 * ((i * 0.618) % 1.0));
    const haloTheta = i * 2.399 + t * 0.1;
    px = haloR * Math.sin(haloPhi) * Math.cos(haloTheta);
    py = haloR * Math.cos(haloPhi) * 0.4;
    pz = haloR * Math.sin(haloPhi) * Math.sin(haloTheta);
    hue = 0.0 + haloNorm * 0.1;
    sat = 0.3;
    lum = 0.2 + haloNorm * 0.15;
}

target.set(px, py, pz);
color.setHSL(hue % 1.0, sat, Math.max(0.1, Math.min(0.85, lum)));

if (i === 0) {
    setInfo("Galaxy Spiral", "A grand spiral galaxy with " + Math.round(armCount) + " arms and 20,000 stars");
    annotate("galactic-core", new THREE.Vector3(0, 0, 0), "GALACTIC CORE");
}
`
};
