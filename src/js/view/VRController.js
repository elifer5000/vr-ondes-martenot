import { Vector3, Euler } from 'three';
// import Observable from '../Observable';
import { VR_BUTTONS } from './Common';

export class VRController {
    constructor(index, renderer, controllerModelFactory) {
        this.index = index;
        this.renderer = renderer;
        this.realPosition = new Vector3();
        this.realRotation = new Euler();
        this.realScale = new Vector3();

        this.controller = renderer.xr.getController(index);
        this.controller.addEventListener('connected', (e) => {
            this.controller.gamepad = e.data.gamepad
        });
        this.controller.addEventListener('disconnected', (e) => {
            this.controller.gamepad = null;
        });
        this.controller.userData.id = index;


        this.controllerGrip = renderer.xr.getControllerGrip(index);
        this.controllerGrip.add(controllerModelFactory.createControllerModel(this.controllerGrip));
        
        this.controller.addEventListener('selectstart', this.onSelectStart.bind(this));
        this.controller.addEventListener('select', this.onSelect.bind(this));
        this.controller.addEventListener('selectend', this.onSelectEnd.bind(this));
        this.controller.addEventListener('squeezestart', this.onSqueezeStart.bind(this));
        this.controller.addEventListener('squeeze', this.onSqueeze.bind(this));
        this.controller.addEventListener('squeezeend', this.onSqueezeEnd.bind(this));        
    }

    onSelectStart(e) {
        console.log('onSelectStart', e);
    }

    onSelect(e) {
        console.log('onSelect', e);
    }

    onSelectEnd(e) {
        console.log('onSelectEnd', e);
    }

    onSqueezeStart(e) {
        console.log('onSqueezeStart', e);
    }

    onSqueeze(e) {
        console.log('onSqueeze', e);
    }

    onSqueezeEnd(e) {
        console.log('onSqueezeEnd', e);
    }

    get matrixWorld() {
        return this.controller.matrixWorld;
    }

    addEventListener(type, callback) {
        this.controller.addEventListener(type, callback);
    }

    getButtonState(buttonIndex) {
        if (this.controller.gamepad) {
            // Compare gamepad.buttons with previous state
            let buttonsChanged = [];
            this.prevButtonsPressedState && this.controller.gamepad.buttons.forEach((button, index) => {
                if (button.pressed !== this.prevButtonsPressedState[index]) {
                    buttonsChanged.push(index);
                }
            });
            
            if (buttonsChanged.length) {
                console.log('Buttons', buttonsChanged);
            }

            this.prevButtonsPressedState = this.controller.gamepad.buttons.map(button => button.pressed);
            //// Debugging
            
            return this.controller.gamepad.buttons[buttonIndex].pressed;
        }

        return false;
    }
}