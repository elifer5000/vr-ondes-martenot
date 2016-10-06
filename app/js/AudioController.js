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
    var octaveEnd = 6;

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
    constructor(width) {
        this.width = width;

        this.notesToFreq = mapNotesToFrequency();
        this.context = new AudioContext();

        this.oscillator = this.context.createOscillator();

        this.LFO = this.context.createOscillator();
        this.LFO.type = 'sine';
        this.LFO.frequency.value = 1; // Hz

        this.LFOGainNode = this.context.createGain();
        this.LFOGainNode.gain.value = 0.3;

        this.convolver = this.context.createConvolver();
        
        this.gainNode = this.context.createGain();
        this.gainNode.gain.value = 0;

        this.volNode = this.context.createGain();
        this.volNode.gain.value = 0.2;

        this.filter = this.context.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.value = 1800;
        // this.filter.Q.value = 5;

        this.delay = this.context.createDelay();
        this.delay.delayTime.value = 0.3;

        this.delayFeedback = this.context.createGain();
        this.delayFeedback.gain.value = 0.7;

        this.delay.connect(this.delayFeedback);
        this.delayFeedback.connect(this.delay);

        this.initBufferLoader();

        this.LFO.connect(this.LFOGainNode);

        this.LFOGainNode.connect(this.oscillator.frequency); // FM
        this.oscillator.connect(this.gainNode);

        this.gainNode.connect(this.filter);
        this.filter.connect(this.volNode);
        this.volNode.connect(this.convolver);
        // this.volNode.connect(this.context.destination);
        this.convolver.connect(this.context.destination);
        this.delay.connect(this.context.destination);

        this.LFO.start();
        this.oscillator.start();

        this.setSound('sawtooth');
        this.setDelay(true);
    }

    setSound(soundName) {
        switch (soundName) {
            case 'sine':
                this.updateSoundWave([1.0, 1.0],
                                    [0.0, 0.0]);
                break;
            case 'trapezium':
                this.updateSoundWave([1.273, 0.993, 0.0, 0.314, 0.0, 0.168, 0.0, 0.101, 0.0, 0.060, 0.0, 0.033],
                                        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
                break;
            case 'violin':
                this.updateSoundWave([0.49, 0.995, 0.94, 0.425, 0.480, 0, 0.365, 0.04, 0.085, 0, 0.09, 0],
                                [0, 0, Math.PI / 2, 0, Math.PI / 2, 0, Math.PI / 2, 0, Math.PI / 2, 0, Math.PI / 2, 0]);
                break;
            case 'square':
                this.updateSoundWave([4/Math.PI,1,0,0.3333,0,0.2,0,0.1429,0,0.1111,0,0.0909],
                                    [0,0,0,0,0,0,0,0,0,0,0,0]);
                break;
            case 'triangle':
                this.updateSoundWave([0.81,1,0,0.11111,0,0.04,0,0.02041,0,0.0123,0,0.0083],
                                    [0,Math.PI/2,0,Math.PI/2,0,Math.PI/2,0,Math.PI/2,0,Math.PI/2,0,Math.PI/2]);
                break;
            case 'sawtooth':
                this.updateSoundWave([2/Math.PI,1,0.5,0.333,0.25,0.2,0.1667,0.1429,0.125,0.1111,0.1,0.0909],
                                    [0,0,0,0,0,0,0,0,0,0,0,0]);
                break;
        }
    }

    updateSoundWave(amps, phases) {
        const curveSin = new Float32Array(amps.length);
        const curveCos = new Float32Array(amps.length);
        curveSin[0] = 0;
        curveCos[0] = 0;

        for (let i = 1; i < amps.length; ++i) {
            curveSin[i] = amps[i] * amps[0] * Math.cos(phases[i]);
            curveCos[i] = amps[i] * amps[0] * Math.sin(phases[i]);
        }

        const waveTable = this.context.createPeriodicWave(curveCos, curveSin);
        this.oscillator.setPeriodicWave(waveTable);
    }

    initBufferLoader() {
        const bufferLoader = new BufferLoader(this.context,
            [  //List of preloaded impulse files
            '../resources/arena.wav'
            ],
            (bufferList) => {
                const impulseResponses = [];
                for (let i = 0; i < bufferList.length; i++)
                    impulseResponses.push(bufferList[i]);
              
                this.convolver.buffer = impulseResponses[0];
            });

      bufferLoader.load();
    }

    onChange(pos, gain) {
        if (pos !== null) {
            const freq = this._calculateFrequency(pos + this.width / 2);
            this.oscillator.frequency.value = freq;
            // for (let i = 0; i < this.harmonics.length; i++) {
            //     this.harmonics[i].frequency.value = freq * (i + 1);
            // }
        }
        if (gain !== null) {
            this.gainNode.gain.value = this._calculateGain(gain);
        }
    }

    detune(cents) {
        // for (let i = 0; i < this.harmonics.length; i++) {
        //     this.harmonics[i].detune.value = cents;
        // }
        this.oscillator.detune.value = cents;
    }

    setDelay(val) {
        if (val) {
            this.convolver.connect(this.delay);
        } else {
            this.convolver.disconnect(this.delay);
        }
    }

    getNotesWithPosition() {
        var minNote = 3*12; // ~C3
        var maxNote = 6*12 + 11; // ~B6

        for (var note in this.notesToFreq) {
            if (this.notesToFreq.hasOwnProperty(note)) {
                const pos = new THREE.Vector3();
                pos.x = this.width * (this.notesToFreq[note].step - minNote) / (maxNote - minNote) - this.width/2;

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
        var maxNote = 6*12 + 11; // ~B6

        var note = (val / this.width) * (maxNote - minNote) + minNote;
        if (note > maxNote || note < minNote) return 0;

        var freq = baseFreq * Math.pow(2, (note - baseOctave*12 - baseSteps) / 12);

        return freq;
    }

    _calculateGain(val) {
        var minG = 0;
        var maxG = 1;

        var gain = val * (maxG - minG) + minG;
         // console.log(gain);
        return gain;
    }
}







