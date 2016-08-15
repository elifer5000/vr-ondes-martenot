import StandardRenderingContext from './StandardRenderingContext';
import VRRenderingContext from './VRRenderingContext';

export default class RenderingContextFactory {
    constructor(type) {
        this.type = type;
    }

    createRenderingContext(domContainer) {
        if (this.type === 'vr') {
            return new VRRenderingContext(domContainer);
        } else {
            return new StandardRenderingContext(domContainer);
        }
    }

}