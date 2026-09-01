// タイプ別のタブ切替。左右キー・Home・End にも対応する。
const tabs = [...document.querySelectorAll(".tab")];

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
