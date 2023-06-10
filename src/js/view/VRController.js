import { Vector3, Euler } from 'three';
import Observable from '../Observable';
import { VR_BUTTONS } from './Common';

const CONTROLLER_EVENTS = [
    'selectstart',
    'selectend',
    'select',
    'squeezestart',
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
            this.controller.gamepad = e.data.gamepad
        });
        this.controller.addEventListener('disconnected', (e) => {
            this.controller.gamepad = null;
        });
        this.controller.userData.id = index;


        this.controllerGrip = renderer.xr.getControllerGrip(index);
        this.controllerGrip.add(controllerModelFactory.createControllerModel(this.controllerGrip));
        
        // this.controller.addEventListener('selectstart', this.onSelectStart.bind(this));
        // this.controller.addEventListener('select', this.onSelect.bind(this));
        // this.controller.addEventListener('selectend', this.onSelectEnd.bind(this));
        // this.controller.addEventListener('squeezestart', this.onSqueezeStart.bind(this));
        // this.controller.addEventListener('squeeze', this.onSqueeze.bind(this));
        // this.controller.addEventListener('squeezeend', this.onSqueezeEnd.bind(this));
        
        this.buttonsState = {};
        this.buttonsKeys = Object.keys(VR_BUTTONS);
        this.buttonsKeys.forEach(key => {
            this.buttonsState[key] = false;
        });
    }

    // onSelectStart(e) {
    //     console.log('onSelectStart', e);
    // }

    // onSelect(e) {
    //     console.log('onSelect', e);
    // }

    // onSelectEnd(e) {
    //     console.log('onSelectEnd', e);
    // }

    // onSqueezeStart(e) {
    //     console.log('onSqueezeStart', e);
    // }

    // onSqueeze(e) {
    //     console.log('onSqueeze', e);
    // }

    // onSqueezeEnd(e) {
    //     console.log('onSqueezeEnd', e);
    // }

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

    getButtonState(buttonIndex) {
        if (this.controller.gamepad) {
            return this.controller.gamepad.buttons[buttonIndex].pressed;
        }

        return false;
    }
}