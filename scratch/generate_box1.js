const fs = require('fs');

const file = 'g:/cw/sss/CwiczymyRazem/src/feature/exercisePlan/data/exerises/pentatonicBox1UpDown/pentatonicBox1UpDown.ts';

let content = fs.readFileSync(file, 'utf8');

const bar1 = `    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 6, fret: 8, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 5, fret: 7, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 4, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 4, fret: 7, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 3, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 3, fret: 7, isAccented: true }] },
      ],
    }`;

const bar2 = `    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 2, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 2, fret: 8, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 1, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 1, fret: 8, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 1, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 2, fret: 8, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 2, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 3, fret: 7, isAccented: true }] },
      ],
    }`;

const bar3 = `    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 3, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 4, fret: 7, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 4, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 5, fret: 7, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 6, fret: 8, isAccented: true }] },
        { duration: 1,   notes: [{ string: 6, fret: 5, isAccented: true }] },
      ],
    }`;

const barPause = `    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [] },
      ],
    }`;

let tabs = [];
for (let i = 0; i < 5; i++) {
  tabs.push(bar1);
  tabs.push(bar2);
  tabs.push(bar3);
}
// 15 measures so far
tabs.push(bar1); // M16
tabs.push(bar2); // M17
tabs.push(barPause); // M18

const tabStart = content.indexOf('  tablature: [');
const prefix = content.substring(0, tabStart);

let newContent = prefix + '  tablature: [\n' + tabs.join(',\n') + '\n  ],\n};\n';
newContent = newContent.replace(/timeInMinutes:\s*5,/, 'timeInMinutes: 1.03,');

// add examBacking if missing
if (!newContent.includes('examBacking:')) {
  newContent = newContent.replace(/relatedSkills: (.*?),/, 'relatedSkills: $1,\n  examBacking: { url: "/static/sounds/exercise/pentatonic_box_1___up_and_down_backing_track.mp3", sourceBpm: 70 },');
}

fs.writeFileSync(file, newContent);
console.log('Done');
