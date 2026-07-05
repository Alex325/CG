import { AssetManager } from "./AssetManager.js";
import { Game } from "./Game.js";



const game = new Game();

AssetManager.onProgress = (loaded, total) => {
    game.showLoadingScreen(loaded, total);
};

await AssetManager.load();

game.initialize();

game.showStartScreen();

game.run();