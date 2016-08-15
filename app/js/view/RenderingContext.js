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

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(width, height);
        this.renderer.setClearColor(0xf0f0f0, 1);

        const light = new THREE.DirectionalLight(0xffffff, 1);

        light.position.set(15,15,15);
        this.scene.add(light);

        this.scene.add(new THREE.AmbientLight(0xffffff));
    }

    getDomElement() {
        return this.renderer.domElement;
    }
}