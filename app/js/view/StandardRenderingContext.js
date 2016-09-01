import '../../../node_modules/three/examples/js/controls/FlyControls';
import RenderingContext from './RenderingContext';
import VirtualVRController from './VirtualVRController';

export default class StandardRenderingContext extends RenderingContext {
    initialize(container) {
        super.initialize(container);
        this.clock = new THREE.Clock();
        this.controls = new THREE.FlyControls(this.camera);
        this.controls.movementSpeed = 1;
        this.controls.domElement = container;
        this.controls.rollSpeed = Math.PI / 24;
        this.controls.autoForward = false;
        this.controls.dragToLook = true;

        this.camera.position.set(0, 1.1, 0);

        this.addControllers();
    }

    onRender() {
        const delta = this.clock.getDelta();
        this.controls.update(delta);
        this.renderer.render(this.scene, this.camera);
        for (let i = 0; i < this.controllers.length; i++) {
            this.emit('onControllerPositionChange', { controller: this.controllers[i], index: i });
        }
    }

    setSize(width, height) {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    addControllers() {
        this.controllers = [
            new VirtualVRController(new THREE.Vector3(0.3, 0, -1), this),
            new VirtualVRController(new THREE.Vector3(-0.3, 0, -1), this)
        ];
    }

    getController(index) {
        return this.controllers[index];
    }
}