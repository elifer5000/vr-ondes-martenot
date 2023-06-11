import { VRButton } from 'three/addons/webxr/VRButton';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory'
import { VRController } from './VRController';
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
        
        this.controllers.forEach(controller => controller.update());
        
        this.dispatchEvent('onRender', { controllers: this.controllers, head: head });
        
        this.renderer.render(this.scene, this.camera);
    }

    setSize(width, height) {
        this.renderer.setSize(width, height);
    }

    addControllers() {
        const controllerModelFactory = new XRControllerModelFactory();

        this.controllers = [
            new VRController(0, this.renderer, controllerModelFactory),
            new VRController(1, this.renderer, controllerModelFactory)
        ];

        for (const controller of this.controllers) {
            this.scene.add(controller.controller);
            this.scene.add(controller.controllerGrip);
        }
    }

    getController(index) {
        return this.controllers[index];
    }
}