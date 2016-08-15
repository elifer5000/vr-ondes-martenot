import MainView from './view/MainView';

export default class Controller {
    constructor(renderingContextFactory) {
        this.view = new MainView(this, renderingContextFactory);
        this.view.initialize();
        this.objects = [];
        this.initialize();
    }

    initialize() {
        const geometry = new THREE.BoxGeometry( 0.15, 0.15, 0.15 );

        for ( let i = 0; i < 400; i ++ ) {
            const object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );

            object.position.x = Math.random() * 8 - 4;
            object.position.y = Math.random() * 8 - 4;
            object.position.z = Math.random() * 8 - 4;

            object.scale.x = Math.random() + 0.5;
            object.scale.y = Math.random() + 0.5;
            object.scale.z = Math.random() + 0.5;

            this.view.scene.add(object);
            this.objects.push(object);
        }
    }

    onControllerMoved(vrController) {
        for (const object of this.objects) {
            if (!object.bbox) {
                object.bbox = new THREE.Box3().setFromObject(object);
            }

            if (object.bbox.containsPoint(vrController.position)) {
                this.view.scene.remove(object);
            }
        }
    }

}