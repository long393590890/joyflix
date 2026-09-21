const fs = require('fs');

const config = JSON.parse(fs.readFileSync('D:/project/joyflix/config.json', 'utf8'));
const news = JSON.parse(fs.readFileSync('D:/project/joyflix/.workbuddy/tmp/new_sources.json', 'utf8'));

// config.json api_site: url -> key(s)
const existingUrls = new Map();
for (const [k, v] of Object.entries(config.api_site)) {
  if (!existingUrls.has(v.api)) existingUrls.set(v.api, []);
  existingUrls.get(v.api).push(k);
}

const norm = (u) => u.replace(/^http:\/\//i, 'https://').replace(/\/+$/, '');
// protocol-insensitive normalized map, for "near duplicate" annotation only
const normMap = new Map();
for (const [url, keys] of existingUrls) {
  const n = norm(url);
  if (!normMap.has(n)) normMap.set(n, []);
  normMap.get(n).push(...keys.map((k) => `${k}(${url})`));
}

const seenInList = new Map(); // api -> first key in pasted list
const existing = [];
const fresh = [];

news.forEach((item, idx) => {
  const keys = existingUrls.get(item.api);
  const dupOf = seenInList.has(item.api) ? seenInList.get(item.api) : null;
  if (!dupOf) seenInList.set(item.api, item.key);

  const row = {
    idx: idx + 1,
    key: item.key,
    name: item.name,
    api: item.api,
    from: item.from,
    dupOf,
  };

  if (keys) {
    row.configKey = keys.join('/');
    existing.push(row);
  } else {
    // annotate near-duplicates (protocol-only or trailing-slash differences)
    const n = norm(item.api);
    const near = normMap.get(n);
    if (near) row.note = `近似已有: ${near.join(', ')}`;
    fresh.push(row);
  }
});

// unique fresh URLs (dedupe inside the pasted list itself)
const freshUnique = [];
const freshSeen = new Set();
for (const f of fresh) {
  if (freshSeen.has(f.api)) continue;
  freshSeen.add(f.api);
  const alsoInList = fresh.filter((x) => x.api === f.api).map((x) => x.key);
  freshUnique.push({ ...f, keysInList: alsoInList });
}

console.log('===== 已有（地址完全一致） =====');
existing.forEach((r) =>
  console.log(
    `${String(r.idx).padStart(2)}. [${r.key}] ${r.name}  ->  config.${r.configKey}` +
      (r.dupOf ? `   (列表内部重复: 同 ${r.dupOf})` : '')
  )
);
console.log(`\n已有总数: ${existing.length} 条`);

console.log('\n===== 新增（config.json 中无完全一致的地址） =====');
fresh.forEach((r) =>
  console.log(
    `${String(r.idx).padStart(2)}. [${r.key}] ${r.name}  ${r.api}` +
      (r.dupOf ? `   (列表内部重复: 同 ${r.dupOf})` : '') +
      (r.note ? `   <<${r.note}>>` : '')
  )
);
console.log(`\n新增总数: ${fresh.length} 条`);

console.log('\n===== 新增去重后的唯一地址 =====');
freshUnique.forEach((r, i) =>
  console.log(`${String(i + 1).padStart(2)}. ${r.name}  ${r.api}` + (r.keysInList.length > 1 ? `   (列表中出现 ${r.keysInList.length} 次: ${r.keysInList.join(', ')})` : ''))
);
console.log(`\n唯一新增地址数: ${freshUnique.length}`);

console.log(`\n汇总: 列表共 ${news.length} 条 | 已有 ${existing.length} | 新增 ${fresh.length} (去重后 ${freshUnique.length})`);
