const fs = require('fs');
let code = fs.readFileSync('src/KawaiiHabit.jsx', 'utf8');
code = code.replace(/\\`/g, '`');
fs.writeFileSync('src/KawaiiHabit.jsx', code);
