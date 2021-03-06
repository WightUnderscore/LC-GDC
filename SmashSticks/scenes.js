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
	render() {
		this.scenes.get(this.currScene).render();
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
	constructor(n, bSrc) {
		this.name = n;
		this.objs = [];
		if (bSrc) {
			this.background = new Image();
			this.background.src = bSrc;
		}
		//length and width of the screen at its last known load
		this.lastW = innerWidth;
		this.lastH = innerHeight;
	}
	
	load() {
		updateNestedArrays(this.objs, "updateXScaling", [this.lastW, innerWidth]);
		updateNestedArrays(this.objs, "updateYScaling", [this.lastH, innerHeight]);
		updateNestedArrays(this.objs, "load");
	}
	unload() { 	
		updateNestedArrays(this.objs, "unload");
		this.lastW = innerWidth;
		this.lastH = innerHeight;
	}
	update() {
		updateNestedArrays(this.objs, "update");
	}
	updateXScaling(o, n) {
		updateNestedArrays(this.objs, "updateXScaling", [o, n]);
		
	}
	updateYScaling(o, n) {
		updateNestedArrays(this.objs, "updateYScaling", [o, n]);	
	}
	render() {
		ctx.fillStyle = "#FFFFFF";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		if (this.background) {
			ctx.drawImage(this.background, 0, 0, innerWidth, innerHeight);
		}
		updateNestedArrays(this.objs, "render");
	}
}

class StartScene extends Scene {
	/** Scene for when the player first opens the game. **/
	constructor() {
		super("start", "Pictures/MainMenu.png"); //I created a folder named "Pictures" so there would be less clutter
		//constructors in subclasses of scenes declares everything they need
		//start operations
		this.startButton = new SceneChangeButton(innerWidth/2, innerHeight*13/20, innerWidth/6, innerHeight/6,
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
		super("options");
		this.controlsButton = new SceneChangeButton(innerWidth/2, innerHeight*13/20, innerWidth/6, innerHeight/6,
								"Controls", "controls");
		this.fpsButton = new BooleanButton(innerWidth*3/10, innerHeight*13/20, innerWidth/6, innerHeight/6,
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
		super("controls");
		this.backButton = new SceneChangeButton(innerWidth/2, innerHeight*17/20, innerWidth/6, innerHeight/6,
								"Back", "options");
		this.objs.push(this.backButton);
	}
	load() {
		super.load();
		
	}
}

class FightScene extends Scene {
	/** A Scene to be center-stage on the ultimate stick figure beatdown. **/
	constructor() {
		super("ingame");
		this.floor = new Rectangle(innerWidth/2, innerHeight - 50, innerWidth, 100, "#9278F1");
		this.chars = [];
		this.chars[0] = new Character(null, innerHeight*3/4, innerWidth/18, innerHeight/3, "#555555", 65, 68, 87);
		this.chars[1] = new Character(null, innerHeight*3/4, innerWidth/18, innerHeight/3, "#333333", 37, 39, 38);
		this.walls = [];
		this.walls[0] = new Rectangle(-50, innerHeight - 250, 100, 1920, "#ffffff00") //#ffffff00 << transparent color
		this.walls[1] = new Rectangle(innerWidth+50, innerHeight - 250, 100, 1920, "#ffffff00")
		this.matchTimer = new MatchTimer(90000);
		
		this.objs.push(this.floor);
		this.objs.push(this.chars);
		this.objs.push(this.walls);
		this.objs.push(this.matchTimer);
	}
	load() {
		super.load();
		//spread out the players so that there is an equal amount of space between them
		var divisions = this.chars.length - 1;
		for (var z = 0; z <= divisions; z++) {
			this.chars[z].x = (1+(z*30/divisions))*innerWidth/32;
			this.chars[z].y = innerHeight*3/4;
		}
	}
	update() {
		super.update();
		for (var f of this.chars) {
			//if the timer is true, the players can move, otherwise they can't move
			f.canMove = this.matchTimer.matchGoing;
			if (rectRectCollision(f, this.floor)) {
				rectRectEject(f, this.floor);
				f.gVel = 0;
			}
			for (var x of this.chars) {
				if (!isEqual(x, f)) {
					rectRectEject(x, f, [true, true, false, false], true);
				}
			}
			for (var w of this.walls) {
				rectRectEject(f, w);
			}
		}
	}
}

class MatchTimer extends Positional {
	constructor(time) {
		super(innerWidth/2, innerHeight/2);
		this.matchGoing = false;
		this.matchLength = time;
		this.manager = null;
		this.endTime;
		this.remainTime;
	}
	load() {
		this.y = innerHeight/2;
		this.matchGoing = false;
		this.endTime = Date.now() + 3000;
	}
	update() {
		this.remainTime = this.endTime - Date.now();
		if (this.remainTime <= 0) {
			if (this.matchGoing) {
				//end of match
				this.manager.changeScene("postgame");
			} else {
				//beginning of match
				this.endTime = Date.now() + this.matchLength;
				this.matchGoing = true;
			}
		}
	}
	render() {
		if (this.remainTime <= 5000) {
			//dramatic countdown for final few seconds
			this.y = innerHeight/2;
			formatText(this.remainTime - Math.trunc(this.remainTime/1000)*1000, "Arial", "#CC0000", "center", "middle");
		} else {
			this.y = innerHeight/16;
			formatText(25/devicePixelRatio, "Arial", "#000000", "center", "middle");
		}
		ctx.fillText(Math.ceil(this.remainTime/1000), this.x, this.y);
	}
}

class AfterFightScene extends Scene {
	constructor() {
		/** A scene for viewing the winner, stats, etc., with a way to move on **/
		super("postgame");
		this.optionsButton = new SceneChangeButton(innerWidth/2, innerHeight*17/20, innerWidth/6, innerHeight/6, 
						"Continue", "start");
						
		this.objs.push(this.optionsButton);
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
	}
	update() {
		for (var c of cursorArray) {
			if (c && pointRectCollision(c, this) && c.selecting) { 
				this.btnFunc();
			}
		}
	}
	btnFunc() {
		//button functions goes here
	}
	render() {
		super.render();
		ctx.strokeStyle = "#000000";
		ctx.lineWidth = 6/devicePixelRatio;
		ctx.strokeRect(mid2Edge(this.x, this.w), mid2Edge(this.y, this.h), this.w, this.h);
		formatText(this.w / this.txt.length, "Comic Sans MS", "#000000", "center", "middle");
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
		ctx.strokeStyle = "#000000";
		ctx.lineWidth = 6/devicePixelRatio;
		ctx.strokeRect(mid2Edge(this.x, this.w), mid2Edge(this.y, this.h), this.w, this.h);
		formatText(this.w / this.txt.length, "Comic Sans MS", "#000000", "center", "middle");
		ctx.fillText(this.txt, this.x, this.y - this.h/8, this.w);
		ctx.fillText(this.bool.value.toString(), this.x, this.y + this.h/8, this.w);
	}
}
