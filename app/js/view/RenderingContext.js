import Observable from '../Observable';

export default class RenderingContext extends Observable {
    constructor(container) {
        super();
        this.initialize(container);
    }

    initialize(container) {
        const width  = window.innerWidth, height = window.innerHeight;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000);

        this.renderer = new THREE.WebGLRenderer( { antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setClearColor(0xf0f0f0, 1);

        const light = new THREE.SpotLight( 0xffffff );
        light.position.set( 10, 10, 20 );
        light.target.position.set(0, 0, 0);
        this.scene.add( light );
        const light2 = new THREE.SpotLight( 0xffffff );
        light2.position.set( -10, 10, -20 );
        light2.target.position.set(0, 0, 0);
        this.scene.add( light2 );

        this.scene.add(new THREE.HemisphereLight( 0xffffff, 0x00ff00, 0.6 ));
    }

    getHeadsetPosition() {
        return this.camera.position;
    }

    getHeadsetRotation() {
        return this.camera.rotation;
    }

    getDomElement() {
        return this.renderer.domElement;
    }
}