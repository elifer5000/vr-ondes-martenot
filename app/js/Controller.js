import MainView from './view/MainView';
import AudioController from './AudioController';

export default class Controller {
    constructor(renderingContextFactory) {
        this.audioW = 0.8;
        this.audioH = 1.6;
        this.audio = [];
        this.audio.push(new AudioController(this.audioW, this.audioH));
        this.audio.push(new AudioController(this.audioW, this.audioH));
        this.view = new MainView(this, renderingContextFactory);
        this.view.initialize();
        this.objects = [];
        this.initialize();
    }

    initialize() {
        const room = new THREE.Mesh(
            new THREE.BoxGeometry( 6, 6, 6, 8, 8, 8 ),
            new THREE.MeshBasicMaterial( { color: 0x404040, wireframe: true } )
        );
        room.position.y = 3;
        this.view.scene.add( room );

        this.notes = this.audio[0].getNotesWithPosition();
        console.log(this.notes);
        for (const n in this.notes) {
            const isSharp = n.includes('#');
            const x = this.notes[n].position;
            const color = isSharp ? 0x301280 : 0x00FF40;
            const noteMesh = new THREE.Mesh(
                new THREE.BoxGeometry(isSharp ? 0.003 : 0.0075, 0.01, 0.2),
                new THREE.MeshStandardMaterial( { color: color, wireframe: false } )
            );
            noteMesh.position.set(x, 1.1, -1);
            this.view.scene.add( noteMesh );
            this.notes[n].mesh = noteMesh;
            this.notes[n].origColor = new THREE.Color(color);
        }

        this.highlightColor = new THREE.Color(0xFFFF00);
    }

    resetHighlights() {
        for (const n in this.notes) {
            const note = this.notes[n];
            note.mesh.material.color = note.origColor;
        }
    }

    changeAudioFromController(vrController, audio) {
        const pos = vrController.realPosition;
           
        let gain = pos.y;
        const gamepad = vrController.getGamepad();
        if (gamepad) {
            gain = this.audioH * gamepad.buttons[1].value;
        }
        audio.onChange(pos.x, gain);
        for (const n in this.notes) {
            const note = this.notes[n];
            if (Math.abs(pos.x - note.position) < 0.005) {
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
            this.changeAudioFromController(controllers[i], this.audio[i]);
        }
    }
}