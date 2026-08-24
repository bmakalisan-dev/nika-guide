// GUIDE（文面）と MONSTERS / SPECIALTIES（自動生成データ）からページを描く。

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
    chip.title = element === "black" ? "3色編成は黒（タロット「太陽」正位置が必要）" : "部隊属性";
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

/** 3体スロット＋共有HP＋部隊属性。このページの基本パーツ。 */
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
    types: () => {
        const fig = el("div", "fig-types");
        for (const label of ["速度型", "防御型", "攻撃型", "クリティカル型"]) {
            fig.append(el("div", `fig-type${label === "速度型" ? " is-on" : ""}`, label));
        }
        return fig;
    },

    triangle: () => {
        const svg = `<svg class="fig-tri" viewBox="0 0 200 148" role="img" aria-label="赤は緑に強く、緑は青に強く、青は赤に強い">
            <defs><marker id="tri-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                <path d="M0 0 L10 5 L0 10 z" fill="#8b91a3"/></marker></defs>
            <g fill="none" stroke="#8b91a3" stroke-width="1.5" marker-end="url(#tri-arrow)">
                <path d="M115 33 L152 92"/><path d="M139 117 L61 117"/><path d="M48 92 L85 33"/>
            </g>
            <g font-family="Murecho, sans-serif" font-size="15" font-weight="700" text-anchor="middle" fill="#ffffff">
                <circle cx="100" cy="22" r="18" fill="#d94436"/><text x="100" y="28">赤</text>
                <circle cx="166" cy="120" r="18" fill="#1f9a52"/><text x="166" y="126">緑</text>
                <circle cx="34" cy="120" r="18" fill="#2a6ce0"/><text x="34" y="126">青</text>
            </g>
        </svg>`;
        const holder = el("div");
        holder.innerHTML = svg;
        return holder.firstElementChild;
    },

    synergy: () => {
        const fig = el("div", "fig-synergy");
        const links = [
            ["疾風", "急襲", "初手が早い → 先制が続く"],
            ["車輪", "渾身", "クリ率が上がる → 1発が重い"],
        ];
        for (const [from, to, note] of links) {
            const row = el("div", "fig-row");
            const link = el("div", "fig-link");
            link.append(el("span", "fig-link-chip", from), el("span", "fig-link-arrow", "＋"), el("span", "fig-link-chip", to));
            row.append(link, el("p", "fig-link-note", note));
            fig.append(row);
        }
        return fig;
    },
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
    const win = el("div", "card tier");
    for (const row of tiers) {
        const line = el("div", "tier-row");
        line.append(el("div", `rank rank-${row.rank.toLowerCase()}`, row.rank));
        const chips = el("ul", "chips");
        for (const ability of row.abilities) {
            const chip = el("li", "chip-ability", ability);
            const detail = SPECIALTIES[ability] ?? "";
            chip.dataset.detail = detail;
            if (detail) chip.title = detail;
            else chip.append(el("span", "missing", " ?"));
            chips.append(chip);
        }
        line.append(chips);
        win.append(line);
    }
    return win;
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
        tab.tabIndex = index === 0 ? 0 : -1;
        tablist.append(tab);

        const panel = el("section", "panel");
        panel.id = `panel-${type.id}`;
        panel.setAttribute("role", "tabpanel");
        panel.setAttribute("aria-labelledby", tab.id);
        panel.tabIndex = 0;
        panel.hidden = index !== 0;

        panel.append(el("p", "panel-lead", type.lead));
        panel.append(el("h3", "block-head", "特殊能力 Tier"));
        panel.append(tierBoard(type.tiers));
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
    document.title = `${GUIDE.site.title}｜非公式ファン攻略`;
    document.getElementById("site-title").textContent = GUIDE.site.title;
    document.getElementById("site-lede").textContent = GUIDE.site.lede;
    document.getElementById("draft").hidden = !GUIDE.draft;

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
renderOverview();
renderPrinciples();
renderTypes();
