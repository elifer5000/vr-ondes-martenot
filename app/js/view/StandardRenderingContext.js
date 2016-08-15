import '../../bin/FlyControls';
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

        this.addControllers();

        this.controls.onPositionChange = () => {
            for (const controller of this.controllers) {
                controller.resetPosition();
            }
        };
    }

    onRender() {
        const delta = this.clock.getDelta();
        this.controls.update(delta);
        this.renderer.render(this.scene, this.camera);
    }

    addControllers() {
        this.controllers = [
            new VirtualVRController(new THREE.Vector3(0.3, 0, -1), this),
            new VirtualVRController(new THREE.Vector3(-0.3, 0, -1), this)
        ];

        for (const controller of this.controllers) {
            controller.addObserver( 'onPositionChange', (e) => {
                this.emit('onControllerPositionChange', { controller });
            });
        }
    }

    getController(index) {
        return this.controllers[index];
    }
}