const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const ejs = require('ejs');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const PUBLIC = path.join(ROOT, 'public');

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true });
}

async function writeFile(filepath, content) {
  await ensureDir(path.dirname(filepath));
  await fsp.writeFile(filepath, content, 'utf8');
  console.log('WROTE', filepath);
}

async function copyPublic() {
  if (!fs.existsSync(PUBLIC)) return;
  async function copy(src, dest) {
    const stat = await fsp.stat(src);
    if (stat.isDirectory()) {
      await ensureDir(dest);
      const items = await fsp.readdir(src);
      for (const it of items) await copy(path.join(src, it), path.join(dest, it));
    } else {
      await ensureDir(path.dirname(dest));
      await fsp.copyFile(src, dest);
      console.log('COPIED', dest);
    }
  }
  await copy(PUBLIC, path.join(DIST));
}

async function loadData(dataRef) {
  if (!dataRef) return {};
  if (typeof dataRef === 'string') {
    const p = path.join(ROOT, dataRef);
    if (!fs.existsSync(p)) return {};
    const txt = await fsp.readFile(p, 'utf8');
    return JSON.parse(txt);
  } else if (typeof dataRef === 'object') {
    return dataRef;
  } else {
    return {};
  }
}

async function build() {
  if (fs.existsSync(DIST)) {
    await fsp.rm(DIST, { recursive: true, force: true });
  }
  await ensureDir(DIST);

  const pagesPath = path.join(ROOT, 'pages.json');
  const pages = JSON.parse(await fsp.readFile(pagesPath, 'utf8'));

  for (const page of pages) {
    const tplPath = path.join(ROOT, page.template);
    const data = await loadData(page.data);
    const html = await ejs.renderFile(tplPath, data, { async: true });

    let out = page.out || '/';
    if (!out.startsWith('/')) out = '/' + out;
    if (out === '/') {
      await writeFile(path.join(DIST, 'index.html'), html);
    } else {
      const folder = path.join(DIST, out);
      await ensureDir(folder);
      await writeFile(path.join(folder, 'index.html'), html);
    }
  }

  await copyPublic();
  console.log('BUILD COMPLETE ✅');
}

build().catch(console.error);
