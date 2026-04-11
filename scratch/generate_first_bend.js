const fs = require('fs');

const file = 'g:/cw/sss/CwiczymyRazem/src/feature/exercisePlan/data/exerises/firstBend/firstBend.ts';

// Get original content up to `tablature: [`
let content = fs.readFileSync(file, 'utf8');

const stringG = `    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 3, fret: 9 }] },
        { duration: 2, notes: [{ string: 3, fret: 7, isBend: true, bendSemitones: 2 }] },
      ],
    }`;

const stringB = `    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 2, fret: 10 }] },
        { duration: 2, notes: [{ string: 2, fret: 8, isBend: true, bendSemitones: 2 }] },
      ],
    }`;

const stringPause = `    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [] },
      ],
    }`;

let tabs = [];
for (let i = 0; i < 5; i++) {
  tabs.push(stringG);
  tabs.push(stringG);
  tabs.push(stringB);
  tabs.push(stringB);
}
tabs.push(stringG);
tabs.push(stringPause);

const tabStart = content.indexOf('  tablature: [');
const prefix = content.substring(0, tabStart);

const newContent = prefix + '  tablature: [\n' + tabs.join(',\n') + '\n  ],\n};\n';

fs.writeFileSync(file, newContent);
console.log('Done');
