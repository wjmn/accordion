// # Samples
// Piano samples obtained from https://github.com/nbrosowsky/tonejs-instruments
// (CC BY 3.0) https://creativecommons.org/licenses/by/3.0/
var names = ["C0","C#0","D0","D#0","E0","F0","F#0","G0","G#0","A0","A#0","B0",
             "C1","C#1","D1","D#1","E1","F1","F#1","G1","G#1","A1","A#1","B1",
             "C2","C#2","D2","D#2","E2","F2","F#2","G2","G#2","A2","A#2","B2",
             "C3","C#3","D3","D#3","E3","F3","F#3","G3","G#3","A3","A#3","B3",
             "C4","C#4","D4","D#4","E4","F4","F#4","G4","G#4","A4","A#4","B4",
             "C5","C#5","D5","D#5","E5","F5","F#5","G5","G#5","A5","A#5","B5",
             "C6","C#6","D6","D#6","E6","F6","F#6","G6","G#6","A6","A#6","B6",
             "C7"]

// Setup
// `synths` is a map of indices to synth objects
// `freqs` is a map of indices to frequencies for semitones on a piano
// `indices` is a list of available indices
// The code below builds populates a map of synths - one for every key in a piano
var synths = {};
var freqs = {};
var indices = [];
for (var i = 0; i < 85; i++) {
    // internal integer index, with each item rising by one semitone
    indices.push(i);
    // get name of note at index
    name = names[i]
    // put into map from index to name
    freqs[i] = names[i];
    // get url of sample from name
    var urls = {};
    urls[name] = name.replace("#", "s") + ".ogg";
    // make new sampler
    const sampler = new Tone.Sampler({
        urls: urls,
        volume: -10,
        baseUrl: "./samples/",
        curve: "exponential",
        release: 0.5,
    });
    // add sampler to synth object
    synths[i] = sampler.toDestination();
};

// # Interface to the synths
// We shouldn't have to care about the underlying implementation of how to play a note.
// Instead, we should only care about "how do you play a note" and "how do you stop a note".
// We can define functions that will play a note at an index, and will stop a note at an index.
// The functions below will play and stop a note at index i, so we shouldn't have to manually touch `synths` or `freqs` anymore.

function playNote(i) { synths[i].triggerAttackRelease(freqs[i]) };
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
// 1. Left hand: specify the root, inversion down (LShift), inversion up (caps lock) and quality (maj by default, maj7, min, min7, dim, aug)
// 2. Right hand: bare notes and lower (RSHift) and upper ocatve (Enter)
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
    "KeyB": {type: "playable", hand: "left", offset: -5},
    "KeyV": {type: "playable", hand: "left", offset: -4},
    "KeyG": {type: "playable", hand: "left", offset: -3},
    "KeyF": {type: "playable", hand: "left", offset: -2},
    "KeyT": {type: "playable", hand: "left", offset: -1},
    "KeyR": {type: "playable", hand: "left", offset: 0},
    "Digit4": {type: "playable", hand: "left", offset: 1},
    "KeyE": {type: "playable", hand: "left", offset: 2},
    "Digit3": {type: "playable", hand: "left", offset: 3},
    "KeyW": {type: "playable", hand: "left", offset: 4},
    "KeyQ": {type: "playable", hand: "left", offset: 5},
    "Digit1": {type: "playable", hand: "left", offset: 6},
    "Tab": {type: "playable", hand: "left", offset: 7},

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
    "Backquote": {type: "modifier", hand: "left", property: "inversion", value: "up"},
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
    offset: 24, // set the initial offset to a reasonable C
};

// utility functions for chord editing
function addOffset(xs, offset) {return xs.map((x) => {return x + offset})};
 // assuming four notes per chord
function invertUp(xs) { return [xs[0]+12, xs[1]+12, xs[2], xs[3]]};
function invertDown(xs) { return [xs[0], xs[1], xs[2]-12, xs[3]-12]};

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

// function to print to the html page the left hands movements
function printEffect(hand, keyEffect) {
    var element = document.getElementById(hand);
    if (hand == "left") {
        var inversionString = state.leftModifiers.inversion ? state.leftModifiers.inversion : "";
        var qualityString = state.leftModifiers.quality ? state.leftModifiers.quality : "maj"
        element.innerHTML = keyEffect.offset.toString().concat(qualityString, " ", inversionString);
    } else {
        var octaveString = state.rightModifiers.octave ? state.rightModifiers.octave : "";
        element.innerHTML = keyEffect.offset.toString().concat(" ", octaveString);
    };
};

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
            // print in html window
            printEffect("left", keyEffect);
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
            // print in html window
            printEffect("right", keyEffect);
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
