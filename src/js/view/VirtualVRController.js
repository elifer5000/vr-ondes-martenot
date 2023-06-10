import { TransformControls } from 'three/addons/controls/TransformControls';
import { Mesh, MeshStandardMaterial, SphereGeometry } from 'three';
import Observable from '../Observable';
import { VR_BUTTONS } from './Common';

export default class VirtualVRController extends Observable {
    constructor(cameraOffset, renderingContext) {
        super();
        this.cameraOffset = cameraOffset;
        this.renderingContext = renderingContext;
        this.initialize();
    }

    initialize() {
        const geometry = new SphereGeometry(0.05, 32, 32);
        this.mesh = new Mesh(geometry, new MeshStandardMaterial({ color: 'yellow' }));

        this.control = new TransformControls(this.renderingContext.camera, this.renderingContext.getDomElement());
        this.control.attach( this.mesh );
        this.control.setSize(1);
        this.control.setSpace('local');
        this.renderingContext.scene.add(this.mesh);
        this.renderingContext.scene.add(this.control);

        this.control.addEventListener('mouseDown', () => {
            this.renderingContext.flyControlsEnabled = false;
        });
        this.control.addEventListener('mouseUp', () => {
            this.renderingContext.flyControlsEnabled = true;
        });
        this.control.addEventListener( 'objectChange', () => {
            this.dispatchEvent('onPositionChange');
        });

        this.thumbpadIsPressed = false;
        this.triggerIsPressed = false;
        this.gripsArePressed = false;
        this.menuIsPressed = false;

        window.addEventListener('keydown', (e) => this.onKeydown(e));
        window.addEventListener('keyup', (e) => this.onKeyup(e));

        this.resetPosition();
    }

    onKeydown(e) {
        switch (e.keyCode) {
            case 32: // space
                this.gripsArePressed = true;
                break;
            case 49: // 1
                this.control.setMode('translate');
                break;
            case 50: // 2
                this.control.setMode('rotate');
                break;
            case 53: // 5
                this.triggerIsPressed = true;
                this.dispatchEvent('triggerdown');
                break;
            case 54: // 6
                this.menuIsPressed = true;
                this.dispatchEvent('menudown');
                break;
        }
    }

    onKeyup(e) {
        switch (e.keyCode) {
            case 32: // space
                this.gripsArePressed = false;
                break;
            case 53: // 5
                this.triggerIsPressed = false;
                this.dispatchEvent('triggerup');
                break;
            case 54: // 6
                this.menuIsPressed = false;
                this.dispatchEvent('menuup');
                break;
        }
    }

    resetPosition() {
        const pLocal = this.cameraOffset.clone();
        const pWorld = pLocal.applyMatrix4( this.renderingContext.camera.matrixWorld );
        const dir = pWorld.sub(this.renderingContext.camera.position).normalize();

        this.mesh.position.copy(this.renderingContext.camera.position);
        this.mesh.position.add(dir.multiplyScalar(2));
        this.control.updateMatrixWorld();
        this.dispatchEvent('onPositionChange');
    }

    get realPosition() {
        return this.position;
    }

    get realRotation() {
        return this.rotation;
    }

    get position() {
        return this.mesh.position;
    }

    get rotation() {
        return this.mesh.rotation;
    }

    getButtonPressedState(button) {
        if (button === VR_BUTTONS.GRIP) return this.gripsArePressed;
        if (button === VR_BUTTONS.TRIGGER) return this.triggerIsPressed;
        if (button === VR_BUTTONS.B_OR_Y) return this.menuIsPressed;
    }

    getButtonValue(button) {
        if (button === VR_BUTTONS.TRIGGER) return 1;
        
        return 0;
    }

    pulse() {}
}