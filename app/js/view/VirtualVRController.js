import '../../../node_modules/three/examples/js/controls/TransformControls';
import Observable from '../Observable';

export default class VirtualVRController extends Observable {
    constructor(cameraOffset, renderingContext) {
        super();
        this.cameraOffset = cameraOffset;
        this.renderingContext = renderingContext;
        this.initialize();
    }

    initialize() {
        const geometry = new THREE.SphereGeometry(0.05, 32, 32);
        this.mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 'yellow' }));

        this.control = new THREE.TransformControls(this.renderingContext.camera, this.renderingContext.getDomElement());
        this.control.attach( this.mesh );
        this.control.setSize(1);
        this.control.setSpace('local');
        this.renderingContext.scene.add(this.mesh);
        this.renderingContext.scene.add(this.control);

        this.control.addEventListener( 'objectChange', () => {
            this.emit('onPositionChange');
        });

        this.resetPosition();
    }

    resetPosition() {
        const pLocal = this.cameraOffset.clone();
        const pWorld = pLocal.applyMatrix4( this.renderingContext.camera.matrixWorld );
        const dir = pWorld.sub(this.renderingContext.camera.position).normalize();

        this.mesh.position.copy(this.renderingContext.camera.position);
        this.mesh.position.add(dir.multiplyScalar(2));
        this.control.update();
        this.emit('onPositionChange');
    }

    get realPosition() {
        return this.position;
    }

    get position() {
        return this.mesh.position;
    }

    getButtonState(button) {
        if (button === 'grips') return false;

        return true;
    }

    getGamepad() {
        return null;
    }
}