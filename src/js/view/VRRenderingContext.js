import { Vector3, Euler } from 'three'
import { VRButton } from 'three/addons/webxr/VRButton';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory'
import RenderingContext from './RenderingContext';

export default class VRRenderingContext extends RenderingContext {
    initialize(container) {
        super.initialize(container);

        // Add VR button
	    document.body.appendChild(VRButton.createButton(this.renderer));
        this.renderer.xr.enabled = true;

        this.addControllers();
    }

    onRender() {
        this.isVRActive = this.renderer.xr.isPresenting;

        const head = { position: this.getHeadsetPosition(), rotation: this.getHeadsetRotation() };
        for (let i = 0; i < this.controllers.length; i++) {
            this.controllers[i].matrixWorld.decompose(this.controllers[i].realPosition, this.controllers[i].realRotation, this.controllers[i].realScale);
        }
        this.dispatchEvent('onControllerPositionChange', { controllers: this.controllers, head: head });
        
        this.renderer.render(this.scene, this.camera);
    }

    setSize(width, height) {
        this.renderer.setSize(width, height);
    }

    addControllers() {
        const controller1 = this.renderer.xr.getController(0);
        // controller1.addEventListener( 'selectstart', onSelectStart );
        // controller1.addEventListener( 'selectend', onSelectEnd );
        // controller1.addEventListener( 'squeezestart', onSqueezeStart );
        // controller1.addEventListener( 'squeezeend', onSqueezeEnd );
        controller1.addEventListener( 'connected', (e) => {
            controller1.gamepad = e.data.gamepad
        });
        controller1.userData.id = 0;
        this.scene.add(controller1);

        const controller2 = this.renderer.xr.getController(1);
        // controller2.addEventListener( 'selectstart', onSelectStart );
        // controller2.addEventListener( 'selectend', onSelectEnd );
        controller2.addEventListener( 'connected', (e) => {
            controller2.gamepad = e.data.gamepad
        });
        controller2.userData.id = 1;
        this.scene.add(controller2);

        const controllerModelFactory = new XRControllerModelFactory();

        const controllerGrip1 = this.renderer.xr.getControllerGrip(0);
        controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
        this.scene.add(controllerGrip1);

        const controllerGrip2 = this.renderer.xr.getControllerGrip(1);
        controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
        this.scene.add(controllerGrip2);

        this.controllers = [
            controller1,
            controller2
        ];

        for (const controller of this.controllers) {
            controller.realPosition = new Vector3();
            controller.realRotation = new Euler();
            controller.realScale = new Vector3();
            controller.getButtonState = (buttonIndex) => {
                if (controller.gamepad) {
                    // return controller.gamepad.buttons[buttonIndex].pressed;
                }
                return false;
            }
        }
    }

    getController(index) {
        return this.controllers[index];
    }
}