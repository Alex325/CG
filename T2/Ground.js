import * as THREE from 'three';
import { createGroundPlaneWired, createGroundPlaneXZ, setDefaultMaterial } from "../libs/util/util.js";
import { GameObject } from "./GameObject.js";
import { Tree1, Tree2 } from './Tree.js';
import Grid from '../libs/util/grid.js';
import { perlin2d, simplex2d } from './noise.js';

export class Ground extends GameObject {

    #speed = 800;
    #ngroundplanes = 3;
    /**
     * @type {THREE.Mesh[]}
     */
    #groundplanes = [];
    #treeCount = 100;
    #width = 10000;
    #length = 2000;
    #globalOffsetZ = 0;
    /**
     * @type {THREE.Object3D[]}
     */
    #treePool;

    constructor() {
        super();

        const planeMaterial = new THREE.MeshPhongMaterial({
            color: 'green',
            polygonOffset: false,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1
        });

        planeMaterial.side = THREE.DoubleSide;

        this.#treePool = new Array(this.#treeCount*this.#ngroundplanes);

        for (let i = 0; i < this.#treePool.length; i++) {
            const temp = THREE.MathUtils.randInt(0, 1);
            const tree = temp ? new Tree1() : new Tree2();
            const heightFactor = (THREE.MathUtils.seededRandom() - 0.5) * 0.5 + 0.5;
            tree.getObj().scale.set(1, 1, 1 + heightFactor);
            this.#treePool[i] = tree.getObj();
        }
        
        for (let i = 0; i < this.#ngroundplanes; i++) {
            const planeGeometry = new THREE.PlaneGeometry(this.#width, this.#length, 250, 50);
            const groundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
            groundPlane.receiveShadow = true;
            //groundPlane.add(new Grid(this.#width, this.#length, 50, 10, 'white'))
            groundPlane.rotation.x = THREE.MathUtils.degToRad(-90);
            groundPlane.position.z = i*this.#length;
            groundPlane.userData.number = i;
            this.#displace(groundPlane);
            this.#populate(groundPlane);
            this.#groundplanes.push(groundPlane);
        }

        this._object.add(...this.#groundplanes);

    }

    /**
     * @param {number} x 
     * @param {number} y 
     */
    #noise2d(x, y) {
        return perlin2d(x, y);
    }

    /**
     * 
     * @param {THREE.Mesh} plane 
     */
    #displace(plane) {

        const pos = plane.geometry.attributes.position;

        const vertex = new THREE.Vector3();

        const localX = plane.position.x;
        const localZ = this.#globalOffsetZ;

        for (let i = 0; i < pos.count; i++) {
            vertex.fromBufferAttribute(pos, i);
 
            const x = localX + vertex.x;
            const z = localZ - vertex.y;

            const height = this.#noise2d(x*0.001 + 0.54, z*0.001 + 0.45)*300;
            
            pos.setZ(i, height);

        }

        pos.needsUpdate = true;
        plane.geometry.computeBoundingBox();
        plane.updateMatrixWorld(true);
        this.#globalOffsetZ += this.#length;
        

    }

    /**
     * 
     * @param {THREE.Mesh} plane 
     */
    #populate(plane) {

        const placed = [];

        for (let i = 0; i < this.#treeCount; i++) {
            let attempts = 0;
            let valid = false;
            let x, y, z, tree, radius;

            while (!valid && attempts < 50) {
                attempts++;

                const vertexi = THREE.MathUtils.randInt(0, plane.geometry.attributes.position.count - 1);
                const vertex = new THREE.Vector3();

                vertex.fromBufferAttribute(plane.geometry.attributes.position, vertexi);

                ({x, y, z} = vertex);

                radius = 150; 
                
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

            tree = this.#treePool.pop();
            
            tree.position.set(x, y, z);

            plane.add(tree);
        }

    }

    /**
     * 
     * @param {THREE.Mesh} plane 
     */
    #reclaimTrees(plane) {
        this.#treePool.push(...plane.children);
        for (const tree of plane.children) {
            tree.position.z = 10000000;
        }
        plane.children.length = 0;
    }

    #rotatePlanes() {

        this._object.position.z = 0;

        const first = this.#groundplanes.shift();
        this.#groundplanes.push(first);


        for (let i = 0; i < this.#groundplanes.length; i++) {
            this.#groundplanes[i].position.z = i*this.#length;
        }

        this.#displace(first);
        this.#reclaimTrees(first);
        this.#populate(first);

    }

    update(dt, game) {

        this._object.translateZ(-this.#speed*dt);

        if (this._object.position.z < -(0 + this.#length))
            this.#rotatePlanes();        

    }
}