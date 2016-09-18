function BufferLoader(context, urlList, callback) {
  this.context = context;
  this.urlList = urlList;
  this.onload = callback;
  this.bufferList = new Array();
  this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
  // Load buffer asynchronously
  var request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.responseType = "arraybuffer";

  var loader = this;

  request.onload = function() {
    // Asynchronously decode the audio file data in request.response
    loader.context.decodeAudioData(
      request.response,
      function(buffer) {
        if (!buffer) {
          alert('error decoding file data: ' + url);
          return;
        }
        loader.bufferList[index] = buffer;
        if (++loader.loadCount == loader.urlList.length)
          loader.onload(loader.bufferList);
      },
      function(error) {
        console.error('decodeAudioData error', error);
      }
    );
  }

  request.onerror = function() {
    alert('BufferLoader: XHR error');
  }

  request.send();
}

BufferLoader.prototype.load = function() {
  for (var i = 0; i < this.urlList.length; ++i)
  this.loadBuffer(this.urlList[i], i);
}

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

function calculateFrequency(position, range) {
    var baseFreq = 440; // A4
    var baseSteps = 9; // A
    var baseOctave = 4;

    var minNote = 3*12; // ~C3
    var maxNote = 5*12 + 11; // ~B5

    var note = (position / range) * (maxNote - minNote) + minNote;
    if (note > maxNote || note < minNote) return 0;

    var freq = baseFreq * Math.pow(2, (note - baseOctave*12 - baseSteps) / 12);

    return freq;
}

function calculateGain(position, range) {
    // console.log(position, height);
    var minHeight = 1.1;
    if (position < minHeight) return 0;

    var minG = 0;
    var maxG = 1;
    position -= minHeight;

    var gain = (position / range) * (maxG - minG) + minG;
    // console.log(gain);
    return gain;
}

export default class AudioController {
    constructor(width, height) {
        this.width = width;
        this.height = height;

        this.notesToFreq = mapNotesToFrequency();
        this.context = new AudioContext();
        this.oscillator = this.context.createOscillator();
        this.oscillator.type = 'sine'; //sine, triangle or square

        this.LFO = this.context.createOscillator();
        this.LFO.type = 'sine';
        this.LFO.frequency.value = 1;

        this.LFOGainNode = this.context.createGain();
        this.LFOGainNode.gain.value = 0.7;

        this.convolver = this.context.createConvolver();
        
        this.gainNode = this.context.createGain();
        this.gainNode.gain.node = 0;

        this.volNode = this.context.createGain();
        this.volNode.gain.value = 1.0;

        this.initBufferLoader();

        this.LFOGainNode.connect(this.oscillator.frequency); // FM
        this.LFO.connect(this.LFOGainNode);

        this.gainNode.connect(this.volNode);
        this.volNode.connect(this.convolver);
        this.convolver.connect(this.context.destination);
        this.oscillator.connect(this.gainNode);

        this.LFO.start();
        this.oscillator.start();

    }

    // _startSound(posX, posY) {
    //     // this.LFO.start(0);
    //     // oscillator.type = 'square';
    //     // gainNode = context.createGain();
    //     // oscillator.connect(context.destination);
    //     // this.oscillator.connect(this.gainNode);
    //     // this.gainNode.connect(this.context.destination);
    //     // this.oscillator.start(this.context.currentTime);

    //     if (posX) {
    //         this.oscillator.frequency.setTargetAtTime(calculateFrequency(posX, this.width), this.context.currentTime, 0.01);
    //         this.gainNode.gain.setTargetAtTime(calculateGain(posY, this.height), this.context.currentTime, 0.01);
    //     }
    // };

    // _stopSound() {
    //     // this.oscillator.stop(this.context.currentTime);
    //     // this.oscillator.disconnect();
    //     // this.LFO.stop(0);
    // };

    // onStart(posX, posY) {
    //     if (this.oscillator) {
    //         this._stopSound();
    //     }

    //     this._startSound(posX, posY);
    // }

    // onStop() {
    //     if (this.oscillator) {
    //         this._stopSound();
    //     }
    // }


    initBufferLoader(){
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

    onChange(posX, posY) {
        if (this.oscillator) {
            this.oscillator.frequency.value = calculateFrequency(posX, this.width);
            this.gainNode.gain.value = calculateGain(posY, this.height);
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







