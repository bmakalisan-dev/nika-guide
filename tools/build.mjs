// content/guide.js と content/generated.js から public/index.html を組み立てる。
// 名前がデータと一致しない場合はエラーで止める。
//
// 使い方: node tools/build.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const load = (file, names) => new Function(`${readFileSync(join(root, file), "utf8")}; return { ${names.join(", ")} };`)();
const { GUIDE } = load("content/guide.js", ["GUIDE"]);
const { MONSTERS, SPECIALTIES, SKILLS, TAROTS } = load("content/generated.js", ["MONSTERS", "SPECIALTIES", "SKILLS", "TAROTS"]);

const ELEMENT_LABEL = { red: "赤", green: "緑", blue: "青", black: "黒" };
const errors = [];

const esc = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** GIFヘッダから原寸を読む。width/height を出しておくと読み込み時のガタつきが出ない。 */
const gifSize = (file) => {
    const bytes = readFileSync(join(root, "public/images/monster", file));
    return { w: bytes.readUInt16LE(6), h: bytes.readUInt16LE(8) };
};

/** 部隊の属性は3体の多数決。3色そろうと黒。 */
const partyElement = (names) => {
    const elements = names.map((name) => MONSTERS[name]?.element).filter(Boolean);
    if (elements.length === 0) return "black";
    const count = {};
    for (const e of elements) count[e] = (count[e] ?? 0) + 1;
    if (Object.keys(count).length === 3) return "black";
    return Object.keys(count).reduce((top, e) => (count[e] > count[top] ? e : top));
};

const elementChip = (element) => {
    const title = element === "black" ? "3色編成は黒（太陽タロットが必要）" : "部隊属性";
    return `<span class="chip-el el-${element}" title="${esc(title)}">${ELEMENT_LABEL[element]}</span>`;
};

const slot = (name) => {
    const data = MONSTERS[name];
    if (!data) {
        errors.push(`モンスター「${name}」がデータに無い`);
        return `<div class="slot"><div class="slot-empty"></div><p class="slot-name">${esc(name)}</p></div>`;
    }
    const { w, h } = gifSize(data.img);
    return [
        `<div class="slot">`,
        `<img class="slot-sprite" src="images/monster/${data.img}" alt="${esc(name)}" width="${w}" height="${h}" loading="lazy">`,
        `<p class="slot-name">${esc(name)}<span class="slot-el el-${data.element}">${ELEMENT_LABEL[data.element]}</span></p>`,
        `</div>`,
    ].join("");
};

const partyWindow = (names, { showMeter = true, framed = true } = {}) => {
    const slots = `<div class="party-slots">${names.map(slot).join("")}</div>`;
    const meter = showMeter
        ? [
              `<div class="party-meter">`,
              `<span class="meter-label">部隊HP</span>`,
              `<div class="gauge"><div class="gauge-fill" style="width:100%"></div></div>`,
              elementChip(partyElement(names)),
              `</div>`,
          ].join("")
        : "";
    return `<div class="${framed ? "card party" : "party"}">${slots}${meter}</div>`;
};

const FIGURES = {
    stack: () =>
        [
            `<div class="fig-stack">`,
            `<div class="fig-stack-row">`,
            `<span class="fig-stack-chip is-nonstack">甲殻</span>`,
            `<span class="fig-stack-plus">＋</span>`,
            `<span class="fig-stack-chip is-nonstack is-waste">甲殻</span>`,
            `</div>`,
            `<p class="fig-stack-note">2体目は効果が乗らない</p>`,
            `</div>`,
        ].join(""),

    kibo: () => {
        const steps = ["集落", "村落", "村落施設", "宿場町", "宿場町施設", "街", "街施設"];
        const rows = steps
            .map((label, i) => `<div class="fig-kibo-row${i === steps.length - 1 ? " is-top" : ""}" style="width:${46 + i * 9}%">${label}</div>`)
            .join("");
        return `<div class="fig-kibo">${rows}</div>`;
    },

    types: () => {
        const cells = ["速度", "防御", "攻撃", "クリティカル"]
            .map((label) => `<div class="fig-type${label === "速度" ? " is-on" : ""}">${label}</div>`)
            .join("");
        return `<div class="fig-types">${cells}<div class="fig-type is-etc">など</div></div>`;
    },

    triangle: () => `<svg class="fig-tri" viewBox="0 0 200 148" role="img" aria-label="赤は緑に強く、緑は青に強く、青は赤に強い">
            <defs><marker id="tri-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                <path d="M0 0 L10 5 L0 10 z" fill="#a9aecb"/></marker></defs>
            <g fill="none" stroke="#a9aecb" stroke-width="2" marker-end="url(#tri-arrow)">
                <path d="M115 33 L152 92"/><path d="M139 117 L61 117"/><path d="M48 92 L85 33"/>
            </g>
            <g font-family="Murecho, sans-serif" font-size="15" font-weight="700" text-anchor="middle" fill="#ffffff">
                <circle cx="100" cy="22" r="18" fill="#e8443a"/><text x="100" y="28">赤</text>
                <circle cx="166" cy="120" r="18" fill="#17a05a"/><text x="166" y="126">緑</text>
                <circle cx="34" cy="120" r="18" fill="#2f74e8"/><text x="34" y="126">青</text>
            </g>
        </svg>`,
};

const secHead = (id, text) => `<h2 class="sec-head" id="${id}-head"><span class="sec-text">${esc(text)}</span></h2>`;

const masthead = () => {
    const points = (GUIDE.policy.points ?? []).map((p) => `<li>${esc(p)}</li>`).join("");
    return [
        `<header class="masthead">`,
        `<h1>${esc(GUIDE.site.title)}</h1>`,
        `<p class="policy-body">${esc(GUIDE.policy.body)}</p>`,
        points ? `<ul class="policy-points">${points}</ul>` : "",
        `</header>`,
    ].join("\n");
};

const overviewSection = () => {
    const { head, monsters, callouts } = GUIDE.overview;
    const items = callouts
        .map((c) => `<li><p class="callout-label">${esc(c.label)}</p><p class="callout-body">${esc(c.body)}</p></li>`)
        .join("");
    return [
        `<section class="section" id="overview" aria-labelledby="overview-head">`,
        secHead("overview", head),
        `<div class="overview-grid">`,
        `<div>${partyWindow(monsters)}</div>`,
        `<ol class="callouts">${items}</ol>`,
        `</div>`,
        `</section>`,
    ].join("\n");
};

const principlesSection = () => {
    const cards = GUIDE.principles.items
        .map((item) => {
            const figure = FIGURES[item.figure];
            if (!figure) errors.push(`図「${item.figure}」が無い（${item.no}）`);
            return [
                `<li class="card jou">`,
                `<p class="jou-no">${esc(item.no)}</p>`,
                `<h3 class="jou-head">${esc(item.head)}</h3>`,
                `<p class="jou-body">${esc(item.body)}</p>`,
                figure ? `<div class="jou-fig">${figure()}</div>` : "",
                `</li>`,
            ].join("");
        })
        .join("");
    return [
        `<section class="section" id="principles" aria-labelledby="principles-head">`,
        secHead("principles", GUIDE.principles.head),
        `<ol class="jou-list">${cards}</ol>`,
        `</section>`,
    ].join("\n");
};

const tierBoard = (tiers) => {
    const rows = tiers
        .map((row) => {
            const chips = row.abilities
                .map((ability) => {
                    const specialty = SPECIALTIES[ability];
                    if (!specialty) {
                        errors.push(`特殊能力「${ability}」がデータに無い`);
                        return `<li class="chip-ability">${esc(ability)}</li>`;
                    }
                    const nonStackable = !specialty.stackable;
                    const title = specialty.detail + (nonStackable ? "\n部隊単位の能力（1体分のみ有効）" : "");
                    return `<li class="chip-ability${nonStackable ? " is-nonstack" : ""}" title="${esc(title)}">${esc(ability)}</li>`;
                })
                .join("");
            return `<div class="tier-row"><div class="rank rank-${row.rank.toLowerCase()}">${esc(row.rank)}</div><ul class="chips">${chips}</ul></div>`;
        })
        .join("");
    return `<div class="card tier">${rows}</div>`;
};

const matchList = (names, kind) => {
    const chips = (names ?? [])
        .map((name) => {
            let title = "";
            if (kind === "skill") {
                const skill = SKILLS[name];
                if (skill) title = `SP${skill.sp}｜${skill.detail}`;
                else errors.push(`スキル「${name}」がデータに無い`);
            } else {
                const tarot = TAROTS[name];
                if (tarot) title = `正: ${tarot.upright}／逆: ${tarot.reversed}`;
                else errors.push(`タロット「${name}」がデータに無い`);
            }
            return `<li class="chip-match chip-${kind}"${title ? ` title="${esc(title)}"` : ""}>${esc(name)}</li>`;
        })
        .join("");
    return `<ul class="chips chips-match">${chips}</ul>`;
};

const typesSection = () => {
    const tabs = GUIDE.types.items
        .map(
            (type, i) =>
                `<button type="button" class="tab" id="tab-${type.id}" role="tab" aria-controls="panel-${type.id}" aria-selected="${i === 0}" data-accent="${type.accent}" tabindex="${i === 0 ? 0 : -1}">${esc(type.label)}</button>`,
        )
        .join("");

    const panels = GUIDE.types.items
        .map((type, i) => {
            const traits = type.traits?.length
                ? `<div class="card traits"><h3 class="traits-head">相性が良い特殊能力</h3><ul class="traits-list">${type.traits.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>`
                : "";

            const legend = GUIDE.types.tierLegend
                ? `<p class="tier-legend"><span class="chip-ability is-nonstack legend-sample">重複不可</span><span>${esc(GUIDE.types.tierLegend)}</span></p>`
                : "";

            const match =
                type.skills?.length || type.tarots?.length
                    ? [
                          `<div class="match-grid">`,
                          type.skills?.length ? `<div class="card match"><h3 class="match-head">相性が良いスキル</h3>${matchList(type.skills, "skill")}</div>` : "",
                          type.tarots?.length ? `<div class="card match"><h3 class="match-head">相性が良いタロット</h3>${matchList(type.tarots, "tarot")}</div>` : "",
                          `</div>`,
                      ].join("")
                    : "";

            const formations = type.formations
                .map((item) =>
                    [
                        `<div class="card formation">`,
                        `<div class="formation-top"><h4 class="formation-name">${esc(item.name)}</h4>${elementChip(partyElement(item.monsters))}</div>`,
                        partyWindow(item.monsters, { showMeter: false, framed: false }),
                        `<p class="formation-aim">${esc(item.aim)}</p>`,
                        `</div>`,
                    ].join(""),
                )
                .join("");

            return [
                `<section class="panel" id="panel-${type.id}" role="tabpanel" aria-labelledby="tab-${type.id}" data-accent="${type.accent}" tabindex="0"${i === 0 ? "" : " hidden"}>`,
                `<p class="panel-lead">${esc(type.lead)}</p>`,
                traits,
                `<h3 class="block-head">使用頻度 Tier</h3>`,
                tierBoard(type.tiers),
                legend,
                match,
                `<h3 class="block-head">代表的な編成</h3>`,
                `<div class="formations">${formations}</div>`,
                `</section>`,
            ].join("\n");
        })
        .join("\n");

    return [
        `<section class="section" id="types" aria-labelledby="types-head">`,
        secHead("types", GUIDE.types.head),
        `<p class="sec-note">${esc(GUIDE.types.note)}</p>`,
        `<div class="tabs" role="tablist" aria-label="編成タイプ">${tabs}</div>`,
        `<div>`,
        panels,
        `</div>`,
        `</section>`,
    ].join("\n");
};

const footer = () => {
    const credit = GUIDE.footer.credit ?? "";
    const link = GUIDE.site.gameUrl
        ? `${credit ? "<br>" : ""}<a href="${esc(GUIDE.site.gameUrl)}" rel="noopener">${esc(GUIDE.site.gameName)}を遊ぶ</a>`
        : "";
    return [
        `<footer class="footer">`,
        `<p class="disclaimer">${esc(GUIDE.footer.disclaimer)}</p>`,
        credit || link ? `<p class="credit">${esc(credit)}${link}</p>` : "",
        `</footer>`,
    ].join("\n");
};

const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(GUIDE.site.title)}</title>
<meta name="description" content="${esc(GUIDE.meta.description)}">
<!-- 内容が固まったら content="index, follow" に変える -->
<meta name="robots" content="${esc(GUIDE.meta.robots)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(GUIDE.site.title)}">
<meta property="og:description" content="${esc(GUIDE.meta.ogDescription)}">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+JP:wght@400;500;600&family=Murecho:wght@700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/style.css">
</head>
<body>

${masthead()}

<main>
${overviewSection()}

${principlesSection()}

${typesSection()}
</main>

${footer()}

<script src="assets/tabs.js"></script>
</body>
</html>
`;

if (errors.length > 0) {
    console.error("ビルド失敗:");
    for (const e of [...new Set(errors)]) console.error("  - " + e);
    process.exit(1);
}

writeFileSync(join(root, "public/index.html"), html, "utf8");
console.log(`public/index.html を書き出し（${Buffer.byteLength(html)} bytes）`);
