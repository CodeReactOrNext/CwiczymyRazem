const fs = require('fs');
const path = require('path');

const filesToPatch = [
  path.join(__dirname, 'node_modules', 'aubiojs', 'build', 'aubio.js'),
];

filesToPatch.forEach(filePath => {
  try {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('require("fs")')) {
        content = content.replace(/require\("fs"\)/g, '{}');
        content = content.replace(/require\("path"\)/g, '{}');
        fs.writeFileSync(filePath, content, 'utf8');
      }
    }
  } catch (error) {}
});
