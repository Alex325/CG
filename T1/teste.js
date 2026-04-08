import {initRenderer, 
        initDefaultSpotlight,
        createGroundPlaneXZ,
        SecondaryBox, 
        onWindowResize,
        setDefaultMaterial} from "../libs/util/util.js";
import * as THREE from 'three';
import KeyboardState from '../libs/util/KeyboardState.js'

const renderer = initRenderer();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 100);
const light = initDefaultSpotlight(scene, new THREE.Vector3(0, 20, 0), 1000);
camera.position.set(0, 20, 20);
camera.lookAt(new THREE.Vector3(0, 0, 0))
window.onresize = () => { onWindowResize(camera, renderer); };

const plane = createGroundPlaneXZ(100, 100);

const cubeGeometry = new THREE.BoxGeometry(10, 10, 10);
const material = setDefaultMaterial('red');

const cube = new THREE.Mesh(cubeGeometry, material);

scene.add(plane);
scene.add(cube);

render();

function render() {
    requestAnimationFrame(render);

    renderer.render(scene, camera);
}