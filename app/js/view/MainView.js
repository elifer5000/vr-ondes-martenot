export default class MainView {
    constructor(controller, renderingContextFactory) {
        this.controller = controller;
        this.renderingContext = this.createRenderingContext(renderingContextFactory);
    }

    createRenderingContext(renderingContextFactory) {
        const domContainer = document.createElement('div');

        document.body.appendChild(domContainer);

        const renderingContext = renderingContextFactory.createRenderingContext(domContainer);

        domContainer.appendChild(renderingContext.getDomElement());

        return renderingContext;
    }

    initialize() {
        window.addEventListener( 'resize', (e) => this.onWindowResize(), false );
        this.renderingContext.addObserver( 'onControllerPositionChange', (e) => {
            
            this.controller.onControllerMoved(e.controllers, e.head);
        });

        this.render();
    }

    render() {
        requestAnimationFrame(() => this.render());

        this.renderingContext.onRender();
    }

    onWindowResize() {
        this.renderingContext.camera.aspect = window.innerWidth / window.innerHeight;
        this.renderingContext.camera.updateProjectionMatrix();

        this.renderingContext.setSize(window.innerWidth, window.innerHeight);
    }

    get scene() {
        return this.renderingContext.scene;
    }

    get camera() {
        return this.renderingContext.camera;
    }

    get renderer() {
        return this.renderingContext.renderer;
    }
}