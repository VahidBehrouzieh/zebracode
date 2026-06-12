// path: src/lib/htmlTransformers.ts

export async function htmlToJsx(html: string): Promise<string> {
    if (typeof window === 'undefined' || !html.trim()) return '';

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    function parseNodeToJsx(node: ChildNode, indentLevel: number): string {
        const indent = '  '.repeat(indentLevel);

        // متن
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim();
            return text ? `${indent}${text}\n` : '';
        }

        // کامنت
        if (node.nodeType === Node.COMMENT_NODE) {
            const comment = node.textContent?.trim();
            return `${indent}{/* ${comment} */}\n`;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            const tagName = el.tagName.toLowerCase();
            let props = '';

            Array.from(el.attributes).forEach(attr => {
                let name = attr.name;
                let value = attr.value;

                // class → className
                if (name === 'class') {
                    name = 'className';
                }
                // for → htmlFor
                else if (name === 'for') {
                    name = 'htmlFor';
                }
                // tabindex → tabIndex (مقدار عددی باید داخل {} قرار گیرد)
                else if (name === 'tabindex') {
                    props += ` tabIndex={${value}}`;
                    return;
                }
                // onclick → onClick, onchange → onChange, …
                else if (/^on[a-z]/.test(name)) {
                    const jsxName = name.replace(/^on([a-z])/, (_, c) => `on${c.toUpperCase()}`);
                    props += ` ${jsxName}={${value}}`;
                    return;
                }
                // style اینلاین → object
                else if (name === 'style') {
                    const styleObj = value.split(';').reduce((acc: any, rule) => {
                        const [k, ...v] = rule.split(':');
                        if (k && v.length) {
                            const camelK = k.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
                            acc[camelK] = v.join(':').trim();
                        }
                        return acc;
                    }, {});
                    props += ` style={${JSON.stringify(styleObj)}}`;
                    return;
                }
                // ویژگی‌های SVG یا هر چیز با خط تیره (به جز data-* و aria-*)
                else if (name.includes('-') && !name.startsWith('data-') && !name.startsWith('aria-')) {
                    name = name.replace(/-([a-z])/g, g => g[1].toUpperCase());
                }

                // مقدار boolean (attribute بدون مقدار)
                if (value === '') {
                    props += ` ${name}`;
                } else {
                    props += ` ${name}="${value.replace(/"/g, '&quot;')}"`;
                }
            });

            // تگ‌های self-closing
            const voidElements = [
                'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
                'link', 'meta', 'param', 'source', 'track', 'wbr',
                'path', 'circle', 'rect', 'line', 'polygon', 'polyline',
            ];
            if (voidElements.includes(tagName)) {
                return `${indent}<${tagName}${props} />\n`;
            }

            let childrenJsx = '';
            Array.from(el.childNodes).forEach(child => {
                childrenJsx += parseNodeToJsx(child, indentLevel + 1);
            });

            return `${indent}<${tagName}${props}>\n${childrenJsx}${indent}</${tagName}>\n`;
        }
        return '';
    }

    let jsxContent = '';
    Array.from(doc.body.childNodes).forEach(child => {
        jsxContent += parseNodeToJsx(child, 2);
    });

    return `export default function MyComponent() {\n  return (\n    <>\n${jsxContent}    </>\n  );\n}`;
}


export async function htmlToPugConvert(html: string): Promise<string> {
    if (typeof window === 'undefined' || !html.trim()) return '';

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // لیست تگ‌های void (self‑closing) در HTML
    const voidElements = [
        'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
        'link', 'meta', 'param', 'source', 'track', 'wbr',
        'path', 'circle', 'rect', 'line', 'polygon', 'polyline',
    ];

    function parseNodeToPug(node: ChildNode, indentLevel: number): string {
        const indent = '  '.repeat(indentLevel);

        // متن
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim();
            if (!text) return '';
            // هر خط را با | پیشوند دهید
            return text.split('\n').map(line => `${indent}| ${line.trim()}`).join('\n') + '\n';
        }

        // کامنت HTML → کامنت Pug (مرئي)
        if (node.nodeType === Node.COMMENT_NODE) {
            const comment = node.textContent?.trim();
            if (!comment) return '';
            return `${indent}// ${comment}\n`;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            const tag = el.tagName.toLowerCase();

            // شروع خط با تگ
            let line = indent + tag;

            // id
            if (el.id) line += `#${el.id}`;

            // classها
            if (el.className && typeof el.className === 'string') {
                const classes = el.className.trim().split(/\s+/).filter(Boolean).join('.');
                if (classes) line += `.${classes}`;
            }

            // attributes (به‌جز id و class)
            const attrs: string[] = [];
            Array.from(el.attributes).forEach(attr => {
                if (attr.name === 'id' || attr.name === 'class') return;
                // در Pug مقادیر با کوتیشن دوتایی یا تکی نوشته می‌شوند
                attrs.push(`${attr.name}="${attr.value.replace(/"/g, '\\"')}"`);
            });

            if (attrs.length > 0) {
                line += `(${attrs.join(', ')})`;
            }

            // اگر تگ void باشد، آن را با اسلش ببندیم (اختیاری، اما واضح‌تر)
            if (voidElements.includes(tag)) {
                return line + '\n';
            }

            // در غیر این صورت، محتوای فرزندان را اضافه کن
            line += '\n';
            Array.from(el.childNodes).forEach(child => {
                line += parseNodeToPug(child, indentLevel + 1);
            });

            return line;
        }
        return '';
    }

    // تشخیص اینکه آیا کل داکیومنت HTML داریم یا فقط یک قطعه
    const hasHtmlTag = doc.querySelector('html') !== null;
    let pugOutput = '';

    if (hasHtmlTag) {
        // اضافه کردن doctype
        pugOutput += 'doctype html\n';
        const htmlEl = doc.documentElement!;
        // ویژگی‌های تگ html (مانند lang)
        const htmlAttrs: string[] = [];
        Array.from(htmlEl.attributes).forEach(attr => {
            htmlAttrs.push(`${attr.name}="${attr.value}"`);
        });
        pugOutput += `html${htmlAttrs.length ? '(' + htmlAttrs.join(', ') + ')' : ''}\n`;

        // پردازش فرزندان <html> (یعنی <head> و <body>)
        Array.from(htmlEl.childNodes).forEach(child => {
            pugOutput += parseNodeToPug(child, 1);
        });
    } else {
        // فقط محتوای body (اگر body وجود داشته باشد، فرزندان آن؛ در غیر این صورت خود ورودی)
        const body = doc.body;
        if (body && body.childNodes.length > 0) {
            Array.from(body.childNodes).forEach(child => {
                pugOutput += parseNodeToPug(child, 0);
            });
        } else {
            // اگر body هم خالی بود، کل محتوای پرشده را پردازش کن
            Array.from(doc.childNodes).forEach(child => {
                pugOutput += parseNodeToPug(child, 0);
            });
        }
    }

    return pugOutput.trim();
}