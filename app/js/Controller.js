import MainView from './view/MainView';
import AudioController from './AudioController';

export default class Controller {
    constructor(renderingContextFactory) {
        const keyboardWidth = 1.0;
        this.keyWidth = 0.0075;
        this.keySharpWidth = 0.003;
        this.keyHeight = 0.01;
        this.keyLength = 0.2;

        this.audio = [];
        this.audio.push(new AudioController(keyboardWidth));
        this.audio.push(new AudioController(keyboardWidth));
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

    createKeyGeometry(isSharp) {
        return new THREE.BoxGeometry(isSharp ? this.keySharpWidth : this.keyWidth, this.keyHeight, this.keyLength);
    }

    addKeysToScene() {
        this.notes = this.audio[0].getNotesWithPosition();
        this.rootObject = new THREE.Object3D();
        // console.log(this.notes);
        for (const n in this.notes) {
            const isSharp = n.includes('#');
            const pos = this.notes[n].position;
            const color = isSharp ? 0x301280 : 0x00FF40;
            const noteMesh = new THREE.Mesh(
                this.createKeyGeometry(isSharp),
                new THREE.MeshStandardMaterial( { color: color, wireframe: false } )
            );
            noteMesh.position.copy(pos);
            //noteMesh.rotation.y = this.audio[0].orientation;
            this.rootObject.add( noteMesh );
            this.notes[n].mesh = noteMesh;
            this.notes[n].isSharp = isSharp;
            this.notes[n].origColor = new THREE.Color(color);
        }

        this.rootObject.position.set(0.4, 0.5, -2);
        // this.rootObject.rotation.set(0, 0, 0);

        this.view.scene.add(this.rootObject);
    }

    moveKeys(pos, orientation) {
        this.rootObject.position.copy(pos);
        this.rootObject.rotation.copy(orientation);
    }

    resetHighlights() {
        for (const n in this.notes) {
            const note = this.notes[n];
            note.mesh.material.color = note.origColor;
        }
    }

    changeAudioFromController(vrController, audio) {
        if (!this.rootObject) {
            return;
        }

        const pos = vrController.realPosition;
           
        let gain = 0.5;
        const gamepad = vrController.getGamepad();
        if (gamepad) {
            gain = Math.log10(1 + 9 * gamepad.buttons[1].value);
        }

        const posLocal = pos.clone();
        this.rootObject.worldToLocal(posLocal);
        console.log(posLocal);
        // check is inside space if not, gain 0
        if (Math.abs(posLocal.z) > this.keyLength/2 || Math.abs(posLocal.y) > 0.3) {
            audio.onChange(null, 0);
            return;
        }

        audio.onChange(posLocal.x, gain);
        for (const n in this.notes) {
            const note = this.notes[n];

            if (Math.abs(posLocal.x - note.position.x) < 0.005) {
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
                this.moveKeys(controllers[i].realPosition, controllers[i].rotation);
            }
            this.changeAudioFromController(controllers[i], this.audio[i]);
        }
    }
}