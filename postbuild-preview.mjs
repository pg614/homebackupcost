// Only for the temporary GitHub Pages preview: rewrite root paths to BASE and add noindex.
import fs from 'node:fs'; import path from 'node:path';
const BASE = process.env.PREVIEW_BASE; if (!BASE) process.exit(0);
const walk = d => fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
for (const f of walk('dist')) {
  if (f.endsWith('.html')) {
    let s = fs.readFileSync(f,'utf8');
    s = s.replace(/(href|src|action)=(["'])\/(?!\/)/g, `$1=$2${BASE}/`);
    s = s.replace(/(srcset=")([^"]*)"/g, (m,a,v)=>a+v.replace(/(^|, )\/(?!\/)/g, `$1${BASE}/`)+'"');
    s = s.replace('<head>', '<head><meta name="robots" content="noindex, nofollow">');
    fs.writeFileSync(f, s);
  } else if (f.endsWith('.js')) {
    fs.writeFileSync(f, fs.readFileSync(f,'utf8').replace(/href=(\\?["'])\/(?![\/h])/g, `href=$1${BASE}/`));
  } else if (f.endsWith('.css')) {
    fs.writeFileSync(f, fs.readFileSync(f,'utf8').replace(/url\((["']?)\/(?!\/)/g, `url($1${BASE}/`));
  }
}
fs.writeFileSync('dist/robots.txt', 'User-agent: *\nDisallow: /\n');
fs.writeFileSync('dist/.nojekyll', '');
console.log('preview postbuild done for', BASE);
