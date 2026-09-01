// content/generated.js と public/images/monster/ を作る。
// 取得元はゲームの公開API・配信中のスクリプト・公開画像。
//
// 使い方: node tools/generate-data.mjs [ゲームのベースURL]

import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const base = (process.argv[2] ?? "https://almaz.in.net/nika").replace(/\/$/, "");

const fetchText = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
    return res.text();
};

const master = JSON.parse(await fetchText(`${base}/api/master/get`));

// 名前 → 画像ファイル名。ゲームのフロントが配信しているスクリプトに `名前:fn("123.gif")` の形で入っている。
// ダメージ差分の対応表が後ろに続くため、同じ名前は先に出たものを採用する。
const collectImageMap = async () => {
    const html = await fetchText(`${base}/`);
    const entry = html.match(/src="([^"]*\/assets\/index-[^"]*\.js)"/)?.[1];
    if (!entry) throw new Error("フロントのエントリJSが見つからない");
    const bundle = await fetchText(new URL(entry, `${base}/`).href);

    const map = new Map();
    for (const m of bundle.matchAll(/"?([^\s{},:"()]+)"?\s*:\s*[A-Za-z_$][\w$]*\("(\d+\.gif)"\)/g)) {
        if (!map.has(m[1])) map.set(m[1], m[2]);
    }
    if (map.size === 0) throw new Error("画像の対応表が取れなかった（配信物の形が変わった可能性）");
    return map;
};

const images = await collectImageMap();

const monsters = [];
const missing = [];
for (const monster of master.monsterList) {
    const img = images.get(monster.name);
    if (!img) {
        missing.push(monster.name);
        continue;
    }
    monsters.push([monster.name, { img, element: monster.element, kibo: monster.kiboName, specialties: monster.specialtyNameList }]);
}

const byName = (a, b) => a[0].localeCompare(b[0], "ja");
const specialties = master.monsterSpecialtyList.map((s) => [s.name, { detail: s.detail ?? "", stackable: s.isStackable !== false }]).sort(byName);
const skills = master.skillList.map((s) => [s.name, { sp: s.sp, detail: s.detail ?? "" }]).sort(byName);
const tarots = master.tarotList.map((t) => [t.name, { upright: t.upright ?? "", reversed: t.reversed ?? "" }]).sort(byName);

// 掲載するモンスターが使う画像だけ取得する
const imageDest = join(root, "public/images/monster");
rmSync(imageDest, { recursive: true, force: true });
mkdirSync(imageDest, { recursive: true });
const usedImages = [...new Set(monsters.map(([, monster]) => monster.img))];
for (const file of usedImages) {
    const res = await fetch(`${base}/images/monster/${file}`);
    if (!res.ok) throw new Error(`画像取得に失敗: ${file} (${res.status})`);
    writeFileSync(join(imageDest, file), Buffer.from(await res.arrayBuffer()));
}

const json = (entries) => JSON.stringify(Object.fromEntries(entries), null, 4);
const body = `// 自動生成ファイル。直接編集しない。
const MONSTERS = ${json(monsters)};

const SPECIALTIES = ${json(specialties)};

const SKILLS = ${json(skills)};

const TAROTS = ${json(tarots)};
`;
mkdirSync(join(root, "content"), { recursive: true });
writeFileSync(join(root, "content/generated.js"), body, "utf8");

console.log(`monsters: ${monsters.length} / specialties: ${specialties.length} / skills: ${skills.length} / tarots: ${tarots.length} / images: ${usedImages.length}`);
if (missing.length > 0) console.log(`画像が見つからなかったモンスター: ${missing.join(", ")}`);
