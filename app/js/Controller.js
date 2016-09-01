import MainView from './view/MainView';
import AudioController from './AudioController';

export default class Controller {
    constructor(renderingContextFactory) {
        this.audioW = 1.5;
        this.audioH = 1.6;
        this.audio = new AudioController(this.audioW, this.audioH);
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

        // const geometry = new THREE.BoxGeometry( 0.15, 0.15, 0.15 );
        //
        // for ( let i = 0; i < 400; i ++ ) {
        //     const object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );
        //
        //     object.position.x = Math.random() * 8 - 4;
        //     object.position.y = Math.random() * 8 - 4;
        //     object.position.z = Math.random() * 8 - 4;
        //
        //     object.scale.x = Math.random() + 0.5;
        //     object.scale.y = Math.random() + 0.5;
        //     object.scale.z = Math.random() + 0.5;
        //
        //     this.view.scene.add(object);
        //     this.objects.push(object);
        // }

        this.notes = this.audio.getNotesWithPosition();
        console.log(this.notes);
        for (const n in this.notes) {
            const isSharp = n.includes('#');
            const x = this.notes[n].position;
            const color = isSharp ? 0x300000 : 0x000040;
            const noteMesh = new THREE.Mesh(
                new THREE.BoxGeometry(isSharp ? 0.0075 : 0.01, 0.01, 0.2),
                new THREE.MeshBasicMaterial( { color: color, wireframe: false } )
            );
            noteMesh.position.set(x, 1.1, -1);
            this.view.scene.add( noteMesh );
            this.notes[n].mesh = noteMesh;
            this.notes[n].origColor = new THREE.Color(color);
        }

        this.highlightColor = new THREE.Color(0xFFFF00);
        this.audio.onStart(0, 0);
    }

    onControllerMoved(vrController, index) {
        // for (const object of this.objects) {
        //     if (!object.bbox) {
        //         object.bbox = new THREE.Box3().setFromObject(object);
        //     }
        //
        //     if (object.bbox.containsPoint(vrController.position)) {
        //         this.view.scene.remove(object);
        //     }
        // }

        // console.log(vrController);

        // if (this.audio)
        if (index === 0) {
            const pos = vrController.realPosition;
            let gamepad = null;
            let gain = pos.y;
            if (vrController.getGamepad) {
                gamepad = vrController.getGamepad();
                if (gamepad.buttons[1].pressed) {
                    // console.log('pressed');
                    gain = this.audioH * gamepad.buttons[1].value;
                } else {
                    gain = 0;
                }
                // console.log(gamepad.buttons[1].value);
            }
            this.audio.onChange(pos.x, gain);
            for (const n in this.notes) {
                const note = this.notes[n];
                if (Math.abs(pos.x - note.position) < 0.005) {
                    // console.log(n);
                    note.mesh.material.color = this.highlightColor;
                    if (gamepad) {
                        gamepad.haptics[0].vibrate(0.05, 25);
                    }
                } else {
                    note.mesh.material.color = note.origColor;
                }
            }
        }
    }

}