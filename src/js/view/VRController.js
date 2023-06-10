import { Vector3, Euler } from 'three';
import Observable from '../Observable';
import { VR_BUTTONS } from './Common';

const CONTROLLER_EVENTS = [
    'selectstart', // Select is the same as trigger
    'selectend',
    'select',
    'squeezestart', // Squeeze is the same as grip
    'squeezeend',
    'squeeze',
];
export class VRController extends Observable {
    constructor(index, renderer, controllerModelFactory) {
        super();
        this.index = index;
        this.renderer = renderer;
        this.realPosition = new Vector3();
        this.realRotation = new Euler();
        this.realScale = new Vector3();

        this.controller = renderer.xr.getController(index);
        this.controller.addEventListener('connected', (e) => {
            const gamepad = e.data.gamepad;
            this.controller.gamepad = gamepad;
            this.supportHaptic = 'hapticActuators' in gamepad && gamepad.hapticActuators != null && gamepad.hapticActuators.length > 0;
        });
        this.controller.addEventListener('disconnected', (e) => {
            this.controller.gamepad = null;
            this.supportHaptic = false;
        });
        this.controller.userData.id = index;


        this.controllerGrip = renderer.xr.getControllerGrip(index);
        this.controllerGrip.add(controllerModelFactory.createControllerModel(this.controllerGrip));
         
        this.buttonsState = {};
        this.buttonsKeys = Object.keys(VR_BUTTONS);
        this.buttonsKeys.forEach(key => {
            this.buttonsState[key] = false;
        });
    }

    get matrixWorld() {
        return this.controller.matrixWorld;
    }

    addEventListener(type, callback) {
        if (CONTROLLER_EVENTS.indexOf(type) !== -1) {
            this.controller.addEventListener(type, callback);
            return;
        }

        super.addEventListener(type, callback);
    }

    update() {
        if (!this.controller.gamepad) {
            return;
        }

        // Compare gamepad.buttons with previous state
        this.buttonsKeys.forEach(key => {
            const isPressed = this.controller.gamepad.buttons[VR_BUTTONS[key]].pressed;
            if (this.buttonsState[key] !== isPressed) {
                if (isPressed) {
                    this.dispatchEvent(key + 'start', { controller: this });
                } else {
                    this.dispatchEvent(key + 'end', { controller: this });
                }
                this.buttonsState[key] = isPressed;
            }
        });
    }

    getButtonPressedState(buttonIndex) {
        if (this.controller.gamepad) {
            return this.controller.gamepad.buttons[buttonIndex].pressed;
        }

        return false;
    }

    getButtonValue(buttonIndex) {
        if (this.controller.gamepad) {
            return this.controller.gamepad.buttons[buttonIndex].value;
        }

        return 0;
    }

    pulse(duration, value) {
        if (!this.supportHaptic) {
            return;
        }

        this.controller.gamepad.hapticActuators[0].pulse(duration, value);
    }
}