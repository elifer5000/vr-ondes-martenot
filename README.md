# VR Ondes Martenot

Inspired by the [ondes martenot](https://www.youtube.com/watch?v=v0aflcF0-ys) this is a WebXR based application that attempts to recreate the experience of playing one.

[Here's a video](https://www.youtube.com/watch?v=7IabQXipfS0)

[And here's a hosted demo](https://elifer5000.github.io/vr-ondes-martenot/dist/index.html)  ([emulated version](https://elifer5000.github.io/vr-ondes-martenot/dist/index.html?mode=emu))

![pic](screenshot.png)

## Compatibility
* Tested with Oculus Quest 2
## Installation
Clone repository and run

```
npm install
```
## SSL certificate (for debugging)
VR requires that you use a secure (https) server, meaning you are required to provide a local SSL certificate for debugging.
If you haven't done so before, install `mkcert`:
```
brew install mkcert
```
Create a local certificate authority:
```
mkcert -install
```
Finally, from the project's root, create the certificate, replacing with your ip at the end
```
mkdir .cert
mkcert -key-file="./.cert/key.pem" -cert-file="./.cert/cert.pem"  localhost 127.0.0.1 ::1 <your-ip>
```
## Usage
Run webpack dev server

```
npm run server
```

It should open a tab to https://<your-ip>:8080
### Controls
* Each control can be used as an independent instrument.
* Use the grip button to position the keys wherever you desire. It is recommended to put it on top of a real table, that way it can be used as a pivot point and better vibrato can be achieved.
* Use trigger for volume control. No sound is produced until the trigger is pressed.
* Use the A and X buttons to cycle through the different sounds (Sine, Trapezium, Violin, Square, Triangle, Sawtooth)
* Use the B and Y buttons to turn delay on/off.

## Emulation
You can test the app without VR by using an emulated mode:

```
http://localhost:8080/?mode=emu
```

This creates two virtual controllers you can move around in the scene to simulate the actual controllers. You can then use these controls:
* Press 1 and 2 to change to move/rotate respectively.
* Press 5 to cycle through the sounds.
* Press 6 to turn delay on/off
* Press spacebar for grip (i.e. position the keys under the control)
