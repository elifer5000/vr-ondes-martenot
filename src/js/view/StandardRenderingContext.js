import { Clock, Vector3 } from 'three';
import { FlyControls } from 'three/addons/controls/FlyControls';
import RenderingContext from './RenderingContext';
import VirtualVRController from './VirtualVRController';

export default class StandardRenderingContext extends RenderingContext {
    initialize(container) {
        super.initialize(container);
        this.clock = new Clock();
        this.flyControls = new FlyControls(this.camera, container);
        this.flyControls.movementSpeed = 1;
        this.flyControls.rollSpeed = Math.PI / 24;
        this.flyControls.autoForward = false;
        this.flyControls.dragToLook = true;
        this.flyControlsEnabled = true;

        this.camera.position.set(0, 1.1, 0);
        this.camera.updateMatrixWorld();

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
        if (this.flyControlsEnabled) {
            this.flyControls.update(delta);
        }
        this.renderer.render(this.scene, this.camera);
        const head = { position: this.getHeadsetPosition(), rotation: this.getHeadsetRotation() };
        this.dispatchEvent('onRender', { controllers: this.controllers, head: head });
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