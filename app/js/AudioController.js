var calculateFrequency = function(position, width) {
    var minF = 20;
    var maxF = 1800;

    return (position / width) * (maxF - minF) + minF;
};

var calculateGain = function(position, height) {
    var minG = 0;
    var maxG = 1;

    var gain = (position / height) * (maxG - minG) + minG;
    // console.log(gain);
    return gain;
};

export default class AudioController {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.context = new AudioContext();
        this.oscillator = null;
        this.gainNode = this.context.createGain();
    }

    _startSound(posX, posY) {
        this.oscillator = this.context.createOscillator();
        // oscillator.type = 'square';
        // gainNode = context.createGain();
        // oscillator.connect(context.destination);
        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(this.context.destination);
        this.oscillator.start(this.context.currentTime);

        if (posX) {
            this.oscillator.frequency.setTargetAtTime(calculateFrequency(posX, this.width), this.context.currentTime, 0.01);
            this.gainNode.gain.setTargetAtTime(calculateGain(posY, this.height), this.context.currentTime, 0.01);
        }
    };

    _stopSound() {
        this.oscillator.stop(this.context.currentTime);
        this.oscillator.disconnect();
    };

    onStart(posX, posY) {
        if (this.oscillator) {
            this._stopSound();
        }

        this._startSound(posX, posY);
    }

    onStop() {
        if (this.oscillator) {
            this._stopSound();
        }
    }

    onChange(posX, posY) {
        if (this.oscillator) {
            this.oscillator.frequency.setTargetAtTime(calculateFrequency(posX, this.width), this.context.currentTime, 0.01);
            this.gainNode.gain.setTargetAtTime(calculateGain(posY, this.height), this.context.currentTime, 0.01);
            // this.gainNode.gain.value = 0;
        }
    }
}







