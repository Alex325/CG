import * as THREE from 'three';
import { GLTFLoader } from './build/jsm/loaders/GLTFLoader.js';
import { GameObject } from './GameObject.js';

export class HealthPack extends GameObject {

    static ATTRACT_RADIUS = 250;
    static COLLECT_RADIUS = 20;
    static ATTRACT_SPEED = 1000;
    static TRANS_SPEED = 600;
    static ROTATION_SPEED = 2;
    static HEAL_PERCENT = 0.25;

    #attracting = false;

    /**
     * 
     * @param {THREE.Vector3} position 
     */
    constructor(position) {
        super();

        this._object.position.copy(position);

        const loader = new GLTFLoader();

        loader.load('./assets/healthpack.glb', (gltf) => {
            this._object.add(gltf.scene);
        });

        // Fallback object in case the model hasn't loaded yet.
        const crossMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff
        });

        const h = new THREE.Mesh(
            new THREE.BoxGeometry(20, 60, 20),
            crossMaterial
        );

        const v = new THREE.Mesh(
            new THREE.BoxGeometry(60, 20, 20),
            crossMaterial
        );

        h.visible = false;
        v.visible = false;

        this._object.add(h);
        this._object.add(v);
        this._object.scale.set(20, 20, 20);
    }

    update(dt, game) {

        this._object.rotateY(HealthPack.ROTATION_SPEED * dt);

        const player = game.getPlayer();

        const playerPos = new THREE.Vector3();
        player.getObj().children[2].getWorldPosition(playerPos);

        const distance = this._object.position.distanceTo(playerPos);

        if (!this.#attracting &&
            distance < HealthPack.ATTRACT_RADIUS) {

            this.#attracting = true;
        }

        this._object.position.z += -HealthPack.TRANS_SPEED*dt;

        if (!this.#attracting)
            return;

        const direction = playerPos
            .clone()
            .sub(this._object.position)
            .normalize();

        this._object.position.addScaledVector(
            direction,
            HealthPack.ATTRACT_SPEED * dt
        );

        if (distance < HealthPack.COLLECT_RADIUS) {

            player.heal(player.maxHealth * HealthPack.HEAL_PERCENT);

            game.destroy(this);
        }
    }
}