function BufferLoader(context, urlList, callback) {
  this.context = context;
  this.urlList = urlList;
  this.onload = callback;
  this.bufferList = [];
  this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
    // Load buffer asynchronously
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    var loader = this;

    request.onload = function () {
        // Asynchronously decode the audio file data in request.response
        loader.context.decodeAudioData(
            request.response,
            function (buffer) {
                if (!buffer) {
                    alert('error decoding file data: ' + url);
                    return;
                }
                loader.bufferList[index] = buffer;
                if (++loader.loadCount == loader.urlList.length)
                    loader.onload(loader.bufferList);
            },
            function (error) {
                console.error('decodeAudioData error', error);
            }
        );
    };

    request.onerror = function () {
        alert('BufferLoader: XHR error');
    };

    request.send();
};

BufferLoader.prototype.load = function() {
  for (var i = 0; i < this.urlList.length; ++i)
  this.loadBuffer(this.urlList[i], i);
};

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

export default class AudioController {
    constructor(width, height, position, orientation) {
        this.width = width;
        this.height = height;
        this.position = position;
        this.orientation = orientation;

        this.notesToFreq = mapNotesToFrequency();
        this.context = new AudioContext();
        this.oscillator = this.context.createOscillator();
        this.oscillator.type = 'sine'; //sine, triangle or square or sawtooth

        this.LFO = this.context.createOscillator();
        this.LFO.type = 'triangle';
        this.LFO.frequency.value = 1; // Hz

        this.LFOGainNode = this.context.createGain();
        this.LFOGainNode.gain.value = 0.5;

        this.convolver = this.context.createConvolver();
        
        this.gainNode = this.context.createGain();
        this.gainNode.gain.node = 0;

        this.volNode = this.context.createGain();
        this.volNode.gain.value = 0.8;

        this.filter = this.context.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.value = 2000;
        // this.filter.Q.value = 5;

        this.initBufferLoader();

        this.LFOGainNode.connect(this.oscillator.frequency); // FM
        this.LFO.connect(this.LFOGainNode);

        this.gainNode.connect(this.volNode);
        // this.filter.connect(this.volNode);
        this.volNode.connect(this.convolver);
        this.convolver.connect(this.context.destination);
        this.oscillator.connect(this.gainNode);

        this.LFO.start();
        this.oscillator.start();

    }


    normalizePosition(pos) {
        return -pos.z * Math.sin(this.orientation) + pos.x * Math.cos(this.orientation);
    }

    initBufferLoader() {
        const bufferLoader = new BufferLoader(this.context,
            [  //List of preloaded impulse files
            '../resources/arena.wav'
            ],
            (bufferList) => {
                const impulseResponses = []
                for (let i = 0; i < bufferList.length; i++)
                    impulseResponses.push(bufferList[i]);
              
                this.convolver.buffer = impulseResponses[0];
            });

      bufferLoader.load();
    }

    onChange(pos, gain) {
        if (this.oscillator) {
            this.oscillator.frequency.value = this._calculateFrequency(this.normalizePosition(pos.clone().sub(this.position)) + this.width/2);
            this.gainNode.gain.value = this._calculateGain(gain);
        }
    }

    getNotesWithPosition() {
        var minNote = 3*12; // ~C3
        var maxNote = 5*12 + 11; // ~B5

        for (var note in this.notesToFreq) {
            if (this.notesToFreq.hasOwnProperty(note)) {
                const pos = new THREE.Vector3();
                pos.copy(this.position);

                const location = this.width * (this.notesToFreq[note].step - minNote) / (maxNote - minNote) - this.width/2;
                pos.x += location * Math.cos(this.orientation);
                pos.z -= location * Math.sin(this.orientation);

                this.notesToFreq[note].position = pos;
            }
        }

        return this.notesToFreq;
    }

    _calculateFrequency(val) {
        var baseFreq = 440; // A4
        var baseSteps = 9; // A
        var baseOctave = 4;

        var minNote = 3*12; // ~C3
        var maxNote = 5*12 + 11; // ~B5

        var note = (val / this.width) * (maxNote - minNote) + minNote;
        if (note > maxNote || note < minNote) return 0;

        var freq = baseFreq * Math.pow(2, (note - baseOctave*12 - baseSteps) / 12);

        return freq;
    }

    _calculateGain(val) {
        // console.log(position, height);
        var minG = 0;
        var maxG = 1;

        var gain = (val / this.height) * (maxG - minG) + minG;
         // console.log(gain);
        return gain;
    }
}







