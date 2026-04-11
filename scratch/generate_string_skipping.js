const fs = require('fs');

const file = 'g:/cw/sss/CwiczymyRazem/src/feature/exercisePlan/data/exerises/stringSkippingTwoNotes/stringSkippingTwoNotes.ts';
let content = fs.readFileSync(file, 'utf8');

const m1 = `    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 4, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 4, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 8 }] },
        { duration: 1, notes: [] },
      ],
    }`;

const m2 = `    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 4, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 4, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 5 }] },
        { duration: 1, notes: [] },
      ],
    }`;

const pauseM = `    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [] },
      ],
    }`;

let tabs = [];
for (let i = 0; i < 8; i++) {
  tabs.push(m1);
  tabs.push(m2);
}
tabs.push(pauseM);

const tabStart = content.indexOf('  tablature: [');
const prefix = content.substring(0, tabStart);

let newContent = prefix + '  tablature: [\n' + tabs.join(',\n') + '\n  ],\n};\n';

newContent = newContent.replace(/timeInMinutes:\s*[\d\.]+/, 'timeInMinutes: 1.36');

if (!newContent.includes('examBacking:')) {
  newContent = newContent.replace(
    /relatedSkills: (.*?),/,
    'relatedSkills: $1,\n  examBacking: { url: "/static/sounds/exercise/string_skipping___2_notes_per_string_backing_track.mp3", sourceBpm: 50 },'
  );
}

fs.writeFileSync(file, newContent);
console.log('Done');
