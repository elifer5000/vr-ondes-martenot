function mapNotesToFrequency() {
    var baseFreq = 440; // A4
    var baseSteps = 9; // A
    var baseOctave = 4;

    var notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    var octaveStart = 3;
    var octaveEnd = 5;

    var notesFreqMap = {};
    for (var oct = octaveStart; oct <= octaveEnd; oct++) {
        for (var step = 0; step < 12; step++) {
            var freq = baseFreq * Math.pow(2, (oct*12 + step - baseOctave*12 - baseSteps) / 12);

            notesFreqMap[notes[step] + oct.toString()] = { freq: freq, step: oct*12 + step };
        }
    }

    return notesFreqMap;
}



function calculateFrequency(position, width) {
    var baseFreq = 440; // A4
    var baseSteps = 9; // A
    var baseOctave = 4;

    var minNote = 3*12; // ~C3
    var maxNote = 5*12 + 11; // ~B5

    var note = (position / width) * (maxNote - minNote) + minNote;
    if (note > maxNote || note < minNote) return 0;

    var freq = baseFreq * Math.pow(2, (note - baseOctave*12 - baseSteps) / 12);

    return freq;
}

function calculateGain(position, height) {
    // console.log(position, height);
    var minHeight = 1.1;
    if (position < minHeight) return 0;

    var minG = 0;
    var maxG = 1;
    position -= minHeight;

    var gain = (position / height) * (maxG - minG) + minG;
    // console.log(gain);
    return gain;
}

export default class AudioController {
    constructor(width, height) {
        this.width = width;
        this.height = height;

        this.notesToFreq = mapNotesToFrequency();
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

    getNotesWithPosition() {
        var minNote = 3*12; // ~C3
        var maxNote = 5*12 + 11; // ~B5

        for (var note in this.notesToFreq) {
            if (this.notesToFreq.hasOwnProperty(note)) {
                this.notesToFreq[note].position = this.width * (this.notesToFreq[note].step - minNote) / (maxNote - minNote)
            }
        }

        return this.notesToFreq;
    }
}







