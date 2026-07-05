import * as THREE from 'three';
import { AssetManager } from './AssetManager.js';

export class SoundManager {
    static listener;
    /**
     * @type {THREE.Audio}
     */
    static music;

    static initialize(camera) {
        this.listener = new THREE.AudioListener();
        camera.add(this.listener);

        this.music = new THREE.Audio(this.listener);
        this.music.setBuffer(AssetManager.audio.music)
        this.music.setLoop(true);
        this.music.setLoopStart(19);
        this.music.setVolume(0.2);
        this.music.setLoopEnd(133.33);
    }

    static play(name, volume = 0.1) {
        const sound = new THREE.Audio(this.listener);

        sound.setBuffer(AssetManager.audio[name]);
        sound.setVolume(volume);
        sound.play();

        sound.source.onended = () => sound.disconnect();
    }

    static playMusic() {
        this.music.play();
    }

    static pauseMusic() {
        this.music.pause();
    }

    static resumeMusic() {
        this.music.play();
    }
}