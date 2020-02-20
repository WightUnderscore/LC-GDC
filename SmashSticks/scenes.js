/**	SmashSticks/scenes.js		GDC 2019-2020
	This file is for the classes Scene, Scene's subclasses, SceneManager, and
	classes used by these. Scene is a skeleton class with the functions needed
	by instances of Scene. Each subclass contains the data needed to load and
	run a particular menu or the game itself. SceneManager handles loading,
	unloading, and updating Scenes.
*/

class SceneManager {
	/** Class which adds, loads, unloads, and updates Scenes. **/
	constructor() {
		this.scenes = new Map();
		this.currScene;
	}
	addScene(sceneObj) {
		this.scenes.set(sceneObj.name, sceneObj);
		var newSceneObjs = this.scenes.get(sceneObj.name).objs;
		for (var w = 0; w < newSceneObjs.length; w++) {
			//the manager adds itself to anything that requires knowing it
			if (newSceneObjs[w].manager === null) {
				newSceneObjs[w].manager = this;
			}
		}
	}
	changeScene(scene) {
		if (this.scenes.has(this.currScene)) {
			this.scenes.get(this.currScene).unload();
		}
		this.scenes.get(scene).load();
		this.currScene = scene;
	}
	update() {
		this.scenes.get(this.currScene).update();
	}
	updateXScaling(o, n) {
		this.scenes.get(this.currScene).updateXScaling(o, n);
	}
	updateYScaling(o, n) {
		this.scenes.get(this.currScene).updateYScaling(o, n);
	}
}

class Scene {
	/** Class that gives the functions needed to define a scene. **/
	constructor() {
		this.objs = [];
		//length and width of the screen at its last known load
		this.lastW = innerWidth;
		this.lastH = innerHeight;
	}
	
	load() {
		for (var x = 0; x < this.objs.length; x++) {
			this.objs[x].updateXScaling(this.lastW, innerWidth);
			this.objs[x].updateYScaling(this.lastH, innerHeight);
		}
	}
	unload() { 	
		for (var x = 0; x < this.objs.length; x++) {
			this.objs[x].unload();
		}
		this.lastW = innerWidth;
		this.lastH = innerHeight;
	}
	update() {
		for (var x = 0; x < this.objs.length; x++) {
			this.objs[x].update();
		}
		this.render();
	}
	updateXScaling(o, n) {
		for (var x = 0; x < this.objs.length; x++) {
			this.objs[x].updateXScaling(o, n);
		}
	}
	updateYScaling(o, n) {
		for (var x = 0; x < this.objs.length; x++) {
			this.objs[x].updateYScaling(o, n);
		}	
	}
	render() {
		for (var x = 0; x < this.objs.length; x++) {
			this.objs[x].render();
		}		
	}
}

class StartScene extends Scene {
	/** Scene for when the player first opens the game. **/
	constructor() {
		super();
		//constructors in subclasses of scenes declares everything they need
		//start operations
		this.name = "start";
		this.startButton = new SceneChangeButton(innerWidth/2, innerHeight/2, innerWidth/6, innerHeight/6,
								"START!", "ingame");
		this.optionsButton = new SceneChangeButton(innerWidth/2, innerHeight*17/20, innerWidth/6, innerHeight/6, 
								"Options", "options");
		this.objs.push(this.startButton);
		this.objs.push(this.optionsButton);
	}
}

class OptionsScene extends Scene {
	/** Scene for changing options (including dev options) **/
	constructor() {
		super();
		this.name = "options";
		this.controlsButton = new SceneChangeButton(innerWidth/2, innerHeight/2, innerWidth/6, innerHeight/6,
								"Controls", "controls");
		this.fpsButton = new BooleanButton(innerWidth/3, innerHeight/2, innerWidth/6, innerHeight/6,
								"Show FPS", showFPS);
		this.backButton = new SceneChangeButton(innerWidth/2, innerHeight*17/20, innerWidth/6, innerHeight/6, 
								"Back", "start");
		this.objs.push(this.controlsButton);
		this.objs.push(this.fpsButton);
		this.objs.push(this.backButton);
	}
}

class ControlChangeScene extends Scene { 
	/** Scene for real gamers (not Julian) to change their control layout. **/
	constructor() {
		super();
		this.name = "controls";
		this.backButton = new SceneChangeButton(innerWidth/2, innerHeight*17/20, innerWidth/6, innerHeight/6,
								"Back", "options");
		this.objs.push(this.backButton);
	}
}

class FightScene extends Scene {
	/** A Scene to be center-stage on the ultimate stick figure beatdown. **/
	constructor() {
		super();
		this.name = "ingame";
		this.floor = new Rectangle(innerWidth/2, innerHeight - 50, innerWidth, 100, "#9278F1");
		this.testbox = new Character(50, window.innerHeight - 250, 100, 300, "#555555");
		
		this.objs.push(this.floor);
		this.objs.push(this.testbox);
	}
	update() {
		super.update();
		if (!rectRectCollision(this.testbox, this.floor)) { 
			this.testbox.y += 1;
		}
	}
}

///////////////////
// EXTRA CLASSES //
///////////////////
class Button extends Rectangle {
	/** A box with text that can be selected for an effect. **/
	constructor(x, y, w, h, t) {
		super(x, y, w, h);
		this.color = "#555555";
		this.txt = t;
		console.log(this);
	}
	update() {
		for (var c of cursorArray) {
			if (c && pointRectCollision(c, this) && c.selecting) { 
				this.btnFunc();
			}
		}
	}
	unload() {
	}
	btnFunc(){
		//button functions goes here
	}
	render() {
		super.render();
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
		ctx.font = (this.w / this.txt.length) + "px Comic Sans MS";
		ctx.fillStyle = "#000000";
		ctx.fillText(this.txt, this.x, this.y, this.w);
	}
}

class SceneChangeButton extends Button {
	/** A Button that changes the current Scene to a new Scene. **/
	constructor(x, y, w, h, t, r) {
		super(x, y, w, h, t);
		this.redirect = r;
		this.manager = null;
	}
	btnFunc() {
		this.manager.changeScene(this.redirect);
	}
}

class BooleanButton extends Button {
	/** A Button that changes the value of a Boolean when pressed. **/
	constructor(x, y, w, h, t, b) {
		super(x, y, w, h, t);
		this.bool = b;
	}
	btnFunc() {
		this.bool.value = !this.bool.value;
	}
	render() {
		if (this.bool.value) {
			ctx.fillStyle = "green";
		} else {
			ctx.fillStyle = "darkred";
		}
		ctx.fillRect(mid2Edge(this.x, this.w), mid2Edge(this.y, this.h), this.w, this.h);
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
		ctx.font = (this.w / this.txt.length) + "px Comic Sans MS";
		ctx.fillStyle = "#000000";
		ctx.fillText(this.txt, this.x, this.y - this.h/8, this.w);
		ctx.fillText(this.bool.value.toString(), this.x, this.y + this.h/8, this.w);
	}
}
