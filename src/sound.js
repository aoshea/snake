/**
 * Generated sound manager 
 */

// note frequencies 
var frequencies = {
  'a' : 440.00,
  'b' : 493.88,
  'c' : 523.25,
  'd' : 587.33,
  'e' : 659.25,
  'f' : 698.46,
  'g' : 783.99
};

// flag to allow sounds to play 
var contextReady = false;

// enable webAudio on iOS after first touch 
function enableiOS( context ) {
  
  function activateSound() {
    
    var source;
    // create empty buffer to trigger sound playback 
    source = context.createBufferSource();
    source.buffer = context.createBuffer( 1, 1, 22050 );
    source.connect( context.destination );
    source.start(0);
    
    window.removeEventListener( 'touchstart', activateSound, false );
    
    // audio context is unlocked, flag it up 
    contextReady = true;
  }
  
  window.addEventListener( 'touchstart', activateSound, false );
}

// create audio context 
var context = (function () {

  var context, AudioContext = window.AudioContext || window.webkitAudioContext;

  if ( AudioContext ) {
  
    context = new AudioContext();
  
    // enable iOS sound
    enableiOS( context );
  } 
  
  return context;    
})();

// Voltage controller oscillator
var VCO = (function ( context ) {
  
  function VCO( frequency ) {
  
    var osc;
  
    osc = context.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = frequency || 440;
    osc.detune.value = Math.pow(2, 1/12) * Math.random(); // Offset sound by 10 semitones
    osc.start(0);
  
    this.osc = osc;
    this.output = osc;
  
  }

  VCO.prototype.setFrequency = function ( frequency ) {
    this.osc.frequency.value = frequency;
  };

  VCO.prototype.connect = function ( node ) {
    this.output.connect( node );
  };

  return VCO;

})( context );

// Voltage controller amplifier
var VCA = (function ( context ) {

  function VCA() {
  
    var node;
  
    node = context.createGain();
    node.gain.value = 0.0;
  
    this.node = node;
    this.gain = node.gain;
  }

  VCA.prototype.connect = function ( node ) {
    this.node.connect( node );
  };

  return VCA;

})( context );

// Envelope generator 
var Envelope = (function ( context ) {

  function Envelope( attack, release ) {
  
    this.attack = attack;
    this.release = release;  
  }
  
  Envelope.prototype.trigger = function () {
      
    if ( !this.param ) {
      throw new Error( 'Attempt to trigger gate with no node connected' );
    }
    
    var now = context.currentTime;    
    
    this.param.cancelScheduledValues(now);
    this.param.setValueAtTime(0, now);
    this.param.linearRampToValueAtTime(1, now + this.attack);
    this.param.linearRampToValueAtTime(0, now + this.attack + this.release);    
  };
  
  Envelope.prototype.connect = function ( param ) {
    
    this.param = param;    
  };

  return Envelope;

})( context );

var SoundManager = (function () {
  
  var vcoA, vcoB, vcoC, vca, envelope;
  
  function play () {
    envelope.trigger();
  }
  
  function setup () {

    vcoA = new VCO( frequencies['a'] );
    vcoB = new VCO( frequencies['c'] );
    vcoC = new VCO( frequencies['e'] );
    vca = new VCA;
    envelope = new Envelope( 0.1, 1.0 );
    
    // wire them up! 
    vcoA.connect( vca.node );
    vcoB.connect( vca.node );
    vcoC.connect( vca.node );
    envelope.connect( vca.gain );
    vca.connect( context.destination );
    
  }
  
  setup();
  
  return {
    playPickup: play,
    playVanish: play,
    playStart: play
  };
  
})();


module.exports = SoundManager;
 
