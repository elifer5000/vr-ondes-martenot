import MainView from './view/MainView';
import AudioController from './AudioController';
import { Mesh, BoxGeometry, Color, MeshStandardMaterial, BackSide, Object3D, BufferGeometry, Vector3, Line, BufferAttribute } from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';

export default class Controller {
    constructor(renderingContextFactory) {
        this.keyboardWidth = 1.0;
        this.keyWidth = 0.0075;
        this.keySharpWidth = 0.0070;
        this.keyHeight = 0.01;
        this.keyLength = 0.2;

        this.soundNameMeshes = [ null, null ];
        this.audio = [];
        this.view = new MainView(this, renderingContextFactory);
        this.view.initialize();

        this.checkAudioPermissions();
    }

    checkAudioPermissions() {
        // Set the source of the audio element to an empty audio file
        let audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=');
        audio.muted = true;

        audio.play().then(() => {
            audio.pause();
            audio = null;
            // allowed. Initialise the audio
            this.initialize();
        })
        .catch(() => {
            // not allowed. Need to ask for permission
            this.canAudioContainer = document.querySelector('#canaudio-container');
            this.canAudioContainer.style.display = 'block';

            this.canaudio = document.querySelector('#canaudio');
            this.canaudio.checked = false;
            this.canaudio.addEventListener('change',  () => {
                if (this.canaudio.checked && !this.room) {
                    // initialise the spatial audio
                    this.initialize();
                }
            })
        });
    }

    initialize() {
        // remove #canaudio checkbox from document
        this.canAudioContainer?.parentNode.removeChild(this.canAudioContainer);
        this.canAudioContainer = null;

        this.audio.push(new AudioController(this.keyboardWidth));
        this.audio.push(new AudioController(this.keyboardWidth));

        this.room = new Mesh(
            new BoxGeometry( 6, 6, 6, 8, 8, 8 ), this.createRoomMaterial()
        );
        this.room.position.y = 3;

        this.room.receiveShadow = true;
        this.view.scene.add( this.room );

        this.highlightColor = new Color(0xFFFF00);

        for (let index = 0; index < this.view.renderingContext.controllers.length; index++) {
            const controller = this.view.renderingContext.controllers[index];
            controller.addEventListener('triggerdown', () => { this.onTriggerDown(index); });
            controller.addEventListener('menudown', () => { this.onMenuDown(index); });
        }
        const loader = new FontLoader();
        this.waveGeometry = [];
        loader.load('helvetiker_regular.typeface.json', ( font ) => {
            this.font = font;
            console.log('font loaded');
            this.addKeysToScene();
            this.createWaveVisualization(0);
            this.createWaveVisualization(1);
        });

    }

    createRoomMaterial() {
        this.texturedMaterial = new MeshStandardMaterial( { emissive: 0xfffdfb, emissiveIntensity: 0.15, side: BackSide } )
        const floorMaterial = new MeshStandardMaterial( { color: 0xA0A0A0, side: BackSide } );

        const materials = [];
        for (let i = 0; i < 6; i++) {
            if (i === 3) {
                materials.push(floorMaterial);
            } else {
                materials.push(this.texturedMaterial);
            }
        }

        return materials;
    }

    createKeyGeometry(isSharp) {
        return new BoxGeometry(isSharp ? this.keySharpWidth : this.keyWidth, this.keyHeight, this.keyLength);
    }

    addKeysToScene() {
        this.notes = this.audio[0].getNotesWithPosition();
        this.rootObject = new Object3D();
        const baseMesh = new Mesh(new BoxGeometry(1.05*this.keyboardWidth, 1.05*this.keyHeight, 1.2*this.keyLength),
                                        new MeshStandardMaterial( { color: 0x838380 }));

        baseMesh.position.y -= 1.05*this.keyHeight / 2;
        baseMesh.castShadow = true;
        baseMesh.receiveShadow = true;
        this.rootObject.add(baseMesh);
        // console.log(this.notes);
        for (const n in this.notes) {
            const isSharp = n.includes('#');
            const pos = this.notes[n].position;
            const color = isSharp ? 0x353535 : 0xfffff0;
            const noteMesh = new Mesh(
                this.createKeyGeometry(isSharp),
                new MeshStandardMaterial( { color: color, wireframe: false } )
            );
            noteMesh.position.copy(pos);
            //noteMesh.rotation.y = this.audio[0].orientation;
            this.rootObject.add( noteMesh );
            this.notes[n].mesh = noteMesh;
            this.notes[n].isSharp = isSharp;
            this.notes[n].origColor = new Color(color);

            if (!isSharp) {
                const fontGeometry = new TextGeometry(n[0], {size: 0.015, height: 0.005, font: this.font});
                const fontMesh = new Mesh(fontGeometry, new MeshStandardMaterial({color: 0x3661a5}));
                fontMesh.position.copy(pos);
                fontMesh.position.z -= this.keyLength / 2;
                fontMesh.position.x -= 0.006;
                fontMesh.position.y += this.keyHeight;

                fontMesh.rotation.x -= Math.PI / 6;
                this.rootObject.add(fontMesh);
            }
        }
        this.updateSoundName(0);
        this.updateSoundName(1);
        this.rootObject.position.set(0.4, 0.5, -2);
        // this.rootObject.rotation.set(0, 0, 0);

        this.view.renderingContext.addSpotlight(this.rootObject);
        this.view.scene.add(this.rootObject);
    }

    moveKeys(pos, orientation) {
        const downVec = new Vector3(0, -0.05, 0);
        downVec.applyEuler(orientation);
        this.rootObject.position.copy(pos);
        this.rootObject.position.add(downVec);
        this.rootObject.rotation.copy(orientation);
    }

    resetHighlights() {
        for (const n in this.notes) {
            const note = this.notes[n];
            note.mesh.material.color = note.origColor;
        }
    }

    createWaveVisualization(index) {
        const geo = new BufferGeometry();
        const width =  0.15;
        const bufferLength = 1024;
        const offset = (index === 0) ? -this.keyboardWidth/3 : this.keyboardWidth/4.5;

        const itemSize = 3;
        const totalSize = bufferLength * itemSize
        const vertices = new Float32Array(totalSize);
            
        for (let i = 0; i < totalSize; i += itemSize) {
            vertices[i] = offset + -width/2 + i*width/(bufferLength-1);
            vertices[i + 1] = 0.3;
            vertices[i + 2] = -this.keyLength / 2;
        }
        geo.setAttribute('position', new BufferAttribute(vertices, itemSize));

        const points = new Line(geo);

        this.rootObject.add(points);
        this.waveGeometry.push(points);
    }

    updateWaveVisualization(index) {
        if (!this.waveGeometry || index >= this.waveGeometry.length) {
            return;
        }
        const waveform = this.audio[index].getWaveFormData();
        let maxv = 0;
        const halfHeight = 0.2;
        // console.log(waveform.data.length);
        for (let i = 0; i < waveform.length; i++) {
            this.waveGeometry[index].geometry.attributes.position.setY(i, 0.3 + halfHeight*waveform[i]);
            maxv = Math.max(maxv, waveform[i]);
        }
        // console.log(maxv);   
        this.waveGeometry[index].geometry.attributes.position.needsUpdate = true;
    }

    changeAudioFromController(vrController, audio) {
        if (!this.rootObject) {
            return;
        }

        const pos = vrController.realPosition;
           
        let gain = 0.99;
        const gamepad = vrController.getGamepad?.();
        if (gamepad) {
            gain = 0;
            // let detuneCents = 0;
            const markerOnPad = vrController.markerOnPad;
            if (gamepad.buttons[0].touched) {
                // gain = Math.log10(1 + 9 * (gamepad.axes[1] + 1) / 2);
                // Let's try the opposite of log, x^4
                // Axes are in the [-1, 1] range
                //const gainNormalized = (Math.max(-0.5, gamepad.axes[1]) + 0.5) / 1.5; // Normalizes to the [0, 1] range, leaving the bottom 1/4th of the pad unused (=0)
                const gainNormalized = 0.5*gamepad.axes[1] + 0.5; // Normalize to the [0, 1] range
                gain = gainNormalized * gainNormalized * gainNormalized;
                // console.log(gain);
                // detuneCents = 100*gamepad.axes[0];

                const newPosition = new Vector3(0.0, 0.003785, 0.049204); // Center position
                newPosition.x = -0.020221 + (0.020221 + 0.020221) * (0.5 * gamepad.axes[0] + 0.5);
                newPosition.y = 0.002646 + (0.007248 - 0.002646) * (0.5 * gamepad.axes[1] + 0.5);
                newPosition.z = 0.069432 + (0.029242 - 0.069432) * (0.5 * gamepad.axes[1] + 0.5);

                markerOnPad.position.copy(newPosition);
                markerOnPad.visible = true;
            } else {
                markerOnPad.visible = false;
            }
            // audio.detune(detuneCents);
        }

        const posLocal = pos.clone();
        this.rootObject.worldToLocal(posLocal);
        // check is inside space if not, gain 0
        if (Math.abs(posLocal.z) > this.keyLength/2 || Math.abs(posLocal.y) > 0.3 || Math.abs(posLocal.x) > this.keyboardWidth/2) {
            audio.onChange(0, 0);
            return;
        }

        
        let currentNote = null;
        for (const n in this.notes) {
            const note = this.notes[n];

            if (Math.abs(posLocal.x - note.position.x) < 0.0065) {
                note.mesh.material.color = this.highlightColor;

                if (gamepad && vrController.lastNote !== note) {
                    if (gamepad.haptics) { // Old version. Deprecated
                        gamepad.haptics[0].vibrate(0.25, 25);
                    } else if (gamepad.hapticActuators) {
                        gamepad.hapticActuators[0].pulse(0.25, 25);
                    }
                }
                currentNote = note;
                break;
            }
        }
        if (currentNote) {
            audio.onChange(currentNote.position.x, gain);   
        }
        else {
            audio.onChange(posLocal.x, gain);    
        }            

        vrController.lastNote = currentNote;
    }

    updateSoundName(index) {
        if (!this.font) return;

        if (this.soundNameMeshes[index]) {
            this.rootObject.remove(this.soundNameMeshes[index]);
        }

        const fontSoundGeometry = new TextGeometry(this.audio[index].getSoundName(), {size: 0.03, height: 0.005, font: this.font});
        const fontDelayGeometry = new TextGeometry(this.audio[index].isDelayEnabled ? 'delay on' : '', {size: 0.02, height: 0.005, font: this.font});

        this.soundNameMeshes[index] = new Mesh(fontSoundGeometry, new MeshStandardMaterial({color: 0xb642f4}));
        this.soundNameMeshes[index].position.z = -this.keyLength / 2;
        this.soundNameMeshes[index].position.x = (index === 0) ? -this.keyboardWidth/3 : this.keyboardWidth/4.5;
        this.soundNameMeshes[index].position.y = 7*this.keyHeight;
        this.soundNameMeshes[index].rotation.x -= Math.PI / 6;

        const delayMesh = new Mesh(fontDelayGeometry, new MeshStandardMaterial({color: 0xb642f4}));
        delayMesh.position.y = -2.5*this.keyHeight;
        this.soundNameMeshes[index].add(delayMesh);


        this.rootObject.add(this.soundNameMeshes[index] );
    }


    onTriggerDown(index) {
        this.audio[index].selectNextSound();
        this.updateSoundName(index);
    }

    onMenuDown(index) {
        this.audio[index].toggleDelay();
        this.updateSoundName(index);
    }

    onControllerMoved(controllers, head) {
        this.resetHighlights();
        for (let i = 0; i < controllers.length; i++) {
            if (controllers[i].getButtonState('grips')) {
                this.moveKeys(controllers[i].realPosition, controllers[i].realRotation);
            }

            this.changeAudioFromController(controllers[i], this.audio[i]);
            this.updateWaveVisualization(i);
        }
    }
}