import MainView from './view/MainView';
import AudioController from './AudioController';

export default class Controller {
    constructor(renderingContextFactory) {
        this.audioW = 0.8;
        this.audioH = 1.6;
        this.audio = [];
        const keysLocation = new THREE.Vector3(0.4, 0.5, -2);
        const keysOrientation = 0;
        this.audio.push(new AudioController(this.audioW, this.audioH, keysLocation, keysOrientation));
        this.audio.push(new AudioController(this.audioW, this.audioH, keysLocation, keysOrientation));
        this.view = new MainView(this, renderingContextFactory);
        this.view.initialize();
        this.initialize();
    }

    initialize() {
        const room = new THREE.Mesh(
            new THREE.BoxGeometry( 6, 6, 6, 8, 8, 8 ),
            new THREE.MeshBasicMaterial( { color: 0x404040, wireframe: true } )
        );
        room.position.y = 3;
        this.view.scene.add( room );

        this.addKeysToScene();

        this.highlightColor = new THREE.Color(0xFFFF00);
    }

    // TODO add a parent object that contains the keyboard's location and orientation
    // could probably use full orientation and transform the control's coordiante system
    // to they keyboards local one
    addKeysToScene() {
        this.notes = this.audio[0].getNotesWithPosition();
        // console.log(this.notes);
        for (const n in this.notes) {
            const isSharp = n.includes('#');
            const pos = this.notes[n].position;
            const color = isSharp ? 0x301280 : 0x00FF40;
            const noteMesh = new THREE.Mesh(
                new THREE.BoxGeometry(isSharp ? 0.003 : 0.0075, 0.01, 0.2),
                new THREE.MeshStandardMaterial( { color: color, wireframe: false } )
            );
            noteMesh.position.copy(pos);
            noteMesh.rotation.y = this.audio[0].orientation;
            this.view.scene.add( noteMesh );
            this.notes[n].mesh = noteMesh;
            this.notes[n].origColor = new THREE.Color(color);
        }
    }

    moveKeys(pos, orientation) {
        for (let i = 0; i < this.audio.length; i++) {
            this.audio[i].position.copy(pos);
            this.audio[i].orientation = orientation;
        }

        for (const n in this.notes) {
            this.view.scene.remove(this.notes[n].mesh);
        }

        this.addKeysToScene();
    }

    resetHighlights() {
        for (const n in this.notes) {
            const note = this.notes[n];
            note.mesh.material.color = note.origColor;
        }
    }

    changeAudioFromController(vrController, audio) {
        const pos = vrController.realPosition;
           
        let gain = 0.5; //Math.max(pos.y - this.keysLocation.y, 0);
        const gamepad = vrController.getGamepad();
        if (gamepad) {
            gain = this.audioH * Math.log2(1 + gamepad.buttons[1].value);
        }
        audio.onChange(pos, gain);
        for (const n in this.notes) {
            const note = this.notes[n];

            const posXRotatedToKeys = audio.normalizePosition(pos.clone().sub(audio.position));
            const noteRotated = audio.normalizePosition(note.position.clone().sub(audio.position));
            if (Math.abs(posXRotatedToKeys - noteRotated) < 0.005) {
                note.mesh.material.color = this.highlightColor;
                //if (gamepad) {
                //    gamepad.haptics[0].vibrate(0.05, 25);
                //}
            }
        }
    }



    onControllerMoved(controllers, head) {
        this.resetHighlights();
        for (let i = 0; i < controllers.length; i++) {
            if (controllers[i].getButtonState('grips')) {
                this.moveKeys(controllers[i].realPosition, Math.PI);
            }
            this.changeAudioFromController(controllers[i], this.audio[i]);
        }
    }
}