import '../../bin/WebVR';
import '../../bin/VRControls';
import '../../bin/VREffect';
import '../../bin/ViveController';
import RenderingContext from './RenderingContext';

export default class VRRenderingContext extends RenderingContext {
    initialize(container) {
        super.initialize(container);

        this.controls = new THREE.VRControls(this.camera);
        this.controls.standing = true;
        this.effect = new THREE.VREffect( this.renderer );

        this.addControllers();
    }

    onRender() {
        this.controls.update();
        this.effect.render(this.scene, this.camera);
    }

    addControllers() {
        this.controllers = [
            new THREE.ViveController(0),
            new THREE.ViveController(1)
        ];

        for (const controller of this.controllers) {
            controller.standingMatrix = this.controls.getStandingMatrix();
            this.scene.add(controller);

            controller.addEventListener( 'onPositionChange', (e) => {
                this.emit('onControllerPositionChange', { controller });
            });
        }
    }
}