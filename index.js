// # Setup
// `synths` is a map of indices to synth objects
// `freqs` is a map of indices to frequencies for semitones on a piano
// `indices` is a list of available indices
// THe code below builds populates a map of synths - one for every key in a piano
var synths = {};
var freqs = {};
var indices = [];
var lastFreq = 27.5;
const semiRatio = 1.05946309436;
for (i = 0; i < 88; i++) {
    indices.push(i);
    freqs[i] = lastFreq
    synths[i] = new Tone.Synth().toDestination();
    lastFreq = semiRatio * lastFreq;
};

// # Interface to the synths
// We shouldn't have to care about the underlying implementation of how to play a note.
// Instead, we should only care about "how do you play a note" and "how do you stop a note".
// We can define functions that will play a note at an index, and will stop a note at an index.
// The functions below will play and stop a note at index i, so we shouldn't have to manually touch `synths` or `freqs` anymore.

function playNote(i) { synths[i].triggerAttack(freqs[i]) };
function stopNote(i) { synths[i].triggerRelease() };

// and convenience functions
function playNotes(xs) { xs.forEach((i) => playNote(i)) };
function stopNotes(xs) { xs.forEach((i) => stopNote(i)) };
function stopAll() {indices.forEach((i) => stopNote(i))};

// # Chord definitions
// We can define the chords relative to the root of the chord here.
// These are deliberately spaced out.
const maj = [0, 7, 12, 16]
const min = [0, 7, 12, 15]
const maj7 = [0, 7, 11, 16]
const dom7 = [0, 7, 10, 16]
const min7 = [0, 7, 10, 15]
const aug7 = [0, 8, 12, 16]
const dim7 = [0, 6, 9, 15]

// # Key interface
// The interface should allow:
// 1. Left hand: specify the root (bvgftr4e3w2q1), inversion down (LShift), inversion up (caps lock) and quality (maj by default, maj7, min, min7, dim, aug)
// 2. Right hand: bare notes (possibly more than one) (nmjki9o0p-[=]\) and lower (RSHift) and upper ocatve (Enter)
// 3. Key modifier up (u) or down (y) by a semitone
//
// In this design, there are:
// 1. Note roots which MUST be specified to play
// 2. Inversion, quality, and octave modifiers which may or may not be specified (but should alter as soon as they are)
// 3. Global modifications on the configuration such as the key.
//
// To implement this, it's easiest to use the document's onkeydown and onkeyup events.
// There's a hardware limitation to think of which is the fact that the some key combinations
// cannot be played at the same time. One way around this is instead of playing things "during" the
// time in which they are pressed, play them (with modifiers coming beforehand) until the next
// keypress.
//
// So the idea is that you hold down the modifiers you want, then the real left hand key you want,
// and then it'll change the note.
//
// We can imagine this as responding to a key change:
// 1. If it's a playable, stop the previous playable and start the new one with the attached modifiers (which means we need to track the previous playable)
// 2. If it's a modifier, add it to the modifiers list
// 3. If it's a global, apply it to the global configuration
// 4. If it's a clear event, clear the labelled hand.

// This variable declares the effects of each keyboard key.
const keyMap = {
    // note definitions, relative to the root, in the left hand
    "KeyB": {type: "playable", hand: "left", offset: 0},
    "KeyV": {type: "playable", hand: "left", offset: 1},
    "KeyG": {type: "playable", hand: "left", offset: 2},
    "KeyF": {type: "playable", hand: "left", offset: 3},
    "KeyT": {type: "playable", hand: "left", offset: 4},
    "KeyR": {type: "playable", hand: "left", offset: 5},
    "Digit4": {type: "playable", hand: "left", offset: 6},
    "KeyE": {type: "playable", hand: "left", offset: 7},
    "Digit3": {type: "playable", hand: "left", offset: 8},
    "KeyW": {type: "playable", hand: "left", offset: 9},
    "Digit2": {type: "playable", hand: "left", offset: 10},
    "KeyQ": {type: "playable", hand: "left", offset: 11},
    "Digit1": {type: "playable", hand: "left", offset: 12},

    // note definitions, relative to the root, in the right hand
    "Slash": {type: "playable", hand: "right", offset: -7},
    "Semicolon": {type: "playable", hand: "right", offset: -6},
    "Period": {type: "playable", hand: "right", offset: -5},
    "KeyL": {type: "playable", hand: "right", offset: -4},
    "Comma": {type: "playable", hand: "right", offset: -3},
    "KeyK": {type: "playable", hand: "right", offset: -2},
    "KeyM": {type: "playable", hand: "right", offset: -1},
    "KeyN": {type: "playable", hand: "right", offset: 0},
    "KeyH": {type: "playable", hand: "right", offset: 1},
    "KeyJ": {type: "playable", hand: "right", offset: 2},
    "KeyU": {type: "playable", hand: "right", offset: 3},
    "KeyI": {type: "playable", hand: "right", offset: 4},
    "KeyO": {type: "playable", hand: "right", offset: 5},
    "Digit0": {type: "playable", hand: "right", offset: 6},
    "KeyP": {type: "playable", hand: "right", offset: 7},
    "Minus": {type: "playable", hand: "right", offset: 8},
    "BracketLeft": {type: "playable", hand: "right", offset: 9},
    "Equal": {type: "playable", hand: "right", offset: 10},
    "BracketRight": {type: "playable", hand: "right", offset: 11},
    "Backslash": {type: "playable", hand: "right", offset: 12},

    // modifier definitions, in the left hand
    "ShiftLeft": {type: "modifier", hand: "left", property: "inversion", value: "down"},
    "CapsLock": {type: "modifier", hand: "left", property: "inversion", value: "up"},
    "KeyA": {type: "modifier", hand: "left", property: "quality", value: "maj7"},
    "KeyZ": {type: "modifier", hand: "left", property: "quality", value: "dom7"},
    "KeyS": {type: "modifier", hand: "left", property: "quality", value: "min"},
    "KeyX": {type: "modifier", hand: "left", property: "quality", value: "min7"},
    "KeyD": {type: "modifier", hand: "left", property: "quality", value: "aug"},
    "KeyC": {type: "modifier", hand: "left", property: "quality", value: "dim"},

    // modifier definitions, in the right hand
    "ShiftRight": {type: "modifier", hand: "right", property: "octave", value: "down"},
    "Enter": {type: "modifier", hand: "right", property: "octave", value: "up"},

    // global modifiers, applied immediately to the config (but not necessarily to the currently playing sound)
    "Digit6": {type: "global", property: "offset", effect: "down"},
    "Digit7": {type: "global", property: "offset", effect: "up"},

    // clear sound
    "AltLeft": {type: "clear", hand: "left"},
    "AltRight": {type: "clear", hand: "right"},
    "Space": {type: "clear", hand: "both"},
}

// # Implementation
// In order to respond to onKeyDown events properly, we need to keep track of state.
// The state must contain:
// 1. The previous played chord in the left hand (probably best stored as an array of note indices to stop playing)
// 2. The previous played notes in the right hand (again, best stored as an array of note indices)
// 3. The current list of active modifiers
// 4. Any global modifiers e.g. the current key
var state = {
    previousLeft: [],
    previousRight: null,
    leftModifiers: {inversion: null, quality: null},
    rightModifiers: {octave: null},
    offset: 15, // set the initial offset to a reasonable C
};

// utility functions for chord editing
function addOffset(xs, offset) {return xs.map((x) => {return x + offset})};
 // assuming four notes per chord
function invertUp(xs) { return [xs[0]+12, xs[1], xs[2], xs[3]-12]};
function invertDown(xs) { return [xs[0], xs[1]-12, xs[2], xs[3]-12]};

// calculate notes for the left hand based on state and a keyEffect
// this function does not mutate any of the global state, only accesses it
function calculateLeft(keyEffect) {
    var offset = keyEffect.offset + state.offset;
    var notes;
    switch (state.leftModifiers.quality) {
        case "maj7": notes = maj7; break;
        case "dom7": notes = dom7; break;
        case "min": notes = min; break;
        case "min7": notes = min7; break;
        case "aug": notes = aug7; break;
        case "dim": notes = dim7; break;
        default: notes = maj; break; // null
    };
    switch (state.leftModifiers.inversion) {
        case "down": notes = invertDown(notes); break;
        case "up": notes = invertUp(notes); break;
        default: break; // null
    };
    return addOffset(notes, offset);
};

// calculate notes for the right hand based on state and keyEffect
// this function does not mutate any of the global state, only accesses it
// note that in this model, only one note in the right hand can be played at one time
function calculateRight(keyEffect) {
    // right hand is initially two octaves higher
    var rightOffset = 24;
    var offset = keyEffect.offset + state.offset + rightOffset;
    switch (state.rightModifiers.octave) {
        case "down": offset -= 12; break;
        case "up": offset += 12; break;
        default: break; // null
    };
    return offset;
}

// A function which will handle a playable event by mutating the global `state` variable.
// This function mutates and performs effects!
function handlePlayable(keyEffect) {
    // stop the previous playables and determine the set of notes to play based on modifiers
    switch (keyEffect.hand) {
        case "left":
            // stop previous notes
            stopNotes(state.previousLeft);
            // calculate new notes
            var newNotes = calculateLeft(keyEffect);
            // play the new notes
            playNotes(newNotes)
            // store in state
            state.previousLeft = newNotes;
            break;
        case "right":
            // stop previous note (handle null)
            if (state.previousRight) {stopNote(state.previousRight)};
            // calculate new note
            var newNote = calculateRight(keyEffect);
            // play the new note
            playNote(newNote);
            // store in state
            state.previousRight = newNote;
            break;
    };
};

// A function which will handle a modifier event by mutating the global `state` variable.
// This function mutates and performs effects!
function handleModifier(keyEffect) {
    switch (keyEffect.hand) {
        case "left":
            state.leftModifiers[keyEffect.property] = keyEffect.value;
            break;
        case "right":
            state.rightModifiers[keyEffect.property] = keyEffect.value;
            break;
    };
};

// A function undo a modifier
// This will be useful so that holding down a modifier makes it active as long as the key is down
function unsetModifier(keyEffect) {
    switch (keyEffect.hand) {
        case "left":
            state.leftModifiers[keyEffect.property] = null;
            break;
        case "right":
            state.rightModifiers[keyEffect.property] = null;
            break;
    };
};

// A function which will handle a global event by mutating the global `state` variable.
// This function mutates and performs effects!
function handleGlobal(keyEffect) {
    switch (keyEffect.property) {
        case "offset":
            switch (keyEffect.effect) {
                case "down":
                    state.offset -= 1;
                    break;
                case "up":
                    state.offset += 1;
                    break;
            };
    };
};


// A function which will handle a global event by mutating the global `state` variable.
// This function mutates and performs effects!
function handleClear(keyEffect) {
    switch (keyEffect.hand) {
        case "left":
            stopNotes(state.previousLeft);
            state.previousLeft = [];
            break;
        case "right":
            if (state.previousRight) {stopNote(state.previousRight)};
            state.previousRight = null;
            break;
        case "both":
            stopNotes(state.previousLeft);
            state.previousLeft = [];
            if (state.previousRight) {stopNote(state.previousRight)};
            state.previousRight = null;
            break;
    };
};


// Now a function which takes the key event code on key down and performs the effect
function onKeyDown(e) {
    // get the key if it exists in the map, or return from the function
    const keyEffect = keyMap[e.code];
    if (keyEffect == undefined) { return; };
    e.preventDefault();
    // otherwise switch on the effect type to do what is required
    switch (keyEffect.type) {
        case "playable":
            handlePlayable(keyEffect);
            break;
        case "modifier":
            handleModifier(keyEffect);
            break;
        case "global":
            handleGlobal(keyEffect);
            break;
        case "clear":
            handleClear(keyEffect);
            break;
    };
}

// And a function which will clear a modifier on key up
function onKeyUp(e) {
    const keyEffect = keyMap[e.code];
    if (keyEffect == undefined) { return; };
    e.preventDefault();
    // otherwise switch on the effect type to do what is required
    switch (keyEffect.type) {
        case "modifier":
            unsetModifier(keyEffect);
            break;
        default:
            break;
    };
};

// we only care about onkeydown events in the delayed model
window.addEventListener("keydown", ((e) => onKeyDown(e)));
window.addEventListener("keyup", ((e) => onKeyUp(e)));
