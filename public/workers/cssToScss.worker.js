// public/workers/cssToScss.worker.js

// 🚩 بارگذاری کتابخانه css-tree از CDN (تنها در Worker)
importScripts('./csstree.min.js');

const csstree = self.csstree;

self.onmessage = (e) => {
    try {
        const { css, options } = e.data || {};
        // فراخوانی تابع اصلی تبدیل
        const out = convertCssToScss(css || '', options || {});
        self.postMessage({ ok: true, scss: out });
    } catch (err) {
        self.postMessage({ ok: false, error: (err && err.message) || String(err) });
    }
};

// 🚩 تمام منطق convertCssToScss را در زیر کپی کنید:

function convertCssToScss(input, opts) {
    const options = {
        enableVariableExtraction: true,
        enableNesting: true,
        variableMinRepeats: 2,
        maxTopVariables: 12,
        ...opts,
    };

    const ast = csstree.parse(input, { parseValue: true, parseCustomProperty: false });

    // Collect rules, grouped by at-rule (media/supports) scope
    const scopes = new Map();

    function getScopeKey(node) {
        if (!node) return 'root';
        if (node.type === 'Atrule' && node.name) {
            const prelude = node.prelude ? csstree.generate(node.prelude).trim() : '';
            return `@${node.name} ${prelude}`.trim();
        }
        return 'root';
    }

    // Build a nesting tree per scope
    function makeNode(label = '') {
        return { label, decls: [], children: new Map() };
    }

    function insertPath(root, segments, decls) {
        let cur = root;
        for (const seg of segments) {
            if (!cur.children.has(seg)) cur.children.set(seg, makeNode(seg));
            cur = cur.children.get(seg);
        }
        // Merge declarations (by property; last one wins)
        const map = new Map(cur.decls.map(d => [d.prop, d.val]));
        for (const d of decls) map.set(d.prop, d.val);
        cur.decls = Array.from(map, ([prop, val]) => ({ prop, val }));
    }

    function splitSelectorToSegments(selector) {
        // Split by combinators while keeping them: space, >, +, ~
        const parts = selector.trim().split(/(\s*[>+~]\s*|\s+)/).filter(Boolean);
        // Merge combinator token with the next simple selector
        const segs = [];
        let pendingComb = '';
        for (const p of parts) {
            const isComb = /^(\s*[>+~]\s*|\s+)$/.test(p);
            if (isComb) {
                pendingComb = p.replace(/\s+/g, ' ');
            } else {
                let seg = p;
                if (pendingComb && pendingComb.trim()) {
                    const comb = pendingComb.trim();
                    if (comb === '>') seg = `> ${seg}`;
                    else if (comb === '+') seg = `+ ${seg}`;
                    else if (comb === '~') seg = `~ ${seg}`;
                    else seg = `${seg}`; // descendant
                }
                pendingComb = '';
                // Pseudo handling: :hover -> &:hover inside nesting
                if (/^[:]{1,2}/.test(seg)) seg = `&${seg}`;
                segs.push(seg);
            }
        }
        return segs;
    }

    function selectorListToArray(rulePrelude) {
        // Robustly parse selector list via css-tree
        const selText = csstree.generate(rulePrelude);
        const sl = csstree.parse(selText, { context: 'selectorList' });
        const arr = [];
        sl.children.forEach((sel) => arr.push(csstree.generate(sel)));
        return arr;
    }

    // Walk top-level
    ast.children.forEach((node) => {
        if (node.type === 'Rule') {
            const scopeKey = 'root';
            if (!scopes.has(scopeKey)) scopes.set(scopeKey, { root: makeNode('ROOT'), declsAll: [] });
            const scope = scopes.get(scopeKey);

            const selectors = selectorListToArray(node.prelude);
            const decls = [];
            node.block.children.forEach((decl) => {
                if (decl.type === 'Declaration') {
                    decls.push({ prop: decl.property, val: csstree.generate(decl.value) });
                    scope.declsAll.push(csstree.generate(decl.value));
                }
            });
            for (const sel of selectors) {
                const segs = splitSelectorToSegments(sel);
                insertPath(scope.root, segs, decls);
            }
        } else if (node.type === 'Atrule' && (node.name === 'media' || node.name === 'supports')) {
            const scopeKey = getScopeKey(node);
            if (!scopes.has(scopeKey)) scopes.set(scopeKey, { root: makeNode('ROOT'), declsAll: [] });
            const scope = scopes.get(scopeKey);

            // Walk inside @media/@supports
            node.block.children.forEach((inner) => {
                if (inner.type !== 'Rule') return;
                const selectors = selectorListToArray(inner.prelude);
                const decls = [];
                inner.block.children.forEach((decl) => {
                    if (decl.type === 'Declaration') {
                        decls.push({ prop: decl.property, val: csstree.generate(decl.value) });
                        scope.declsAll.push(csstree.generate(decl.value));
                    }
                });
                for (const sel of selectors) {
                    const segs = splitSelectorToSegments(sel);
                    insertPath(scope.root, segs, decls);
                }
            });
        }
    });

    // Variable extraction (simple heuristics)
    function classifyValue(v) {
        if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v) || /^rgba?\(/i.test(v) || /^hsla?\(/i.test(v)) return 'color';
        if (/(^|\s)(\d*\.?\d+)(px|rem|em|vw|vh|%)($|\s|,)/.test(v)) return 'size';
        if (/\b(?:Arial|Helvetica|Inter|Roboto|Georgia|Times|Courier)\b/i.test(v) || /font-family/i.test(v)) return 'font';
        return 'other';
    }

    const valueFreq = new Map();
    for (const { declsAll } of scopes.values()) {
        for (const v of declsAll) {
            const key = v.trim();
            if (!key) continue;
            valueFreq.set(key, (valueFreq.get(key) || 0) + 1);
        }
    }

    const candidates = Array.from(valueFreq.entries())
        .filter(([v, c]) => c >= options.variableMinRepeats && classifyValue(v) !== 'other' && v.length >= 3)
        .sort((a, b) => b[1] - a[1])
        .slice(0, options.maxTopVariables);

    const valueToVar = new Map();
    let colorIdx = 1, sizeIdx = 1, fontIdx = 1;
    for (const [v] of candidates) {
        const t = classifyValue(v);
        let name;
        if (t === 'color') name = `$color${colorIdx++}`;
        else if (t === 'size') name = `$space${sizeIdx++}`;
        else if (t === 'font') name = `$font${fontIdx++}`;
        else name = `$var${valueToVar.size + 1}`;
        valueToVar.set(v, name);
    }

    function replaceValuesInDecls(decls) {
        return decls.map(({ prop, val }) => {
            const trimmed = val.trim();
            const varName = valueToVar.get(trimmed);
            if (varName) return { prop, val: varName };
            return { prop, val };
        });
    }

    // Render tree → SCSS
    function indent(n) { return '  '.repeat(n); }

    function renderNode(node, level) {
        let out = '';
        // Render this node (skip ROOT label)
        if (node.label && node.label !== 'ROOT') {
            out += `${indent(level)}${node.label} {\n`;
            const decls = replaceValuesInDecls(node.decls);
            for (const d of decls) out += `${indent(level + 1)}${d.prop}: ${d.val};\n`;
            // Children
            for (const child of node.children.values()) {
                out += renderNode(child, level + 1);
            }
            out += `${indent(level)}}\n`;
            return out;
        } else {
            // ROOT: only children
            for (const child of node.children.values()) out += renderNode(child, level);
            return out;
        }
    }

    let scssOut = '';

    // Top variables
    if (options.enableVariableExtraction && valueToVar.size) {
        for (const [v, name] of valueToVar.entries()) {
            scssOut += `${name}: ${v};\n`;
        }
        scssOut += `\n`;
    }

    // Root scope first
    const rootScope = scopes.get('root');
    if (rootScope) scssOut += renderNode(rootScope.root, 0);

    // Then @media/@supports scopes
    for (const [key, scope] of scopes.entries()) {
        if (key === 'root') continue;
        scssOut += `${key} {\n`;
        scssOut += renderNode(scope.root, 1);
        scssOut += `}\n`;
    }

    // Small cleanup: collapse extra blank lines
    scssOut = scssOut.replace(/\n{3,}/g, "\n\n");

    return scssOut;
}