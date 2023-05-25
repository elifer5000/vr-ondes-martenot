import { Clock, Vector3 } from 'three';
import { FlyControls } from 'three/addons/controls/FlyControls';
import RenderingContext from './RenderingContext';
import VirtualVRController from './VirtualVRController';

export default class StandardRenderingContext extends RenderingContext {
    initialize(container) {
        super.initialize(container);
        this.clock = new Clock();
        this.controls = new FlyControls(this.camera, this.renderer.domElement);
        this.controls.movementSpeed = 1;
        this.controls.domElement = container;
        this.controls.rollSpeed = Math.PI / 24;
        this.controls.autoForward = false;
        this.controls.dragToLook = true;

        this.camera.position.set(0, 1.1, 0);

        this.addControllers();
    }

    getHeadsetPosition() {
        return this.camera.position;
    }

    getHeadsetRotation() {
        return this.camera.rotation;
    }

    onRender() {
        const delta = this.clock.getDelta();
        this.controls.update(delta);
        this.renderer.render(this.scene, this.camera);
        const head = { position: this.getHeadsetPosition(), rotation: this.getHeadsetRotation() };
        this.dispatchEvent('onControllerPositionChange', { controllers: this.controllers, head: head });
    }

    setSize(width, height) {
        this.renderer.setSize(width, height);
    }

    addControllers() {
        this.controllers = [
            new VirtualVRController(new Vector3(0.3, 0, -1), this),
            new VirtualVRController(new Vector3(-0.3, 0, -1), this)
        ];
    }

    getController(index) {
        return this.controllers[index];
    }
}