import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export class ParticlesSwarm {
    constructor(container, count = 5000) {
        this.count = count;
        this.container = container;
        this.speedMult = 1.5;

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x000000, 0.01);

        const { width, height } = this.getContainerSize();
        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
        this.camera.position.set(0, 0, 100);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.setSize(width, height);
        this.container.appendChild(this.renderer.domElement);

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85);
        this.bloomPass.strength = 1.8;
        this.bloomPass.radius = 0.4;
        this.bloomPass.threshold = 0;
        this.composer.addPass(this.bloomPass);

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
        for (let i = 0; i < this.count; i++) {
            this.positions.push(
                new THREE.Vector3(
                    (Math.random() - 0.5) * 100,
                    (Math.random() - 0.5) * 100,
                    (Math.random() - 0.5) * 100
                )
            );
            this.mesh.setColorAt(i, this.color.setHex(0x00ff88));
        }

        this.clock = new THREE.Clock();
        this.animate = this.animate.bind(this);
        this.onResize = this.onResize.bind(this);
        window.addEventListener('resize', this.onResize);
        this.animate();
    }

    getContainerSize() {
        return {
            width: this.container.clientWidth || window.innerWidth,
            height: this.container.clientHeight || window.innerHeight
        };
    }

    onResize() {
        const { width, height } = this.getContainerSize();
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.composer.setSize(width, height);
    }

    animate() {
        requestAnimationFrame(this.animate);
        const time = this.clock.getElapsedTime() * this.speedMult;

        const PARAMS = { size: 167.7, height: 15.21, speed: 0.39, ruggedness: 7.46 };
        const addControl = (id, l, min, max, val) => (PARAMS[id] !== undefined ? PARAMS[id] : val);
        const setInfo = () => {};
        const count = this.count;

        for (let i = 0; i < this.count; i++) {
            const target = this.target;
            const color = this.pColor;

            const size = addControl('size', 'Terrain Scale', 10, 200, 100);
            const height = addControl('height', 'Mountain Height', 1, 50, 15);
            const speed = addControl('speed', 'Undulation Speed', 0.1, 3.0, 0.5);
            const ruggedness = addControl('ruggedness', 'Ruggedness', 1, 20, 8);

            const cols = Math.floor(Math.sqrt(count));
            const u = (i % cols) / cols - 0.5;
            const v = Math.floor(i / cols) / cols - 0.5;
            const px = u * size;
            const pz = v * size;
            const t = time * speed;

            let elevation = Math.sin(u * ruggedness + t * 0.5) * Math.cos(v * ruggedness + t * 0.4);
            elevation += 0.5 * Math.sin(u * ruggedness * 2.1 - t * 0.7) * Math.cos(v * ruggedness * 1.9 + t * 0.6);
            elevation += 0.25 * Math.sin(u * ruggedness * 4.3 + t * 1.1) * Math.cos(v * ruggedness * 3.8 - t * 0.9);

            const dist = Math.sqrt(u * u + v * v);
            const peakImpact = Math.max(0, 1.0 - dist * 2.5);
            const finalY = elevation * height + peakImpact * height * 2.0;

            target.set(px, finalY, pz);

            const normalizedElevation = Math.max(0, Math.min(1, (finalY + height) / (height * 3.0)));
            const neonHue = 0.33 - normalizedElevation * 0.05;
            const lum = 0.2 + normalizedElevation * 0.6;

            color.setHSL(neonHue, 1.0, lum);

            if (i === 0) {
                setInfo('Neon Topography', 'A shifting 3D terrain simulating a cross-country running trail.');
            }

            this.positions[i].lerp(target, 0.1);
            this.dummy.position.copy(this.positions[i]);
            this.dummy.updateMatrix();
            this.mesh.setMatrixAt(i, this.dummy.matrix);
            this.mesh.setColorAt(i, color);
        }

        this.mesh.instanceMatrix.needsUpdate = true;
        this.mesh.instanceColor.needsUpdate = true;
        this.composer.render();
    }

    dispose() {
        window.removeEventListener('resize', this.onResize);
        this.geometry.dispose();
        this.material.dispose();
        this.scene.remove(this.mesh);
        this.renderer.dispose();
    }
}

export class ProfileParticlesSwarm {
    constructor(container, count = 3000) {
        this.count = count;
        this.container = container;
        this.speedMult = 2;

        this.scene = new THREE.Scene();

        const { width, height } = this.getContainerSize();
        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
        this.camera.position.set(0, 0, 100);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance',
            alpha: true
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.setSize(width, height);
        this.renderer.setClearColor(0x000000, 0);
        this.container.appendChild(this.renderer.domElement);

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85);
        this.bloomPass.strength = 1.8;
        this.bloomPass.radius = 0.4;
        this.bloomPass.threshold = 0;
        this.composer.addPass(this.bloomPass);

        this.dummy = new THREE.Object3D();
        this.color = new THREE.Color();
        this.target = new THREE.Vector3();
        this.pColor = new THREE.Color();

        this.geometry = new THREE.TetrahedronGeometry(0.25);
        this.material = new THREE.MeshBasicMaterial({ color: 0xffffff });

        this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.count);
        this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.scene.add(this.mesh);

        this.positions = [];
        for (let i = 0; i < this.count; i++) {
            this.positions.push(
                new THREE.Vector3(
                    (Math.random() - 0.5) * 100,
                    (Math.random() - 0.5) * 100,
                    (Math.random() - 0.5) * 100
                )
            );
            this.mesh.setColorAt(i, this.color.setHex(0x00ff88));
        }

        this.clock = new THREE.Clock();
        this.animate = this.animate.bind(this);
        this.onResize = this.onResize.bind(this);
        window.addEventListener('resize', this.onResize);
        this.animate();
    }

    getContainerSize() {
        return {
            width: this.container.clientWidth || 500,
            height: this.container.clientHeight || 500
        };
    }

    onResize() {
        const { width, height } = this.getContainerSize();
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.composer.setSize(width, height);
    }

    animate() {
        requestAnimationFrame(this.animate);
        const time = this.clock.getElapsedTime() * this.speedMult;

        const PARAMS = { scale: 35.04, iter: 4.5, morph: 0.4, twist: 1.2, bright: 1 };
        const addControl = (id, l, min, max, val) => (PARAMS[id] !== undefined ? PARAMS[id] : val);
        const count = this.count;

        for (let i = 0; i < this.count; i++) {
            const target = this.target;
            const color = this.pColor;

            const scale = addControl('scale', 'Scale', 8, 60, 28);
            const iter = addControl('iter', 'Fold Depth', 1, 8, 4.5);
            const morphTime = addControl('morph', 'Morph Speed', 0, 2.0, 0.4);
            const twist = addControl('twist', 'Twist Field', 0, 5.0, 1.2);
            const brightness = addControl('bright', 'Luminance', 0, 2.0, 1.0);

            const tm = time * morphTime;
            const tFast = time * 0.7;
            const tSlow = time * 0.13;

            const blend0 = Math.max(0, Math.sin(tm * 0.4));
            const blend1 = Math.max(0, Math.sin(tm * 0.4 + 2.094));
            const blend2 = Math.max(0, Math.sin(tm * 0.4 + 4.188));

            const bSum = blend0 + blend1 + blend2 + 0.0001;
            const b0 = blend0 / bSum;
            const b1 = blend1 / bSum;
            const b2 = blend2 / bSum;

            const idx = i + 1;

            let hx = 0;
            let hb = 0.5;
            let hi = idx;
            while (hi > 0) {
                hx += (hi & 1) * hb;
                hi >>= 1;
                hb *= 0.5;
            }

            let hy = 0;
            let hf3 = 1.0 / 3;
            let hi3 = idx;
            while (hi3 > 0) {
                const r = hi3 % 3;
                hy += r * hf3;
                hi3 = Math.floor(hi3 / 3);
                hf3 /= 3;
            }

            let hz = 0;
            let hf5 = 1.0 / 5;
            let hi5 = idx;
            while (hi5 > 0) {
                const r = hi5 % 5;
                hz += r * hf5;
                hi5 = Math.floor(hi5 / 5);
                hf5 /= 5;
            }

            const sx = hx * 2 - 1;
            const sy = hy * 2 - 1;
            const sz = hz * 2 - 1;

            let mx = sx;
            let my = sy;
            let mz = sz;
            const mScale = 2.2 + 0.4 * Math.sin(tSlow);
            const mFixed = 1.0;

            for (let k = 0; k < iter; k++) {
                mx = mx > mFixed ? 2 * mFixed - mx : mx < -mFixed ? -2 * mFixed - mx : mx;
                my = my > mFixed ? 2 * mFixed - my : my < -mFixed ? -2 * mFixed - my : my;
                mz = mz > mFixed ? 2 * mFixed - mz : mz < -mFixed ? -2 * mFixed - mz : mz;

                const mr2 = mx * mx + my * my + mz * mz;
                const minR2 = 0.25;
                const fixR2 = 1.0;
                const mFactor = mr2 < minR2 ? fixR2 / minR2 : mr2 < fixR2 ? fixR2 / mr2 : 1.0;
                mx *= mFactor;
                my *= mFactor;
                mz *= mFactor;

                mx = mScale * mx + sx;
                my = mScale * my + sy;
                mz = mScale * mz + sz;
            }

            const mLen = Math.sqrt(mx * mx + my * my + mz * mz) + 0.001;
            const mNorm = Math.log(mLen + 1) * 0.4;
            const mX = (mx / mLen) * mNorm;
            const mY = (my / mLen) * mNorm;
            const mZ = (mz / mLen) * mNorm;

            let tx = sx;
            let ty = sy;
            let tz = sz;
            const iterInt = Math.floor(iter);
            for (let k = 0; k < iterInt; k++) {
                let vx = 1;
                let vy = 1;
                let vz = 1;
                let best = -1e9;
                let d;
                d = tx + ty + tz;
                if (d > best) {
                    best = d;
                    vx = 1;
                    vy = 1;
                    vz = 1;
                }
                d = -tx - ty + tz;
                if (d > best) {
                    best = d;
                    vx = -1;
                    vy = -1;
                    vz = 1;
                }
                d = -tx + ty - tz;
                if (d > best) {
                    best = d;
                    vx = -1;
                    vy = 1;
                    vz = -1;
                }
                d = tx - ty - tz;
                if (d > best) {
                    best = d;
                    vx = 1;
                    vy = -1;
                    vz = -1;
                }

                tx = 2 * tx - vx;
                ty = 2 * ty - vy;
                tz = 2 * tz - vz;
            }

            const tLen = Math.sqrt(tx * tx + ty * ty + tz * tz) + 0.001;
            const tX = (tx / tLen) * 0.85;
            const tY = (ty / tLen) * 0.85;
            const tZ = (tz / tLen) * 0.85;

            let jx = sx * 0.6;
            let jy = sy * 0.6;
            let jz = sz * 0.6;
            let jw = 0.0;
            const jcx = 0.355 + 0.08 * Math.sin(tSlow * 1.3);
            const jcy = 0.355 + 0.08 * Math.cos(tSlow * 0.9);
            const jcz = 0.12 + 0.05 * Math.sin(tSlow * 1.7);
            const jcw = 0.0;
            let jEscaped = 0.0;
            for (let k = 0; k < 8; k++) {
                const qx2 = jx * jx - jy * jy - jz * jz - jw * jw + jcx;
                const qy2 = 2 * jx * jy + jcy;
                const qz2 = 2 * jx * jz + jcz;
                const qw2 = 2 * jx * jw + jcw;
                jx = qx2;
                jy = qy2;
                jz = qz2;
                jw = qw2;
                const jR2 = jx * jx + jy * jy + jz * jz + jw * jw;
                jEscaped += 1.0 / (1.0 + jR2 * 0.5);
                if (jR2 > 16.0) {
                    break;
                }
            }

            const jLen = Math.sqrt(jx * jx + jy * jy + jz * jz) + 0.001;
            const jFade = jEscaped / 8.0;
            const jX = (jx / jLen) * jFade;
            const jY = (jy / jLen) * jFade;
            const jZ = (jz / jLen) * jFade;

            let fx = b0 * mX + b1 * tX + b2 * jX;
            let fy = b0 * mY + b1 * tY + b2 * jY;
            let fz = b0 * mZ + b1 * tZ + b2 * jZ;

            const twistAngle = fy * twist * 0.15 + tFast * 0.2;
            const twCos = Math.cos(twistAngle);
            const twSin = Math.sin(twistAngle);
            const twx = fx * twCos - fz * twSin;
            const twz = fx * twSin + fz * twCos;
            fx = twx;
            fz = twz;

            const fDist = Math.sqrt(fx * fx + fy * fy + fz * fz) + 0.001;
            const breathe = 1.0 + 0.06 * Math.sin(fDist * 4.5 - tFast * 2.1);

            target.set(fx * scale * breathe, fy * scale * breathe, fz * scale * breathe);

            const hMandelbox = 0.58 + 0.12 * Math.sin(mNorm * 3.0 + tSlow);
            const hSierpinski = 0.08 + 0.07 * Math.sin(tLen * 4.0 + tFast);
            const hJulia = 0.75 + 0.15 * jFade + 0.05 * Math.sin(tSlow * 2);
            const hue = (b0 * hMandelbox + b1 * hSierpinski + b2 * hJulia + tSlow * 0.04) % 1.0;

            const boundaryProx = Math.abs(Math.sin(fDist * 6.28));
            const sat = 0.65 + 0.35 * boundaryProx;
            const interior = 1.0 - Math.min(1.0, fDist * 1.2);
            const lum = brightness * (0.15 + 0.55 * boundaryProx + 0.2 * interior);

            color.setHSL(hue, sat, Math.min(0.95, lum));

            this.positions[i].lerp(target, 0.1);
            this.dummy.position.copy(this.positions[i]);
            this.dummy.updateMatrix();
            this.mesh.setMatrixAt(i, this.dummy.matrix);
            this.mesh.setColorAt(i, color);
        }

        this.mesh.instanceMatrix.needsUpdate = true;
        this.mesh.instanceColor.needsUpdate = true;
        this.composer.render();
    }

    dispose() {
        window.removeEventListener('resize', this.onResize);
        this.geometry.dispose();
        this.material.dispose();
        this.scene.remove(this.mesh);
        this.renderer.dispose();
    }
}

const developerName = document.getElementById('developer-name');
window.addEventListener('scroll', () => {
    if (!developerName) {
        return;
    }

    developerName.textContent = 'Hello,we are Developers';
    developerName.style.backgroundImage = 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)';
});

window.addEventListener('DOMContentLoaded', () => {
    const rollingTrack = document.querySelector('.rolling-track');
    if (!rollingTrack || rollingTrack.dataset.loopReady === 'true') {
        return;
    }

    rollingTrack.innerHTML += rollingTrack.innerHTML;
    rollingTrack.dataset.loopReady = 'true';
});
