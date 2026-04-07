/* ============================================================
   SWARM — 3D Particle Engine
   High-performance Three.js particle system with dynamic
   preset loading, real-time controls, and 3D annotations.
   ============================================================ */

(function () {
    "use strict";

    /* ----------------------------------------------------------
       CONFIG
       ---------------------------------------------------------- */
    const PARTICLE_COUNT = 20000;
    const PARTICLE_SIZE = 1.8;

    /* ----------------------------------------------------------
       DOM REFS
       ---------------------------------------------------------- */
    const container = document.getElementById("canvas-container");
    const loader = document.getElementById("loader");
    const hudTitle = document.getElementById("hud-title");
    const hudDesc = document.getElementById("hud-desc");
    const fpsDisplay = document.getElementById("fps-display");
    const timeDisplay = document.getElementById("time-display");
    const controlsBody = document.getElementById("controls-body");
    const controlsToggle = document.getElementById("controls-toggle");
    const annotationsContainer = document.getElementById("annotations-container");

    /* ----------------------------------------------------------
       THREE.JS SETUP
       ---------------------------------------------------------- */
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x06060e, 0.003);

    const camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        2000
    );
    camera.position.set(0, 30, 100);

    const renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: false,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x06060e, 1);
    container.appendChild(renderer.domElement);

    // Orbit Controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.rotateSpeed = 0.6;
    controls.zoomSpeed = 0.8;
    controls.minDistance = 10;
    controls.maxDistance = 500;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.3;

    /* ----------------------------------------------------------
       PARTICLE SYSTEM
       ---------------------------------------------------------- */
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);

    // Initialize sizes
    for (let idx = 0; idx < PARTICLE_COUNT; idx++) {
        sizes[idx] = PARTICLE_SIZE * (0.5 + Math.random() * 0.8);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    // Custom shader material for beautiful round particles with glow
    const particleMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
        },
        vertexShader: `
            attribute float size;
            varying vec3 vColor;
            varying float vDist;
            uniform float uPixelRatio;

            void main() {
                vColor = color;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vDist = -mvPosition.z;
                gl_PointSize = size * uPixelRatio * (200.0 / -mvPosition.z);
                gl_PointSize = clamp(gl_PointSize, 1.0, 40.0);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            varying float vDist;

            void main() {
                // Soft circular particle with glow
                vec2 center = gl_PointCoord - vec2(0.5);
                float dist = length(center);
                if (dist > 0.5) discard;

                // Core + glow
                float core = smoothstep(0.5, 0.1, dist);
                float glow = smoothstep(0.5, 0.0, dist) * 0.4;
                float alpha = core + glow;

                // Depth fade
                float depthFade = clamp(1.0 - vDist * 0.002, 0.1, 1.0);

                gl_FragColor = vec4(vColor * (core * 1.5 + glow), alpha * depthFade);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true
    });

    const particleSystem = new THREE.Points(geometry, particleMaterial);
    scene.add(particleSystem);

    /* ----------------------------------------------------------
       SUBTLE AMBIENT DUST (background particles)
       ---------------------------------------------------------- */
    const dustCount = 2000;
    const dustPositions = new Float32Array(dustCount * 3);
    const dustColors = new Float32Array(dustCount * 3);
    for (let d = 0; d < dustCount; d++) {
        dustPositions[d * 3] = (Math.random() - 0.5) * 600;
        dustPositions[d * 3 + 1] = (Math.random() - 0.5) * 600;
        dustPositions[d * 3 + 2] = (Math.random() - 0.5) * 600;
        dustColors[d * 3] = 0.3;
        dustColors[d * 3 + 1] = 0.28;
        dustColors[d * 3 + 2] = 0.4;
    }
    const dustGeom = new THREE.BufferGeometry();
    dustGeom.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    dustGeom.setAttribute("color", new THREE.BufferAttribute(dustColors, 3));
    const dustMat = new THREE.PointsMaterial({
        size: 0.6,
        vertexColors: true,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    scene.add(new THREE.Points(dustGeom, dustMat));

    /* ----------------------------------------------------------
       CONTROL SYSTEM
       ---------------------------------------------------------- */
    const controlValues = {};
    let currentControlIds = [];

    function addControl(id, label, min, max, initialValue) {
        if (!(id in controlValues)) {
            controlValues[id] = initialValue;
        }
        // Only create DOM element if not already there
        if (!document.getElementById("ctrl-" + id)) {
            currentControlIds.push(id);
            const group = document.createElement("div");
            group.className = "control-group";
            group.id = "ctrl-" + id;

            const labelRow = document.createElement("div");
            labelRow.className = "control-label-row";

            const labelEl = document.createElement("span");
            labelEl.className = "control-label";
            labelEl.textContent = label;

            const valueEl = document.createElement("span");
            valueEl.className = "control-value";
            valueEl.id = "val-" + id;
            valueEl.textContent = controlValues[id].toFixed(2);

            labelRow.appendChild(labelEl);
            labelRow.appendChild(valueEl);

            const slider = document.createElement("input");
            slider.type = "range";
            slider.min = min;
            slider.max = max;
            slider.step = ((max - min) / 200).toString();
            slider.value = controlValues[id];
            slider.id = "slider-" + id;

            slider.addEventListener("input", function () {
                const val = parseFloat(this.value);
                controlValues[id] = val;
                valueEl.textContent = val.toFixed(2);
            });

            group.appendChild(labelRow);
            group.appendChild(slider);
            controlsBody.appendChild(group);
        }
        return controlValues[id];
    }

    function clearControls() {
        controlsBody.innerHTML = "";
        currentControlIds = [];
    }

    /* ----------------------------------------------------------
       INFO & ANNOTATION SYSTEM
       ---------------------------------------------------------- */
    function setInfo(title, description) {
        hudTitle.textContent = title;
        hudDesc.textContent = description;
    }

    const annotationElements = {};

    function annotate(id, positionVector, labelText) {
        if (!annotationElements[id]) {
            const el = document.createElement("div");
            el.className = "annotation-label";
            el.textContent = labelText;
            el.id = "ann-" + id;
            annotationsContainer.appendChild(el);
            annotationElements[id] = { el: el, pos: positionVector };
        } else {
            annotationElements[id].pos = positionVector;
            annotationElements[id].el.textContent = labelText;
        }
    }

    function clearAnnotations() {
        for (const key in annotationElements) {
            annotationElements[key].el.remove();
            delete annotationElements[key];
        }
    }

    function updateAnnotations() {
        const halfW = window.innerWidth / 2;
        const halfH = window.innerHeight / 2;
        const projVec = new THREE.Vector3();

        for (const key in annotationElements) {
            const ann = annotationElements[key];
            projVec.copy(ann.pos);
            projVec.project(camera);

            const x = projVec.x * halfW + halfW;
            const y = -projVec.y * halfH + halfH;
            const behind = projVec.z > 1;

            ann.el.style.left = x + "px";
            ann.el.style.top = y + "px";
            ann.el.style.opacity = behind ? "0" : "0.8";
        }
    }

    /* ----------------------------------------------------------
       PRESET EXECUTION ENGINE
       ---------------------------------------------------------- */
    let activePreset = "cosmicNeural";
    let compiledFn = null;
    const tempTarget = new THREE.Vector3();
    const tempColor = new THREE.Color();

    function compilePreset(presetName) {
        const code = PRESET_REGISTRY[presetName];
        if (!code) return;

        // Clear previous state
        clearControls();
        clearAnnotations();

        // Reset control values for new preset
        for (const key in controlValues) {
            delete controlValues[key];
        }

        try {
            // Compile the function body into a callable function
            compiledFn = new Function(
                "i", "count", "target", "color", "time", "THREE", "addControl", "setInfo", "annotate",
                code
            );

            // Dry run particle 0 to set up controls and HUD
            compiledFn(0, PARTICLE_COUNT, tempTarget, tempColor, 0, THREE, addControl, setInfo, annotate);

            activePreset = presetName;
        } catch (err) {
            console.error("Preset compilation error:", err);
            compiledFn = null;
        }
    }

    /* ----------------------------------------------------------
       ANIMATION LOOP
       ---------------------------------------------------------- */
    let startTime = performance.now();
    let frameCount = 0;
    let lastFpsUpdate = 0;
    let currentFps = 60;

    function animate() {
        requestAnimationFrame(animate);

        const now = performance.now();
        const simTime = (now - startTime) * 0.001;

        // FPS counter
        frameCount++;
        if (now - lastFpsUpdate > 500) {
            currentFps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
            fpsDisplay.textContent = currentFps;
            lastFpsUpdate = now;
            frameCount = 0;
        }
        timeDisplay.textContent = simTime.toFixed(1);

        // Update particles
        if (compiledFn) {
            const posAttr = geometry.attributes.position;
            const colAttr = geometry.attributes.color;

            for (let idx = 0; idx < PARTICLE_COUNT; idx++) {
                try {
                    compiledFn(
                        idx, PARTICLE_COUNT, tempTarget, tempColor,
                        simTime, THREE, addControl, setInfo, annotate
                    );
                } catch (e) {
                    // Skip particle on error
                    continue;
                }

                // Write position — guard against NaN / Infinity
                const px = isFinite(tempTarget.x) ? tempTarget.x : 0;
                const py = isFinite(tempTarget.y) ? tempTarget.y : 0;
                const pz = isFinite(tempTarget.z) ? tempTarget.z : 0;

                posAttr.array[idx * 3] = px;
                posAttr.array[idx * 3 + 1] = py;
                posAttr.array[idx * 3 + 2] = pz;

                colAttr.array[idx * 3] = tempColor.r;
                colAttr.array[idx * 3 + 1] = tempColor.g;
                colAttr.array[idx * 3 + 2] = tempColor.b;
            }

            posAttr.needsUpdate = true;
            colAttr.needsUpdate = true;
        }

        // Update uniforms
        particleMaterial.uniforms.uTime.value = simTime;

        // Update annotations
        updateAnnotations();

        // Update controls
        controls.update();

        // Render
        renderer.render(scene, camera);
    }

    /* ----------------------------------------------------------
       PRESET NAVIGATION
       ---------------------------------------------------------- */
    const navButtons = document.querySelectorAll(".nav-btn[data-preset]");
    navButtons.forEach(function (btn) {
        btn.addEventListener("click", function () {
            const preset = this.dataset.preset;
            if (preset === activePreset) return;

            // Update active state
            navButtons.forEach(function (b) { b.classList.remove("active"); });
            this.classList.add("active");

            // Smooth camera reset
            camera.position.set(0, 30, 100);
            controls.target.set(0, 0, 0);

            compilePreset(preset);
        });
    });

    /* ----------------------------------------------------------
       CONTROLS TOGGLE
       ---------------------------------------------------------- */
    controlsToggle.addEventListener("click", function () {
        controlsBody.classList.toggle("collapsed");
    });

    /* ----------------------------------------------------------
       RESIZE HANDLER
       ---------------------------------------------------------- */
    window.addEventListener("resize", function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        particleMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
    });

    /* ----------------------------------------------------------
       BOOT SEQUENCE
       ---------------------------------------------------------- */
    function boot() {
        // Compile the default preset
        compilePreset("cosmicNeural");

        // Start animation
        animate();

        // Hide loader after a brief delay
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                loader.classList.add("hidden");
            });
        });
    }

    // Start
    boot();

})();
