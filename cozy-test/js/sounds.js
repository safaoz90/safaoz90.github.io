// Which recorded sound plays for what (files in assets/sounds), chosen on the sound picker page.
// Effects: Kenney "Interface Sounds" (CC0). Backgrounds and music: Pixabay (Pixabay Content License):
//   winter "Fireplace Fire Crackling Loop" by SoundsForYou · spring "Forest ambience, morning spring" by AudioPapkin
//   summer "Ocean Sea Soft Waves" by SoundsForYou · fall "Calming Rain Loop" by DRAGON-STUDIO
//   halloween "Spooky Wind" by freesound_community · music "Piano Relaxing" by AtlasAudio
(function (root) {
  const CJ = (root.CJ = root.CJ || {});
  const S = 'assets/sounds/';
  CJ.SOUNDS = {
    pick: [S + 'pick.m4a'],
    snap: [S + 'snap.m4a'],
    nope: [S + 'nope.m4a'],
    done: [S + 'done.m4a'],
    volume: { pick: 0.5, snap: 0.9, nope: 0.6, done: 0.8 },
    music: S + 'music.m4a', // calm piano, very quiet, over every season's background
    ambience: { winter: S + 'amb-winter.m4a', spring: S + 'amb-spring.m4a', summer: S + 'amb-summer.m4a', fall: S + 'amb-fall.m4a', halloween: S + 'amb-halloween.m4a' },
  };
})(typeof window !== 'undefined' ? window : globalThis);
