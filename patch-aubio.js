const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'node_modules', 'aubiojs', 'build', 'aubio.js');

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
