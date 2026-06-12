// src/lib/cssTransformers.ts

/**
 * قالب‌بندی نام ویژگی‌های CSS به استایل JS (CamelCase)
 * با حفظ متغیرهای CSS و مدیریت پیشوندها
 */
function formatProperty(prop: string): string {
    prop = prop.trim();

    // اگر متغیر CSS بود (با -- شروع شد)، بدون تغییر برگردان
    if (prop.startsWith('--')) {
        return prop;
    }

    // تبدیل dashed-case به camelCase
    let jsKey = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

    // مدیریت حروف بزرگ برای پیشوندهای مرورگر (به جز ms)
    if (prop.startsWith('-webkit-') || prop.startsWith('-moz-') || prop.startsWith('-o-')) {
        jsKey = jsKey.charAt(0).toUpperCase() + jsKey.slice(1);
    } else if (prop.startsWith('-ms-')) {
        jsKey = 'ms' + jsKey.slice(2);
    }

    return jsKey;
}

/**
 * تبدیل CSS/SCSS به آبجکت JavaScript با استفاده از الگوریتم Stack
 */
export function cssToJs(css: string): string {
    if (!css || !css.trim()) return '';

    // حذف کامنت‌های چندخطی برای جلوگیری از تداخل
    let cleanCss = css.replace(/\/\*[\s\S]*?\*\//g, '');

    const root: Record<string, any> = {};
    const stack: Record<string, any>[] = [root];
    let currentObj = root;

    let buffer = '';
    let inString: string | false = false;
    let currentKey = '';

    for (let i = 0; i < cleanCss.length; i++) {
        const char = cleanCss[i];

        // مدیریت رشته‌ها (Strings) برای جلوگیری از شکستن ساختار با { یا : داخل رشته‌ها
        if ((char === '"' || char === "'") && cleanCss[i - 1] !== '\\') {
            if (inString === char) {
                inString = false;
            } else if (!inString) {
                inString = char;
            }
            buffer += char;
            continue;
        }

        if (inString) {
            buffer += char;
            continue;
        }

        if (char === '{') {
            // شروع یک بلاک جدید (سلکتور یا مدیا کوئری)
            const selector = buffer.trim();
            buffer = '';

            const newObj = {};
            currentObj[selector] = newObj;
            stack.push(newObj);
            currentObj = newObj;
        } else if (char === '}') {
            // پایان بلاک فعلی
            if (buffer.trim()) {
                // اگر چیزی در بافر مانده و پراپرتی تنظیم شده، آن را ذخیره کن
                if (currentKey) {
                    currentObj[formatProperty(currentKey)] = buffer.trim().replace(/'/g, "\\'");
                    currentKey = '';
                }
            }
            buffer = '';
            stack.pop();
            currentObj = stack[stack.length - 1] || root;
        } else if (char === ':') {
            // جداکننده کلید و مقدار (به شرطی که داخل یک سلکتور یا مقدار نباشیم)
            // بررسی اینکه آیا این دو نقطه مربوط به یک پراپرتی است یا شبه‌کلاس/شبه‌عنصر
            const nextChar = cleanCss[i + 1];
            const isPseudo = nextChar === ':' || buffer.trim().includes('&') || !buffer.trim().match(/^[a-zA-Z0-9-]+$/);

            if (!isPseudo && !currentKey && buffer.trim() !== '') {
                currentKey = buffer.trim();
                buffer = '';
            } else {
                buffer += char;
            }
        } else if (char === ';') {
            // پایان یک خط استایل
            if (currentKey) {
                currentObj[formatProperty(currentKey)] = buffer.trim().replace(/'/g, "\\'");
                currentKey = '';
            }
            buffer = '';
        } else {
            buffer += char;
        }
    }

    // تبدیل آبجکت به رشته متنی فرمت‌شده
    const generateString = (obj: Record<string, any>, indent = 2): string => {
        let result = '';
        const spaces = ' '.repeat(indent);
        const keys = Object.keys(obj);

        keys.forEach((key, index) => {
            const value = obj[key];
            const isLast = index === keys.length - 1;

            if (typeof value === 'object') {
                result += `${spaces}'${key}': {\n${generateString(value, indent + 2)}\n${spaces}}${isLast ? '' : ','}\n`;
            } else {
                // تشخیص مقادیری که خودشان شامل نقل قول هستند
                const formattedValue = value.includes('"') && !value.startsWith("'") ? `'${value}'` : `'${value}'`;
                result += `${spaces}'${key}': ${formattedValue}${isLast ? '' : ','}\n`;
            }
        });

        return result.replace(/\n$/, ''); // حذف آخرین خط خالی
    };

    return `// JavaScript Object Style\n{\n${generateString(root)}\n}`;
}

/**
 * تبدیل CSS به Tailwind (نسخه پایه و Mock)
 * برای تبدیل دقیق نیازمند پکیج‌های پیشرفته‌تر یا نگاشت کامل است.
 */



/**
 * تبدیل CSS به کلاس‌های Tailwind CSS
 */
// src/lib/tools-transformer/cssTransformers.ts

// ---------- نگاشت کامل مقادیر (اعداد، رنگ‌ها، سایه‌ها) ----------
const spacingMap: Record<string, string> = {
    '0': '0', '0.25rem': '1', '0.5rem': '2', '0.75rem': '3', '1rem': '4',
    '1.25rem': '5', '1.5rem': '6', '1.75rem': '7', '2rem': '8', '2.5rem': '10',
    '3rem': '12', '4rem': '16', '5rem': '20',
};
const colorMap: Record<string, string> = {
    '#ffffff': 'white', '#f8fafc': 'slate-50', '#e2e8f0': 'gray-200',
    '#cbd5e1': 'gray-300', '#94a3b8': 'gray-400', '#64748b': 'gray-500',
    '#0f172a': 'gray-900', '#1e293b': 'gray-800', '#3b82f6': 'blue-500',
    '#2563eb': 'blue-600', '#1d4ed8': 'blue-700', '#eff6ff': 'blue-50',
};
const shadowMap: Record<string, string> = {
    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)': 'shadow-md',
    '0 10px 15px -3px rgba(0, 0, 0, 0.1)': 'shadow-lg',
};

// ---------- تابع اصلی ----------
// src/lib/tools-transformer/cssTransformers.ts

/**
 * تبدیل CSS به کلاس‌های Tailwind CSS
 */
export function cssToTailwind(css: string): string {
    if (!css?.trim()) return '';

    // ۱. پارس کامل CSS با همان تابع موفق parseCssBlocks
    const rules = parseCssBlocks(css);

    // ۲. گروه‌بندی (base + variants)
    const groups = groupRulesBySelector(rules);

    // ۳. تولید خروجی نهایی
    return formatTailwindOutput(groups);
}

// ---------- همان پارسر موفق که قبلاً داشتیم ----------
interface CssRule {
    selector: string;
    properties: Record<string, string>;
}

function parseCssBlocks(css: string): CssRule[] {
    const rules: CssRule[] = [];
    const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');

    const blockRegex = /([^{]+)\{([^{}]*)\}/g;
    let match;

    while ((match = blockRegex.exec(clean)) !== null) {
        const selector = match[1].trim();
        const body = match[2].trim();

        if (selector.startsWith('@')) continue; // از media و keyframes صرف نظر می‌کنیم

        const props: Record<string, string> = {};
        body.split(';').forEach(line => {
            const colonIndex = line.indexOf(':');
            if (colonIndex === -1) return;
            const prop = line.substring(0, colonIndex).trim().toLowerCase();
            const value = line.substring(colonIndex + 1).trim();
            props[prop] = value;
        });

        rules.push({ selector, properties: props });
    }

    return rules;
}

// ---------- گروه‌بندی بر اساس سلکتور والد ----------
interface TailwindGroup {
    selector: string;
    baseClasses: string;
    variants: { state: string; classes: string }[];
}

function groupRulesBySelector(rules: CssRule[]): TailwindGroup[] {
    const groups: Record<string, TailwindGroup> = {};

    for (const rule of rules) {
        const sel = rule.selector;

        // hover, focus, active, ...
        const pseudoMatch = sel.match(/^(.+?):(hover|focus|active|visited|first-child|last-child)$/);
        if (pseudoMatch) {
            const parent = pseudoMatch[1];
            const state = pseudoMatch[2];
            if (!groups[parent]) {
                groups[parent] = { selector: parent, baseClasses: '', variants: [] };
            }
            const stateClasses = propertiesToTailwind(rule.properties);
            if (stateClasses) {
                groups[parent].variants.push({ state, classes: stateClasses });
            }
            continue;
        }

        // BEM: .card__title, .card--featured
        const bemMatch = sel.match(/^(.+?)(__|--)(.+)$/);
        if (bemMatch) {
            // فعلاً کلاس‌های BEM را به عنوان یک سلکتور مجزا نگه می‌داریم
            const baseClasses = propertiesToTailwind(rule.properties);
            if (baseClasses) {
                groups[sel] = { selector: sel, baseClasses, variants: [] };
            }
            continue;
        }

        // عادی
        if (!groups[sel]) {
            groups[sel] = { selector: sel, baseClasses: '', variants: [] };
        }
        const newClasses = propertiesToTailwind(rule.properties);
        if (newClasses) {
            groups[sel].baseClasses = groups[sel].baseClasses
                ? groups[sel].baseClasses + ' ' + newClasses
                : newClasses;
        }
    }

    return Object.values(groups);
}

// ---------- تبدیل یک دسته property/value به کلاس‌های Tailwind ----------
function propertiesToTailwind(props: Record<string, string>): string {
    const classes: string[] = [];

    for (const [prop, value] of Object.entries(props)) {
        const tw = convertSingleProperty(prop, value);
        if (tw) classes.push(tw);
    }

    return classes.join(' ');
}

// ---------- تبدیل یک ویژگی منفرد ----------
function convertSingleProperty(prop: string, value: string): string {
    const key = `${prop}: ${value}`;

    if (EXACT_MAP[key]) return EXACT_MAP[key];

    // border
    if (prop === 'border') {
        if (value === 'none') return 'border-0';
        const parts = value.split(' ');
        const width = parts[0] in SPACING ? SPACING[parts[0]] : '';
        const color = parts.slice(-1)[0] in COLORS ? COLORS[parts.slice(-1)[0]] : '';
        // اگر width در SPACING نبود، از border ساده استفاده کن
        return `border${width ? '-' + width : ''}${color ? ' border-' + color : ''}`;
    }

    // border-color
    if (prop === 'border-color') {
        return `border-${COLORS[value] || value}`;
    }

    // border-radius
    if (prop === 'border-radius') {
        const mapped = BORDER_RADIUS[value] || `[${value}]`;
        return mapped.startsWith('[') ? `rounded-${mapped}` : `rounded-${mapped}`;
    }

    // box-shadow
    if (prop === 'box-shadow') {
        const normalized = value.replace(/\s+/g, ' ').trim();
        return SHADOWS[normalized] || `shadow-[${normalized.replace(/\s+/g, '_')}]`;
    }

    // font-size
    if (prop === 'font-size') {
        const mapped = FONT_SIZE[value] || `[${value}]`;
        return mapped.startsWith('[') ? `text-${mapped}` : `text-${mapped}`;
    }

    // line-height
    if (prop === 'line-height') {
        const mapped = LINE_HEIGHT[value] || `[${value}]`;
        return mapped.startsWith('[') ? `leading-${mapped}` : `leading-${mapped}`;
    }

    // transition
    if (prop === 'transition') return 'transition';

    // color / background-color
    if (prop === 'color') return `text-${COLORS[value] || value}`;
    if (prop === 'background-color') return `bg-${COLORS[value] || value}`;

    // transform
    if (prop === 'transform' && value.startsWith('translateY(')) {
        const match = value.match(/translateY\(([^)]+)\)/);
        if (match) {
            const amount = match[1];
            if (amount === '-2px') return '-translate-y-0.5';
            if (amount === '2px') return 'translate-y-0.5';
            return `translate-y-[${amount}]`;
        }
    }

    // سایر prefixها (margin, padding, gap, ...)
    const prefix = PREFIX_MAP[prop];
    if (prefix) {
        let val = SPACING[value] || value;
        return `${prefix}-${val}`;
    }

    return `[${prop}:${value.replace(/\s+/g, '_')}]`;
}

const BORDER_RADIUS: Record<string, string> = {
    '0': 'none', '0.125rem': 'sm', '0.25rem': 'DEFAULT', '0.375rem': 'md',
    '0.5rem': 'lg', '0.75rem': 'xl', '1rem': '2xl', '1.5rem': '3xl',
    '9999px': 'full',
};

const FONT_SIZE: Record<string, string> = {
    '0.75rem': 'xs', '0.875rem': 'sm', '1rem': 'base', '1.125rem': 'lg',
    '1.25rem': 'xl', '1.5rem': '2xl', '1.875rem': '3xl', '2.25rem': '4xl',
    '3rem': '5xl', '3.75rem': '6xl', '4.5rem': '7xl',
};

const LINE_HEIGHT: Record<string, string> = {
    '1': 'none', '1.25': 'tight', '1.375': 'snug', '1.5': 'normal',
    '1.625': 'relaxed', '2': 'loose', '1.6': '7',
};

// ---------- تولید خروجی نهایی ----------
function formatTailwindOutput(groups: TailwindGroup[]): string {
    const lines: string[] = [];

    for (const group of groups) {
        let classList = group.baseClasses;

        for (const v of group.variants) {
            const prefixed = v.classes.split(' ').map(c => `${v.state}:${c}`).join(' ');
            classList += ' ' + prefixed;
        }

        if (classList.trim()) {
            lines.push(`${group.selector} { class="${classList.trim()}" }`);
        }
    }

    return lines.join('\n');
}

// ---------- نگاشت‌های نهایی ----------
const SPACING: Record<string, string> = {
    '0': '0', '0.25rem': '1', '0.5rem': '2', '0.75rem': '3', '1rem': '4',
    '1.25rem': '5', '1.5rem': '6', '2rem': '8', '2.5rem': '10', '3rem': '12',
    '4rem': '16', '5rem': '20',
};

const COLORS: Record<string, string> = {
    '#ffffff': 'white', '#f8fafc': 'slate-50', '#e2e8f0': 'gray-200',
    '#cbd5e1': 'gray-300', '#94a3b8': 'gray-400', '#64748b': 'gray-500',
    '#0f172a': 'gray-900', '#1e293b': 'gray-800', '#3b82f6': 'blue-500',
    '#2563eb': 'blue-600', '#1d4ed8': 'blue-700', '#eff6ff': 'blue-50',
};

const SHADOWS: Record<string, string> = {
    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)': 'shadow-md',
    '0 10px 15px -3px rgba(0, 0, 0, 0.1)': 'shadow-lg',
};

const EXACT_MAP: Record<string, string> = {
    'display: flex': 'flex',
    'display: none': 'hidden',
    'text-align: center': 'text-center',
    'text-transform: uppercase': 'uppercase',
    'align-items: center': 'items-center',
    'justify-content: space-between': 'justify-between',
    'cursor: pointer': 'cursor-pointer',
    'font-weight: 500': 'font-medium',
    'font-weight: 600': 'font-semibold',
};

const PREFIX_MAP: Record<string, string> = {
    'margin': 'm', 'margin-top': 'mt', 'margin-right': 'mr', 'margin-bottom': 'mb', 'margin-left': 'ml',
    'padding': 'p', 'padding-top': 'pt', 'padding-right': 'pr', 'padding-bottom': 'pb', 'padding-left': 'pl',
    'gap': 'gap', 'font-size': 'text', 'line-height': 'leading',
};

// ---------- پارس اولیه ----------
interface CssRule {
    selector: string;
    properties: Record<string, string>;
}

function parseCssRules(css: string): CssRule[] {
    const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const blockRegex = /([^{]+)\{([^{}]*)\}/g;
    const rules: CssRule[] = [];
    let match;

    while ((match = blockRegex.exec(clean)) !== null) {
        const selector = match[1].trim();
        const body = match[2].trim();
        const props: Record<string, string> = {};

        body.split(';').forEach(line => {
            const colonIndex = line.indexOf(':');
            if (colonIndex === -1) return;
            const prop = line.substring(0, colonIndex).trim().toLowerCase();
            const value = line.substring(colonIndex + 1).trim();
            props[prop] = value;
        });

        rules.push({ selector, properties: props });
    }

    return rules;
}

// ---------- گروه‌بندی (hover, focus, BEM) ----------
interface GroupedRule {
    base: string;
    properties: Record<string, string>;
    variants: Record<string, Record<string, string>>; // e.g., { 'hover': { ... }, 'focus': { ... } }
}

function groupByParent(rules: CssRule[]): GroupedRule[] {
    const groups: Record<string, GroupedRule> = {};

    for (const rule of rules) {
        const sel = rule.selector;

        // hover, focus, active, ...
        const pseudoMatch = sel.match(/^(.+?)((?::(?:hover|focus|active|visited|first-child|last-child)))$/);
        if (pseudoMatch) {
            const parent = pseudoMatch[1];
            const pseudo = pseudoMatch[2].slice(1); // حذف :
            if (!groups[parent]) groups[parent] = { base: parent, properties: {}, variants: {} };
            groups[parent].variants[pseudo] = rule.properties;
            continue;
        }

        // BEM: .card__title, .card--featured
        const bemMatch = sel.match(/^(.+?)(__|--)(.+)$/);
        if (bemMatch) {
            const parent = bemMatch[1];
            const modifier = bemMatch[2] === '--' ? `&--${bemMatch[3]}` : `&__${bemMatch[3]}`;
            // تبدیل به کلاس‌های کمکی (می‌توان جداگانه هم خروجی داد)
            if (!groups[sel]) groups[sel] = { base: sel, properties: rule.properties, variants: {} };
            continue;
        }

        // عادی
        if (groups[sel]) {
            Object.assign(groups[sel].properties, rule.properties);
        } else {
            groups[sel] = { base: sel, properties: rule.properties, variants: {} };
        }
    }

    return Object.values(groups);
}

// ---------- تولید خروجی ----------
function generateTailwind(groups: GroupedRule[]): string {
    let output = '';

    for (const group of groups) {
        const baseClasses = convertPropertiesToClasses(group.properties);
        if (!baseClasses && Object.keys(group.variants).length === 0) continue;

        if (baseClasses) {
            output += `"${baseClasses}"`;
        }

        for (const [variant, props] of Object.entries(group.variants)) {
            const variantClasses = convertPropertiesToClasses(props);
            if (variantClasses) {
                // هر کلاس را با hover: پیشوند دهیم
                const prefixed = variantClasses
                    .split(' ')
                    .map(c => (c === '' ? '' : `${variant}:${c}`))
                    .join(' ');
                output += ` ${prefixed}`;
            }
        }

        // اضافه کردن کلاس‌های BEM به‌عنوان کلاس‌های جدا
        if (group.base.includes('__') || group.base.includes('--')) {
            const childClasses = convertPropertiesToClasses(group.properties);
            if (childClasses) {
                output += ` ${childClasses}`;
            }
        }
    }

    return output ? `class=${output}` : '';
}

// ---------- تبدیل یک مجموعه property/value به کلاس‌های Tailwind ----------
function convertPropertiesToClasses(props: Record<string, string>): string {
    const classes: string[] = [];

    for (const [prop, value] of Object.entries(props)) {
        const twClass = convertSingle(prop, value);
        if (twClass) classes.push(twClass);
    }

    return classes.join(' ');
}

function convertSingle(prop: string, value: string): string {
    // 1. تطابق‌های دقیق (display, position, ...)
    const exactKey = `${prop}: ${value}`;
    if (tailwindExactMap[exactKey]) return tailwindExactMap[exactKey];

    // 2. border (خاص)
    if (prop === 'border') {
        const parts = value.split(' ');
        if (parts.length >= 2) {
            const width = spacingMap[parts[0]] || parts[0];
            const color = colorMap[parts.slice(1).join(' ')] || parts.slice(1).join(' ');
            return `border-${width} border-${color}`;
        }
        return 'border';
    }

    // 3. box-shadow
    if (prop === 'box-shadow') {
        const clean = value.replace(/\s+/g, ' ').trim();
        if (shadowMap[clean]) return shadowMap[clean];
        return `shadow-[${clean.replace(/\s+/g, '_')}]`;
    }

    // 4. margin, padding, width, height, font-size, ...
    const prefix = tailwindPrefixMap[prop];
    if (prefix) {
        // تبدیل مقدار به عدد متناظر
        const mapped = spacingMap[value] || value;
        return `${prefix}-${mapped}`;
    }

    // 5. color / background-color
    if (prop === 'color') {
        const mapped = colorMap[value] || value;
        return `text-${mapped}`;
    }
    if (prop === 'background-color') {
        const mapped = colorMap[value] || value;
        return `bg-${mapped}`;
    }

    // 6. حالت arbitrary
    return `[${prop}:${value.replace(/\s+/g, '_')}]`;
}

// ---------- نگاشت‌ها (همان قبلی + موارد جدید) ----------
const tailwindExactMap: Record<string, string> = {
    'display: flex': 'flex',
    'display: none': 'hidden',
    'text-align: center': 'text-center',
    'text-transform: uppercase': 'uppercase',
    'align-items: center': 'items-center',
    'justify-content: space-between': 'justify-between',
    'cursor: pointer': 'cursor-pointer',
    'font-weight: 500': 'font-medium',
    'font-weight: 600': 'font-semibold',
};

const tailwindPrefixMap: Record<string, string> = {
    'margin': 'm', 'margin-top': 'mt', 'margin-right': 'mr', 'margin-bottom': 'mb', 'margin-left': 'ml',
    'padding': 'p', 'padding-top': 'pt', 'padding-right': 'pr', 'padding-bottom': 'pb', 'padding-left': 'pl',
    'font-size': 'text', 'line-height': 'leading',
    'border-radius': 'rounded',
    'transition': 'transition',
};


/**
 * تبدیل SCSS به CSS (باز کردن تودرتویی‌ها - نسخه پایه)
 * برای پروژه‌های بزرگ پیشنهاد می‌شود از پکیج رسمی `sass` استفاده شود.
 */
let worker: Worker | null = null;

export async function convertScssToCss(scss: string): Promise<string> {
    return new Promise((resolve, reject) => {
        // اگر worker نداریم، بساز
        if (!worker) {
            worker = new Worker('/main/workers/scssToCss.worker.js');

            // مدیریت خطای worker
            worker.onerror = (error) => {
                console.error('Worker error:', error);
                reject(new Error('Worker failed to load'));
            };
        }

        // timeout برای جلوگیری از hang
        const timeout = setTimeout(() => {
            reject(new Error('SCSS compilation timeout'));
        }, 10000);

        // دریافت نتیجه
        worker.onmessage = (event) => {
            clearTimeout(timeout);
            const { success, css, error } = event.data;

            if (success) {
                resolve(css);
            } else {
                reject(new Error(error || 'Compilation failed'));
            }
        };

        // ارسال SCSS به worker
        worker.postMessage({ scss });
    });
}

// برای cleanup (اختیاری)
export function terminateScssToCssWorker() {
    if (worker) {
        worker.terminate();
        worker = null;
    }
}




interface CssNode {
    rules: Record<string, string>;
    children: Record<string, CssNode>;
}

/**
 * پارس کردن کد CSS و تبدیل آن به یک درخت جاوااسکریپتی
 */
function parseCSS(css: string): Record<string, CssNode> {
    const tree: Record<string, CssNode> = {};

    // حذف کامنت‌های CSS
    const cleanCss = css.replace(/\/\*[\s\S]*?\*\//g, '');

    // پیدا کردن بلاک‌های CSS
    const blockRegex = /([^{]+)\s*\{\s*([^}]+)\s*\}/g;
    let match;

    while ((match = blockRegex.exec(cleanCss)) !== null) {
        const selectors = match[1].split(',').map(s => s.trim());
        const rulesString = match[2];

        // استخراج پراپرتی‌ها و مقادیر
        const rules: Record<string, string> = {};
        rulesString.split(';').forEach(rule => {
            const [key, ...valueParts] = rule.split(':');
            if (key && valueParts.length > 0) {
                rules[key.trim()] = valueParts.join(':').trim();
            }
        });

        // ساختاردهی درختی بر اساس سلکتورها
        selectors.forEach(selector => {
            const parts = selector.split(/\s+/).filter(Boolean);
            const rootSelector = parts[0];

            if (!tree[rootSelector]) {
                tree[rootSelector] = { rules: {}, children: {} };
            }

            if (parts.length === 1) {
                // اختصاص استایل به خود عنصر والد
                Object.assign(tree[rootSelector].rules, rules);
            } else {
                // ایجاد تودرتویی برای عناصر فرزند
                const childSelector = parts.slice(1).join(' ');
                const scssChildSelector = `& ${childSelector}`;

                if (!tree[rootSelector].children[scssChildSelector]) {
                    tree[rootSelector].children[scssChildSelector] = { rules: {}, children: {} };
                }
                Object.assign(tree[rootSelector].children[scssChildSelector].rules, rules);
            }
        });
    }

    return tree;
}

/**
 * تبدیل درخت ساخته شده به متن فرمت‌بندی شده‌ی SCSS
 */
function exportObject(tree: Record<string, CssNode>, indentLevel = 0): string {
    let result = '';
    const indent = '  '.repeat(indentLevel);
    const childIndent = '  '.repeat(indentLevel + 1);

    for (const [selector, node] of Object.entries(tree)) {
        result += `${indent}${selector} {\n`;

        // چاپ قوانین
        for (const [prop, value] of Object.entries(node.rules)) {
            result += `${childIndent}${prop}: ${value};\n`;
        }

        // چاپ تودرتویی‌های فرزندان
        const childrenKeys = Object.keys(node.children);
        if (childrenKeys.length > 0) {
            if (Object.keys(node.rules).length > 0) result += '\n';
            result += exportObject(node.children, indentLevel + 1);
        }

        result += `${indent}}\n\n`;
    }

    return result.trim();
}

/**
 * تابع اصلی برای تبدیل CSS به SCSS
 */
export function cssToScss1(css: string): string {
    if (!css || !css.trim()) return '';
    const tree = parseCSS(css);
    return exportObject(tree);
}
// ---------------------------------------------------
// src/lib/tools-transformer/cssTransformers.ts

/**
 * تبدیل CSS به SCSS (نسخهٔ هوشمند با nesting و گروه‌بندی)
 */
// src/lib/tools-transformer/cssTransformers.ts (فقط تابع cssToScss را با این نسخه جایگزین کنید)

/**
 * تبدیل CSS به SCSS (نسخهٔ هوشمند با nesting و پشتیبانی از @media و @keyframes)
 */
// src/lib/tools-transformer/cssTransformers.ts

/**
 * تبدیل CSS به SCSS (نسخهٔ نهایی و تست‌شده)
 */
// src/lib/tools-transformer/cssTransformers.ts

// src/lib/tools-transformer/cssTransformers.ts

import type { CssNode, Rule, Atrule, Declaration } from 'css-tree';

let csstree: typeof import('css-tree') | null = null;

async function getCssTree() {
    if (!csstree) csstree = await import('css-tree');
    return csstree;
}

export async function cssToScss(cssCode: string): Promise<string> {
    if (!cssCode?.trim()) return '';

    try {
        const csstree = await getCssTree();

        // پارس CSS
        const ast = csstree.parse(cssCode, {
            parseValue: true,
            parseCustomProperty: false,
        });

        const scopes = new Map<string, { root: ScopeNode; declsAll: string[] }>();

        // --- تعریف ساختارهای کمکی ---
        interface ScopeNode {
            label: string;
            decls: { prop: string; val: string }[];
            children: Map<string, ScopeNode>;
        }

        function makeNode(label: string): ScopeNode {
            return { label, decls: [], children: new Map() };
        }

        function insertPath(root: ScopeNode, segments: string[], decls: { prop: string; val: string }[]) {
            let cur = root;
            for (const seg of segments) {
                if (!cur.children.has(seg)) cur.children.set(seg, makeNode(seg));
                cur = cur.children.get(seg)!;
            }
            const map = new Map(cur.decls.map(d => [d.prop, d.val]));
            for (const d of decls) map.set(d.prop, d.val);
            cur.decls = Array.from(map, ([prop, val]) => ({ prop, val }));
        }

        function splitSelectorToSegments(selector: string): string[] {
            const parts = selector.trim().split(/(\s*[>+~]\s*|\s+)/).filter(Boolean);
            const segs: string[] = [];
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
                    }
                    pendingComb = '';
                    if (/^[:]{1,2}/.test(seg)) seg = `&${seg}`;
                    segs.push(seg);
                }
            }
            return segs;
        }

        function selectorListToArray(prelude: CssNode): string[] {
            const selText = csstree.generate(prelude);
            const sl = csstree.parse(selText, { context: 'selectorList' });
            const arr: string[] = [];
            sl.children.forEach((sel: CssNode) => arr.push(csstree.generate(sel)));
            return arr;
        }

        function getScopeKey(node: CssNode | null): string {
            if (!node) return 'root';
            if (node.type === 'Atrule' && (node as Atrule).name) {
                const prelude = (node as Atrule).prelude ? csstree.generate((node as Atrule).prelude!).trim() : '';
                return `@${(node as Atrule).name} ${prelude}`.trim();
            }
            return 'root';
        }

        // --- پردازش AST ---
        for (const node of ast.children) {
            if (node.type === 'Rule') {
                const scopeKey = 'root';
                if (!scopes.has(scopeKey)) scopes.set(scopeKey, { root: makeNode('ROOT'), declsAll: [] });
                const scope = scopes.get(scopeKey)!;

                const selectors = selectorListToArray((node as Rule).prelude);
                const decls: { prop: string; val: string }[] = [];
                for (const child of (node as Rule).block.children) {
                    if (child.type === 'Declaration') {
                        const d = child as Declaration;
                        decls.push({ prop: d.property, val: csstree.generate(d.value) });
                        scope.declsAll.push(csstree.generate(d.value));
                    }
                }
                for (const sel of selectors) {
                    const segs = splitSelectorToSegments(sel);
                    insertPath(scope.root, segs, decls);
                }
            } else if (node.type === 'Atrule' && ((node as Atrule).name === 'media' || (node as Atrule).name === 'supports' || (node as Atrule).name === 'keyframes')) {
                const scopeKey = getScopeKey(node);
                if (!scopes.has(scopeKey)) scopes.set(scopeKey, { root: makeNode('ROOT'), declsAll: [] });
                const scope = scopes.get(scopeKey)!;

                for (const inner of (node as Atrule).block.children) {
                    if (inner.type === 'Rule') {
                        const selectors = selectorListToArray((inner as Rule).prelude);
                        const decls: { prop: string; val: string }[] = [];
                        for (const child of (inner as Rule).block.children) {
                            if (child.type === 'Declaration') {
                                const d = child as Declaration;
                                decls.push({ prop: d.property, val: csstree.generate(d.value) });
                                scope.declsAll.push(csstree.generate(d.value));
                            }
                        }
                        for (const sel of selectors) {
                            const segs = splitSelectorToSegments(sel);
                            insertPath(scope.root, segs, decls);
                        }
                    } else if (inner.type === 'Atrule') {
                        // Keyframes inside? (e.g., from, to)
                        // Simple handling: just append it as a child of scope
                        // For now, we can directly render it later
                    }
                }
            }
        }

        // --- تولید SCSS ---
        const indent = (n: number) => '  '.repeat(n);

        function renderNode(node: ScopeNode, level: number): string {
            let out = '';
            if (node.label && node.label !== 'ROOT') {
                out += `${indent(level)}${node.label} {\n`;
                for (const d of node.decls) {
                    out += `${indent(level + 1)}${d.prop}: ${d.val};\n`;
                }
                for (const child of node.children.values()) {
                    out += renderNode(child, level + 1);
                }
                out += `${indent(level)}}\n`;
            } else {
                for (const child of node.children.values()) {
                    out += renderNode(child, level);
                }
            }
            return out;
        }

        let scssOut = '';

        const rootScope = scopes.get('root');
        if (rootScope) scssOut += renderNode(rootScope.root, 0);

        for (const [key, scope] of scopes.entries()) {
            if (key === 'root') continue;
            scssOut += `${key} {\n`;
            scssOut += renderNode(scope.root, 1);
            scssOut += `}\n`;
        }

        return scssOut.replace(/\n{3,}/g, "\n\n").trim() + '\n';
    } catch (error) {
        console.error('Error converting CSS to SCSS:', error);
        return cssCode;
    }
}