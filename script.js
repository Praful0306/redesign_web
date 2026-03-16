import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export class ParticlesSwarm {
    constructor(container, count = 20000) {
        this.count = count;
        this.container = container;
        this.speedMult = 1.5;
        
        // SETUP
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x000000, 0.01);
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.camera.position.set(0, 0, 100);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        // POST PROCESSING
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloomPass.strength = 1.8; bloomPass.radius = 0.4; bloomPass.threshold = 0;
        this.composer.addPass(bloomPass);

        // OBJECTS
        this.dummy = new THREE.Object3D();
        this.color = new THREE.Color();
        this.target = new THREE.Vector3();
        this.pColor = new THREE.Color();
        
        this.geometry = new THREE.ConeGeometry(0.1, 0.5, 4).rotateX(Math.PI / 2);
        this.material = new THREE.MeshBasicMaterial({ color: 0x00aaff });
        
        this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.count);
        this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.scene.add(this.mesh);
        
        this.positions = [];
        for(let i=0; i<this.count; i++) {
            this.positions.push(new THREE.Vector3((Math.random()-0.5)*100, (Math.random()-0.5)*100, (Math.random()-0.5)*100));
            this.mesh.setColorAt(i, this.color.setHex(0x00ff88));
        }
        
        this.clock = new THREE.Clock();
        this.animate = this.animate.bind(this);
        this.animate();
    }

    animate() {
        requestAnimationFrame(this.animate);
        const time = this.clock.getElapsedTime() * this.speedMult;
        
        if(this.material.uniforms && this.material.uniforms.uTime) {
            this.material.uniforms.uTime.value = time;
        }

        // API Stubs
        const PARAMS = {"size":167.7,"height":15.21,"speed":0.39,"ruggedness":7.46};
        const addControl = (id, l, min, max, val) => {
             return PARAMS[id] !== undefined ? PARAMS[id] : val;
        };
        const setInfo = () => {};
        const annotate = () => {};
        let THREE_LIB = THREE;
        const count = this.count; // Alias for user code
        
        for(let i=0; i<this.count; i++) {
            let target = this.target;
            let color = this.pColor;
            
            // INJECTED CODE
            const size = addControl("size", "Terrain Scale", 10, 200, 100); const height = addControl("height", "Mountain Height", 1, 50, 15); const speed = addControl("speed", "Undulation Speed", 0.1, 3.0, 0.5); const ruggedness = addControl("ruggedness", "Ruggedness", 1, 20, 8);
            
            const cols = Math.floor(Math.sqrt(count)); const u = ((i % cols) / cols) - 0.5; const v = (Math.floor(i / cols) / cols) - 0.5;
            
            const px = u * size; const pz = v * size;
            
            const t = time * speed;
            
            let elevation = Math.sin(u * ruggedness + t * 0.5) * Math.cos(v * ruggedness + t * 0.4); elevation += 0.5 * Math.sin(u * ruggedness * 2.1 - t * 0.7) * Math.cos(v * ruggedness * 1.9 + t * 0.6); elevation += 0.25 * Math.sin(u * ruggedness * 4.3 + t * 1.1) * Math.cos(v * ruggedness * 3.8 - t * 0.9);
            
            const dist = Math.sqrt(u * u + v * v); const peakImpact = Math.max(0, 1.0 - dist * 2.5); const finalY = (elevation * height) + (peakImpact * height * 2.0);
            
            target.set(px, finalY, pz);
            
            const normalizedElevation = Math.max(0, Math.min(1, (finalY + height) / (height * 3.0))); const neonHue = 0.33 - (normalizedElevation * 0.05); const lum = 0.2 + (normalizedElevation * 0.6);
            
            color.setHSL(neonHue, 1.0, lum);
            
            if (i === 0) { setInfo("Neon Topography", "A shifting 3D terrain simulating a cross-country running trail."); }
            
            // UPDATE
            this.positions[i].lerp(this.target, 0.1);
            this.dummy.position.copy(this.positions[i]);
            this.dummy.updateMatrix();
            this.mesh.setMatrixAt(i, this.dummy.matrix);
            this.mesh.setColorAt(i, this.pColor);
        }
        this.mesh.instanceMatrix.needsUpdate = true;
        this.mesh.instanceColor.needsUpdate = true;
        
        this.composer.render();
    }
    
    dispose() {
        this.geometry.dispose();
        this.material.dispose();
        this.scene.remove(this.mesh);
        this.renderer.dispose();
    }
}



// changing the names in the home page with developer
let developerName = document.getElementById("developer-name");

// Function to update the developer name
window.addEventListener("scroll", function() {
    if (developerName) {
        developerName.textContent = "Hello,we are Developers";
        developerName.style.backgroundImage = "linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)";
    }
});

