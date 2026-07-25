const fs = require('fs');
const path = require('path');
const dirs = ['pages/public', 'pages/admin', 'pages/student', 'components/student', 'components/admin', 'components/common'];

dirs.forEach(d => {
  const dp = path.join('d:/PROJECTS/ankurah-exams/frontend/src', d);
  if (fs.existsSync(dp)) {
    fs.readdirSync(dp).forEach(f => {
      if (f.endsWith('.tsx')) {
        const fp = path.join(dp, f);
        let c = fs.readFileSync(fp, 'utf8');
        c = c.replace(/from '\.\.\/types'/g, "from '../../types'");
        c = c.replace(/from '\.\.\/lib\/api'/g, "from '../../lib/api'");
        c = c.replace(/from '\.\.\/assets\//g, "from '../../assets/");
        fs.writeFileSync(fp, c);
      }
    });
  }
});
console.log("Imports updated successfully!");
