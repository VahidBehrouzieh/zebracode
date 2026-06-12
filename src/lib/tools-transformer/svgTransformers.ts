// path: src/lib/svgTransformers.ts

/**
 * تبدیل SVG به React JSX (وب)
 */
export async function svgToJsx(svg: string): Promise<string> {
    if (typeof window === 'undefined' || !svg.trim()) return '';

    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');

    // بررسی خطای پارس در SVG
    if (doc.querySelector('parsererror')) {
        throw new Error('کد وارد شده یک SVG معتبر نیست. لطفاً تگ‌ها را بررسی کنید.');
    }

    function nodeToJsx(node: Element, indentLevel: number): string {
        const indent = '  '.repeat(indentLevel);
        const tagName = node.tagName.toLowerCase();
        let props = '';

        Array.from(node.attributes).forEach(attr => {
            let name = attr.name;
            let value = attr.value;

            // تبدیل Attribute های خاص به JSX
            if (name === 'class') name = 'className';
            else if (name === 'for') name = 'htmlFor';
            // مدیریت استایل‌های خطی
            else if (name === 'style') {
                const styleObj = value.split(';').reduce((acc: any, rule) => {
                    const [k, v] = rule.split(':');
                    if (k && v) {
                        const camelK = k.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
                        acc[camelK] = v.trim();
                    }
                    return acc;
                }, {});
                value = `{${JSON.stringify(styleObj)}}`;
                props += ` style=${value}`;
                return;
            }
            // تبدیل camelCase برای ویژگی‌های SVG (مثل stroke-width -> strokeWidth)
            else if (name.includes('-') && !name.startsWith('data-') && !name.startsWith('aria-')) {
                name = name.replace(/-([a-z])/g, g => g[1].toUpperCase());
            }
            // هندل کردن Namespace ها (مثل xmlns:xlink -> xmlnsXlink یا xlink:href -> xlinkHref)
            else if (name.includes(':')) {
                name = name.replace(/:([a-z])/g, g => g[1].toUpperCase());
            }

            // اگر فقط تگ root (svg) است، props سفارشی هم اضافه می‌کنیم
            if (tagName === 'svg' && name === 'xmlns') return; // حذف xmlns اضافه

            props += ` ${name}="${value.replace(/"/g, '&quot;')}"`;
        });

        if (tagName === 'svg') props += ' {...props}';

        const children = Array.from(node.children);
        if (children.length === 0) {
            return `${indent}<${tagName}${props} />\n`;
        }

        let childrenJsx = '';
        children.forEach(child => {
            childrenJsx += nodeToJsx(child, indentLevel + 1);
        });

        return `${indent}<${tagName}${props}>\n${childrenJsx}${indent}</${tagName}>\n`;
    }

    const root = doc.documentElement;
    const jsxContent = nodeToJsx(root, 2);

    return `import React from 'react';\n\nexport default function SvgIcon(props) {\n  return (\n${jsxContent}  );\n}`;
}

/**
 * تبدیل SVG به React Native (کتابخانه react-native-svg)
 */
export async function svgToReactNative(svg: string): Promise<string> {
    if (typeof window === 'undefined' || !svg.trim()) return '';

    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');

    if (doc.querySelector('parsererror')) {
        throw new Error('کد وارد شده یک SVG معتبر نیست.');
    }

    const usedTags = new Set<string>();

    function capitalize(str: string) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function nodeToRN(node: Element, indentLevel: number): string {
        const indent = '  '.repeat(indentLevel);
        let tagName = capitalize(node.tagName);
        if (tagName.toLowerCase() === 'svg') tagName = 'Svg';

        usedTags.add(tagName);

        let props = '';
        Array.from(node.attributes).forEach(attr => {
            let name = attr.name;
            let value = attr.value;

            // در RN SVG کلاس و استایل‌های خطی پیچیده معمولاً ساپورت نمی‌شوند
            if (name === 'class' || name === 'xmlns') return;

            // تبدیل camelCase
            if (name.includes('-') && !name.startsWith('data-')) {
                name = name.replace(/-([a-z])/g, g => g[1].toUpperCase());
            } else if (name.includes(':')) {
                name = name.replace(/:([a-z])/g, g => g[1].toUpperCase());
            }

            props += ` ${name}="${value.replace(/"/g, '&quot;')}"`;
        });

        if (tagName === 'Svg') props += ' {...props}';

        const children = Array.from(node.children);
        if (children.length === 0) {
            return `${indent}<${tagName}${props} />\n`;
        }

        let childrenJsx = '';
        children.forEach(child => {
            childrenJsx += nodeToRN(child, indentLevel + 1);
        });

        return `${indent}<${tagName}${props}>\n${childrenJsx}${indent}</${tagName}>\n`;
    }

    const root = doc.documentElement;
    const rnContent = nodeToRN(root, 2);

    // ساخت هوشمند Import ها فقط برای تگ‌های استفاده شده
    const importTags = Array.from(usedTags).filter(t => t !== 'Svg').join(', ');
    let imports = `import React from 'react';\nimport Svg${importTags ? `, { ${importTags} }` : ''} from 'react-native-svg';\n\n`;

    return `${imports}export default function SvgIcon(props) {\n  return (\n${rnContent}  );\n}`;
}