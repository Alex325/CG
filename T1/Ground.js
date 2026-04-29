import * as THREE from 'three';
import { createGroundPlaneWired, createGroundPlaneXZ, setDefaultMaterial } from "../libs/util/util.js";
import { GameObject } from "./GameObject.js";
import { Tree1, Tree2 } from './Tree.js';
import Grid from '../libs/util/grid.js';

export class Ground extends GameObject {

    #speed = 800;
    #groundplanes = [];
    #treeCount = 100;
    #width = 10000;
    #length = 2000;

    constructor() {
        super();

        const planeGeometry = new THREE.PlaneGeometry(this.#width, this.#length, 50, 10);
        const planeMaterial = new THREE.MeshPhongMaterial({
            color: 'green',
            polygonOffset: true,
            polygonOffsetFactor: 1, // positive value pushes polygon further away
            polygonOffsetUnits: 1
        });

        for (let i = 0; i < 3; i++) {
            const groundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
            groundPlane.receiveShadow = true;
            groundPlane.add(new Grid(this.#width, this.#length, 50, 10, 'white'))
            groundPlane.rotateX(THREE.MathUtils.degToRad(-90));
            groundPlane.translateY(-i*this.#length);
            this.#populate(groundPlane);
            this.#groundplanes.push(groundPlane);
        }

        this._object.add(...this.#groundplanes);


    }

    #populate(plane) {

        const placed = [];

        for (let i = 0; i < this.#treeCount; i++) {
            let attempts = 0;
            let valid = false;
            let x, y, tree, radius;

            while (!valid && attempts < 50) {
                attempts++;

                x = (THREE.MathUtils.seededRandom() - 0.5) * (this.#width * 0.9);
                y = (THREE.MathUtils.seededRandom() - 0.5) * (this.#length * 0.9);

                const temp = THREE.MathUtils.randInt(0, 1);
                tree = temp ? new Tree1() : new Tree2();

                radius = 100; 

                valid = true;

                for (const p of placed) {
                    const dx = x - p.x;
                    const dy = y - p.y;

                    const minDist = (radius + p.radius) / 2;

                    if (dx * dx + dy * dy < minDist * minDist) {
                        valid = false;
                        break;
                    }
                }
            }

            if (!valid) continue;

            placed.push({ x, y, radius });

            const heightFactor = (THREE.MathUtils.seededRandom() - 0.5) * 0.5 + 0.5;

            tree.getObj().position.set(
                x,
                y,
                tree.getObj().position.z + tree.trunkHeight / 2 + 10
            );

            tree.getObj().scale.set(1, 1, 1 + heightFactor);
            plane.add(tree.getObj());
        }

    }

    #rotatePlanes() {

        this._object.translateZ(this.#length);

        const first = this.#groundplanes.shift();
        this.#groundplanes.push(first);

        first.translateY(-(this.#groundplanes.length - 1)*this.#length);

        for (let i = 0; i < this.#groundplanes.length - 1; i++) {
            this.#groundplanes[i].translateY(this.#length);
        }


    }

    update(dt, game) {

        this._object.translateZ(-this.#speed*dt);

        if (this._object.position.z < -(0 + this.#length))
            this.#rotatePlanes();

    }
}