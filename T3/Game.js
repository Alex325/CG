import * as THREE from 'three';
import { initRenderer, onWindowResize } from './libs/util/util.js';
import { Player } from './Player.js'
import { Ground } from './Ground.js';
import Stats from './build/jsm/libs/stats.module.js';
import GUI from './libs/util/dat.gui.module.js';
import { seed } from './noise.js';
import { HealthPack } from './HealthPack.js';

export class Game {

    static RUNNING = 0;
    static PAUSED = 1;
    static GAME_OVER = 2;
    static START = 3;

    /**
     * @type {THREE.Scene}
     */
    #scene;
    #renderer;
    #clock;
    /**
     * @type {Player}
     */
    #player;
    #camera;
    /**
     * @type {THREE.DirectionalLight}
     */
    #globalLight;
    #gameObjects;
    #mousePos;
    #raycaster;
    #fogfar = 3000;
    #overlay;

    #stats;
    #state = Game.RUNNING;
    paused = false;
    speedMultiplier = 1;
    sensitivity = 10;
    #cursorLocked = false;
    #enemyKills = 0;
    hitCount = 0;
    godMode = false;

    constructor() {
        this.#init();
    }

    #buildInterface() {
        const gui = new GUI();
        gui.add(this.#scene.fog, 'far', 2000, this.#fogfar)
            .name("Fog Far");
        gui.add(this, 'paused').name("Paused (ESC)");
        gui.add(this, 'speedMultiplier', { Normal: 1, '2x': 1.5, '3x': 2 }).name("Speed (1/2/3)");
        gui.add(this, 'sensitivity', 1, 40).name("Sensitivity");
        //gui.add(this, 'hitCount').name("Player Hits").listen();
        gui.add(this, 'godMode').name("God Mode").listen().__li.style.pointerEvents = 'none';
    }

    #init() {

        seed(Math.random());
        
        const container = document.getElementById( 'container' );
        
        this.#scene = new THREE.Scene();
        this.#scene.fog = new THREE.Fog(0x607a8d, 0, this.#fogfar)        
        this.#renderer = initRenderer('#607a8d');
        this.#renderer.shadowMap.type = THREE.VSMShadowMap;
        this.#clock = new THREE.Timer();

        this.#globalLight = new THREE.DirectionalLight(0xffffff, 1);
        this.#globalLight.intensity = 5;
        this.#globalLight.castShadow = true;
        this.#globalLight.position.set(-2000, 1000, this.#fogfar/2);
        this.#globalLight.target.position.set(1000, -100, this.#fogfar/2);
        this.#globalLight.shadow.camera.left = -this.#fogfar/2;
        this.#globalLight.shadow.camera.right = this.#fogfar/2;
        this.#globalLight.shadow.mapSize.width = 1024;
        this.#globalLight.shadow.mapSize.height = 1024;
        this.#globalLight.shadow.camera.top = 600;
        this.#globalLight.shadow.camera.bottom = -1000;
        this.#globalLight.shadow.camera.far = 5000;
        this.#globalLight.shadow.bias = -0.0001;


        this.#gameObjects = [];
        this.#player = this.instantiate(new Player());
        this.#camera = this.#player.getCamera();
        this.#mousePos = new THREE.Vector2();
        this._aimNDC = new THREE.Vector2(0, 0);
        this._crosshairPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.#stats = new Stats();

        container.append(this.#stats.dom);
        
        this.#buildInterface();

        this.#scene.add(this.#globalLight);
        this.#scene.add(this.#globalLight.target);

        window.onresize = () => { onWindowResize(this.#camera, this.#renderer); };
        this._crosshairDrawState = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this._crosshairTarget = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this._crosshairEasing = 0.18;
        document.addEventListener('mousemove', (e) => {
            if (!this.#cursorLocked) return;
            this._crosshairTarget.x += e.movementX * this.sensitivity;
            this._crosshairTarget.y += e.movementY * this.sensitivity;
            this._crosshairTarget.x = Math.max(0, Math.min(window.innerWidth, this._crosshairTarget.x));
            this._crosshairTarget.y = Math.max(0, Math.min(window.innerHeight, this._crosshairTarget.y));
        });

        this.#raycaster = new THREE.Raycaster();

        AssetManager.onProgress = (loaded, total) => {
            this.#showLoadingScreen(loaded, total);
        };

        AssetManager.onFinished = () => {
            this.#showStartScreen();
        };

        this.#setupInput();
        this.#setupCrosshair();
        this.#setupHealthbar();
        this.#setupOverlay();

        void this.instantiate(new Ground());

    }

    #udpate(dt = 1/60) {
        if (this.#state !== Game.RUNNING) return;

        const scaledDt = dt * this.speedMultiplier;

        this.#globalLight.position.set(-2000, 1000, this.#scene.fog.far/2);
        this.#globalLight.target.position.set(1000, -100, this.#scene.fog.far/2);
        this.#globalLight.shadow.camera.left = -this.#scene.fog.far/2;
        this.#globalLight.shadow.camera.right = this.#scene.fog.far/2;

        for (const gameObject of this.#gameObjects) {
            gameObject.update(scaledDt, this);
        }

        this.#checkCollisions();
        if (this.#player.health <= 0) this.#showGameOver();
    }

    #setupInput() {
        window.addEventListener('keydown', (e) => {

            if (e.key === 'Escape' && (this.#state === Game.RUNNING || this.#state === Game.PAUSED)) {
                if (this.#state === Game.PAUSED) {
                    this.#state = Game.RUNNING;
                }
                else if (this.#state === Game.RUNNING) {
                    this.#state = Game.PAUSED;
                }

                if (this.#state === Game.PAUSED && document.pointerLockElement) {
                    document.exitPointerLock();
                }
            }

            if (e.key === '1') this.speedMultiplier = 1;
            if (e.key === '2') this.speedMultiplier = 1.5;
            if (e.key === '3') this.speedMultiplier = 2;
            if (e.key === 'g') this.godMode = !this.godMode;
        });

        document.addEventListener('click', () => {

            if (this.#state === Game.PAUSED || this.#state === Game.RUNNING) {
                this.#state = Game.RUNNING;
                document.documentElement.requestPointerLock();
            }

        });

        document.addEventListener('pointerlockchange', () => {
            const locked = !!document.pointerLockElement;
            this.#cursorLocked = locked;
            document.documentElement.style.cursor = locked ? 'none' : 'default';

            if (locked) {
                this._crosshairPos.x = window.innerWidth / 2;
                this._crosshairPos.y = window.innerHeight / 2;

                if (this._crosshair) {
                    this._crosshair.style.left = '50%';
                    this._crosshair.style.top = '50%';
                    this._crosshair.style.transform = 'translate(-50%, -50%)';
                }

                this._aimNDC.set(0, 0);
            }
            else if (this.#state === Game.RUNNING) {
                this.#state = Game.PAUSED;
            }
        });
    }

    #setupCrosshair() {
        const canvas = document.createElement('canvas');
        canvas.id = 'crosshair';
        canvas.width = 100;
        canvas.height = 100;
        canvas.style.cssText = `
            position: fixed;
            left: 50%;
            top: 50%;
            width: 100px;
            height: 100px;
            pointer-events: none;
            z-index: 1000;
            transform: translate(-50%, -50%);
        `;
        this._crosshair = canvas;
        document.body.appendChild(canvas);

        this._crosshairDraw = () => {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, 100, 100);
            ctx.save();
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            const s = 40, l = 20, c = 50;
            ctx.beginPath();
            ctx.moveTo(c-s, c-s); ctx.lineTo(c+s, c-s); ctx.lineTo(c+s, c+s); ctx.lineTo(c-s, c+s); ctx.closePath();
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(c-s, c-s); ctx.lineTo(c-s+l, c-s+l);
            ctx.moveTo(c+s, c-s); ctx.lineTo(c+s-l, c-s+l);
            ctx.moveTo(c+s, c+s); ctx.lineTo(c+s-l, c+s-l);
            ctx.moveTo(c-s, c+s); ctx.lineTo(c-s+l, c+s-l);
            ctx.stroke();
            ctx.restore();
        };
        this._crosshairDraw();
    }

    #setupHealthbar() {
        const canvas = document.createElement('canvas');
        canvas.id = 'healthbar';
        const [width, height] = [400, 50];
        canvas.width = width;
        canvas.height = height;
        canvas.style.cssText = `
            position: fixed;
            left: 1%;
            bottom: 1%;
            width: ${width}px;
            height: ${height}px;
            pointer-events: none;
            z-index: 500;
            /*transform: translate(-50%, -50%);*/
        `;
        this._healthbar = canvas;
        document.body.appendChild(canvas);

        this._healthbarDraw = () => {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, 400, 50);
            ctx.save();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            const centerx = width/2, centery = height/2;
            const hwidth = width/2, hheight = height/2;
            let curHealth = this.#player.health;

            ctx.beginPath();
            ctx.moveTo(centerx-hwidth, centery-hheight); ctx.lineTo(centerx+hwidth, centery-hheight); ctx.lineTo(centerx+hwidth, centery+hheight); ctx.lineTo(centerx-hwidth, centery+hheight);
            ctx.closePath();
            ctx.stroke();
            
            ctx.fillStyle = '#ff0000';

            const paddingx = 0.98, paddingy = 0.87;
            const healthWidth = (curHealth / this.#player.maxHealth) * width * paddingx;
            ctx.fillRect(centerx-hwidth + healthWidth*(1-paddingx)/2, centery-hheight + height*(1-paddingx)*3, healthWidth, height * paddingy);
            ctx.restore();
        };
        this._healthbarDraw();
    }

    #setupOverlay() {

        this.#overlay = document.createElement('div');

        this.#overlay.style.cssText = `
            position: fixed;
            inset: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: rgba(0,0,0,.75);
            color: white;
            font-family: sans-serif;
            z-index: 5000;
        `;

        document.body.appendChild(this.#overlay);

        this.#showLoadingScreen(0, 0);
    }

    #createButton(text, callback) {

        const button = document.createElement('button');

        button.textContent = text;

        button.style.cssText = `
            padding: 15px 40px;
            font-size: 24px;
            cursor: pointer;
            margin-top: 30px;
        `;

        button.onclick = callback;

        return button;
    }

    #showLoadingScreen(loaded, total) {
        this.#overlay.style.display = "flex";
        this.#overlay.innerHTML = `
            <h1>Loading...</h1>
            <p>${loaded} / ${total}</p>
        `;
    }

    #showStartScreen() {
        this.#state = Game.START;

        this.#overlay.style.display = "flex";
        this.#overlay.innerHTML = "";

        const title = document.createElement("h1");
        title.textContent = "Flight Game";

        const button = this.#createButton("Start", () => {
            this.#overlay.style.display = "none";
            this.#state = Game.RUNNING;
            document.documentElement.requestPointerLock();
        });

        this.#overlay.append(title, button);
    }

    #showGameOver() {

        this.#state = Game.GAME_OVER;

        document.exitPointerLock();

        this.#overlay.style.display = "flex";
        this.#overlay.innerHTML = "";

        const title = document.createElement("h1");
        title.textContent = "Game Over";

        const restart = this.#createButton("Restart", () => {

            location.reload();

        });

        this.#overlay.append(title, restart);
        this._crosshair.style.display = "none";
        this._healthbar.style.display = "none";
    }

    #checkCollisions() {
        /**
         * @type {Bullet[]}
         */
        const bullets = this.#gameObjects.filter(obj => obj.constructor.name === 'Bullet');
        
        const playerPos = new THREE.Vector3();
        this.#player.getObj().getWorldPosition(playerPos);
        const airplane = this.#player.getObj().children.find(child => child.name === 'airplane');
        const playerBB = new THREE.Box3().setFromObject(airplane);

        
        for (const bullet of bullets) {
            const bulletBB = bullet.boundingBox;
            const ownerType = bullet.getOwnerType();

            if (ownerType === 'enemy') {
                if (playerBB.intersectsBox(bulletBB)) {
                    //this.hitCount++;
                    this.destroy(bullet);                    
                    if(this.godMode) continue;
                    this.#player.takeDamage(bullet.damage);
                }
            }
            else if (ownerType === 'player') {
                const ground = this.#gameObjects.find(obj => obj.constructor.name === 'Ground');
                if (ground && ground.getObj()) {
                    const planes = ground.getObj().children;
                    for (const plane of planes) {
                        if (plane.userData && Array.isArray(plane.userData.enemies)) {
                            for (let i = 0; i < plane.userData.enemies.length; i++) {
                                const enemy = plane.userData.enemies[i];
                                const enemyObj = enemy.getObj();
                                const enemyPos = new THREE.Vector3();
                                enemyObj.getWorldPosition(enemyPos);
                                const enemyBB = new THREE.Box3().setFromObject(enemyObj);

                                if (enemyBB.intersectsBox(bulletBB)) {
                                    if (enemy.isFading()) continue;
                                    this.destroy(bullet);
                                    if (enemy.fadeOut) {
                                        enemy.fadeOut();
                                    } else {
                                        this.destroy(enemy);
                                    }
                                    this.#enemyKills++;
                                    if (this.#enemyKills % 3 === 0) {
                                        this.#spawnHealthPack(enemy.getObj().position.clone());
                                    }
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * 
     * @param {THREE.Vector3} pos 
     */
    #spawnHealthPack(pos) {
        pos.x += THREE.MathUtils.randFloatSpread(200);
        pos.z += THREE.MathUtils.randFloatSpread(200);

        this.instantiate(new HealthPack(pos));
    }

    /**
     * 
     * @returns {THREE.Raycaster}
     */
    getRaycaster() {
        return this.#raycaster;
    }

    getAimNDC() {
        return this._aimNDC;
    }

    isCursorLocked() {
        return this.#cursorLocked;
    }

    /**
     * 
     * @returns {Player}
     */
    getPlayer() {
        return this.#player;
    }

    isPaused() {
        return this.#state === Game.PAUSED;
    }

    getSpeedMultiplier() {
        return this.speedMultiplier;
    }

    getHitCount() {
        return this.hitCount;
    }

    destroy(obj) {
        const idx = this.#gameObjects.indexOf(obj);
        if (idx !== -1) this.#gameObjects.splice(idx, 1);
        if (obj && obj.getObj) this.#scene.remove(obj.getObj());
        this.#scene.children.forEach(child => {
            if (child && child.userData && Array.isArray(child.userData.enemies)) {
                const before = child.userData.enemies.length;
                child.userData.enemies = child.userData.enemies.filter(e => e !== obj);
                if (child.userData.enemies.length === 0 && before > 0) {
                    child.userData.spawned = false;
                }
            }
        });
    }

    getMousePos() {
        return this.#mousePos;
    }

    instantiate(obj) {
        this.#gameObjects.push(obj);
        this.#scene.add(obj.getObj());

        return obj;
    }

    #render() {
        this.#renderer.render(this.#scene, this.#camera);
    }

    run() {
        this.#stats.update();
        requestAnimationFrame(this.run.bind(this));
        this.#clock.update();
        const dt = this.#clock.getDelta();
        // Easing for crosshair
        if (this._crosshair && this._crosshairDrawState && this._crosshairTarget) {
            this._crosshairDrawState.x += (this._crosshairTarget.x - this._crosshairDrawState.x) * this._crosshairEasing;
            this._crosshairDrawState.y += (this._crosshairTarget.y - this._crosshairDrawState.y) * this._crosshairEasing;

            this._crosshairDrawState.x = Math.max(0, Math.min(window.innerWidth, this._crosshairDrawState.x));
            this._crosshairDrawState.y = Math.max(0, Math.min(window.innerHeight, this._crosshairDrawState.y));

            this._crosshair.style.left = `${this._crosshairDrawState.x}px`;
            this._crosshair.style.top = `${this._crosshairDrawState.y}px`;
            this._crosshair.style.transform = 'translate(-50%, -50%)';
            this._crosshair.style.opacity = this.#cursorLocked ? '1' : '0';

            this._aimNDC.x = (this._crosshairDrawState.x / window.innerWidth) * 2 - 1;
            this._aimNDC.y = -(this._crosshairDrawState.y / window.innerHeight) * 2 + 1;

            if (this._crosshairDraw) this._crosshairDraw();
            if (this._healthbarDraw) this._healthbarDraw();
        }
        this.#udpate(dt);
        this.#render();
    }
}
