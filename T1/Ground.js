import * as THREE from 'three';
import { createGroundPlaneXZ, setDefaultMaterial } from "../libs/util/util.js";
import { GameObject } from "./GameObject.js";
import { Tree1, Tree2 } from './Tree.js';

export class Ground extends GameObject {

    #speed = 400;
    #groundplanes = [];
    #treeCount = 100;
    #width = 10000;
    #length = 2000;

    constructor() {
        super();


        const planeGeometry = new THREE.PlaneGeometry(this.#width, this.#length);
        const planeMaterial = setDefaultMaterial('green');
        planeMaterial.wireframe = true;

        for (let i = 0; i < 3; i++) {
            const groundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
            groundPlane.rotateX(THREE.MathUtils.degToRad(-90));
            groundPlane.translateY(-i*this.#length);
            this.#populate(groundPlane);
            this.#groundplanes.push(groundPlane);
        }

        this._object.add(...this.#groundplanes);


    }

    #populate(plane) {

        for (let i = 0; i < this.#treeCount; i++) {
            const [x, y] = [THREE.MathUtils.seededRandom() - 0.5, THREE.MathUtils.seededRandom() - 0.5];
            const heightFactor = (THREE.MathUtils.seededRandom() - 0.5)*0.5;

            const temp = THREE.MathUtils.randInt(-1, 2);

            const tree = temp ? new Tree1() : new Tree2();
            tree.getObj().position.set(x*(this.#width/2), y*(this.#length/2), tree.getObj().position.z + tree.trunkHeight/2);
            tree.getObj().scale.set(1, 1, 1  + heightFactor);
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