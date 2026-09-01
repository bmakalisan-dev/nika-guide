// GUIDE（文面）と MONSTERS / SPECIALTIES / SKILLS / TAROTS（生成データ）からページを描く。

const ELEMENT_LABEL = { red: "赤", green: "緑", blue: "青", black: "黒" };

const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
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
    const chip = el("span", `chip-el el-${element}`, ELEMENT_LABEL[element]);
    chip.title = element === "black" ? "3色編成は黒（太陽タロットが必要）" : "部隊属性";
    return chip;
};

const slot = (name) => {
    const box = el("div", "slot");
    const data = MONSTERS[name];
    if (data) {
        const sprite = el("img", "slot-sprite");
        sprite.src = `images/monster/${data.img}`;
        sprite.alt = name;
        sprite.loading = "lazy";
        box.append(sprite);
    } else {
        box.append(el("div", "slot-empty"));
    }
    const label = el("p", "slot-name", name);
    label.append(el("span", `slot-el el-${data ? data.element : "black"}`, data ? ELEMENT_LABEL[data.element] : "未登録"));
    box.append(label);
    return box;
};

/** 3体スロット＋合算HP＋部隊属性。このページの基本パーツ。 */
const partyWindow = (names, { showMeter = true, framed = true } = {}) => {
    const win = el("div", framed ? "card party" : "party");
    const slots = el("div", "party-slots");
    for (const name of names) slots.append(slot(name));
    win.append(slots);

    if (showMeter) {
        const meter = el("div", "party-meter");
        meter.append(el("span", "meter-label", "部隊HP"));
        const gauge = el("div", "gauge");
        const fill = el("div", "gauge-fill");
        fill.style.width = "100%";
        gauge.append(fill);
        meter.append(gauge, elementChip(partyElement(names)));
        win.append(meter);
    }
    return win;
};

const FIGURES = {
    // 重複不可の能力を2体に持たせても効果は1つ分
    stack: () => {
        const fig = el("div", "fig-stack");
        const row = el("div", "fig-stack-row");
        row.append(el("span", "fig-stack-chip is-nonstack", "甲殻"));
        row.append(el("span", "fig-stack-plus", "＋"));
        row.append(el("span", "fig-stack-chip is-nonstack is-waste", "甲殻"));
        fig.append(row, el("p", "fig-stack-note", "2体目は効果が乗らない"));
        return fig;
    },

    types: () => {
        const fig = el("div", "fig-types");
        for (const label of ["速度", "防御", "攻撃", "クリティカル"]) {
            fig.append(el("div", `fig-type${label === "速度" ? " is-on" : ""}`, label));
        }
        fig.append(el("div", "fig-type is-etc", "など"));
        return fig;
    },

    triangle: () => {
        const svg = `<svg class="fig-tri" viewBox="0 0 200 148" role="img" aria-label="赤は緑に強く、緑は青に強く、青は赤に強い">
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
        </svg>`;
        const holder = el("div");
        holder.innerHTML = svg;
        return holder.firstElementChild;
    },
};

const renderPolicy = () => {
    const { body, points } = GUIDE.policy;
    document.getElementById("policy-body").textContent = body;
    const list = document.getElementById("policy-points");
    for (const point of points ?? []) list.append(el("li", null, point));
};

const renderOverview = () => {
    const { head, monsters, callouts } = GUIDE.overview;
    document.querySelector("#overview-head .sec-text").textContent = head;
    document.getElementById("overview-party").append(partyWindow(monsters));

    const list = document.getElementById("overview-callouts");
    for (const item of callouts) {
        const li = el("li");
        li.append(el("p", "callout-label", item.label), el("p", "callout-body", item.body));
        list.append(li);
    }
};

const renderPrinciples = () => {
    document.querySelector("#principles-head .sec-text").textContent = GUIDE.principles.head;
    const list = document.getElementById("jou-list");
    for (const item of GUIDE.principles.items) {
        const li = el("li", "card jou");
        li.append(el("p", "jou-no", item.no), el("h3", "jou-head", item.head), el("p", "jou-body", item.body));
        const figure = FIGURES[item.figure]?.();
        if (figure) {
            const wrap = el("div", "jou-fig");
            wrap.append(figure);
            li.append(wrap);
        }
        list.append(li);
    }
};

const tierBoard = (tiers) => {
    const board = el("div", "card tier");
    for (const row of tiers) {
        const line = el("div", "tier-row");
        line.append(el("div", `rank rank-${row.rank.toLowerCase()}`, row.rank));
        const chips = el("ul", "chips");
        for (const ability of row.abilities) {
            const specialty = SPECIALTIES[ability];
            const nonStackable = specialty && !specialty.stackable;
            const chip = el("li", `chip-ability${nonStackable ? " is-nonstack" : ""}`, ability);
            if (specialty) chip.title = specialty.detail + (nonStackable ? "\n部隊単位の能力（1体分のみ有効）" : "");
            else chip.append(el("span", "missing", " ?"));
            chips.append(chip);
        }
        line.append(chips);
        board.append(line);
    }
    return board;
};

/** 相性が良いスキル・タロットの並び。名前だけの文字列でも { name, position } でも受ける。 */
const matchList = (entries, kind) => {
    const list = el("ul", "chips chips-match");
    for (const entry of entries ?? []) {
        const name = typeof entry === "string" ? entry : entry.name;
        const position = typeof entry === "string" ? null : entry.position;
        const chip = el("li", `chip-match chip-${kind}`, position ? `${name}（${position}）` : name);

        if (kind === "skill") {
            const skill = SKILLS[name];
            if (skill) chip.title = `SP${skill.sp}｜${skill.detail}`;
            else chip.append(el("span", "missing", " ?"));
        } else {
            const tarot = TAROTS[name];
            if (!tarot) chip.append(el("span", "missing", " ?"));
            else if (position === "正") chip.title = tarot.upright;
            else if (position === "逆") chip.title = tarot.reversed;
            else chip.title = `正: ${tarot.upright}／逆: ${tarot.reversed}`;
        }
        list.append(chip);
    }
    return list;
};

const renderTypes = () => {
    document.querySelector("#types-head .sec-text").textContent = GUIDE.types.head;
    document.getElementById("types-note").textContent = GUIDE.types.note;

    const tablist = document.getElementById("tablist");
    const panels = document.getElementById("panels");

    GUIDE.types.items.forEach((type, index) => {
        const tab = el("button", "tab", type.label);
        tab.type = "button";
        tab.id = `tab-${type.id}`;
        tab.setAttribute("role", "tab");
        tab.setAttribute("aria-controls", `panel-${type.id}`);
        tab.setAttribute("aria-selected", String(index === 0));
        tab.dataset.accent = type.accent ?? "blue";
        tab.tabIndex = index === 0 ? 0 : -1;
        tablist.append(tab);

        const panel = el("section", "panel");
        panel.id = `panel-${type.id}`;
        panel.setAttribute("role", "tabpanel");
        panel.setAttribute("aria-labelledby", tab.id);
        panel.dataset.accent = type.accent ?? "blue";
        panel.tabIndex = 0;
        panel.hidden = index !== 0;

        panel.append(el("p", "panel-lead", type.lead));
        panel.append(el("h3", "block-head", "特殊能力 Tier"));
        panel.append(tierBoard(type.tiers));
        if (GUIDE.types.tierLegend) {
            const legend = el("p", "tier-legend");
            legend.append(el("span", "chip-ability is-nonstack legend-sample", "重複不可"), el("span", null, GUIDE.types.tierLegend));
            panel.append(legend);
        }

        if (type.skills?.length || type.tarots?.length) {
            const match = el("div", "match-grid");
            if (type.skills?.length) {
                const box = el("div", "card match");
                box.append(el("h3", "match-head", "相性が良いスキル"), matchList(type.skills, "skill"));
                match.append(box);
            }
            if (type.tarots?.length) {
                const box = el("div", "card match");
                box.append(el("h3", "match-head", "相性が良いタロット"), matchList(type.tarots, "tarot"));
                match.append(box);
            }
            panel.append(match);
        }

        panel.append(el("h3", "block-head", "代表的な編成"));
        const formations = el("div", "formations");
        for (const item of type.formations) {
            const card = el("div", "card formation");
            const top = el("div", "formation-top");
            top.append(el("h4", "formation-name", item.name), elementChip(partyElement(item.monsters)));
            card.append(top, partyWindow(item.monsters, { showMeter: false, framed: false }), el("p", "formation-aim", item.aim));
            formations.append(card);
        }
        panel.append(formations);
        panels.append(panel);
    });

    const tabs = [...tablist.querySelectorAll(".tab")];
    const select = (next) => {
        tabs.forEach((tab, i) => {
            const on = i === next;
            tab.setAttribute("aria-selected", String(on));
            tab.tabIndex = on ? 0 : -1;
            document.getElementById(tab.getAttribute("aria-controls")).hidden = !on;
        });
        tabs[next].focus();
    };

    tabs.forEach((tab, i) => {
        tab.addEventListener("click", () => select(i));
        tab.addEventListener("keydown", (event) => {
            const step = { ArrowRight: 1, ArrowLeft: -1, Home: -i, End: tabs.length - 1 - i }[event.key];
            if (step === undefined) return;
            event.preventDefault();
            select((i + step + tabs.length) % tabs.length);
        });
    });
};

const renderShell = () => {
    document.title = GUIDE.site.title;
    document.getElementById("site-title").textContent = GUIDE.site.title;

    document.getElementById("footer-disclaimer").textContent = GUIDE.footer.disclaimer;
    const credit = document.getElementById("footer-credit");
    credit.textContent = GUIDE.footer.credit;
    if (GUIDE.site.gameUrl) {
        const link = el("a", null, `${GUIDE.site.gameName}を遊ぶ`);
        link.href = GUIDE.site.gameUrl;
        link.rel = "noopener";
        credit.append(document.createElement("br"), link);
    }
};

renderShell();
renderPolicy();
renderOverview();
renderPrinciples();
renderTypes();
