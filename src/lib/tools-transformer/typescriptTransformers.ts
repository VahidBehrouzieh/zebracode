// path: src/lib/typescriptTransformers.ts

/**
 * 1. تبدیل TypeScript به JavaScript (حذف تایپ‌ها)
 */
export async function tsToJs(tsCode: string): Promise<string> {
    if (!tsCode?.trim()) return '';

    try {
        const babel = await import('@babel/standalone');
        const result = babel.transform(tsCode, {
            filename: 'file.ts',  // ← این خط اضافه شد
            presets: [['typescript', { onlyRemoveTypeImports: true }]],
            comments: false,
        });
        return result.code?.trim() ?? '';
    } catch {
        return tsCode;
    }
}
/**
 * 2. تبدیل TypeScript به Flow Types
 */

export async function tsToFlow(tsCode: string): Promise<string> {
    if (!tsCode) return '';

    const interfaces: Array<{ name: string; body: string; start: number; end: number }> = [];
    const regex = /interface\s+(\w+)\s*\{/g;
    let match;

    // 1. استخراج تمام اینترفیس‌ها و موقعیت آن‌ها
    while ((match = regex.exec(tsCode)) !== null) {
        const name = match[1];
        const startIndex = match.index + match[0].length - 1; // موقعیت '{'
        let depth = 1;
        let i = startIndex + 1;
        for (; i < tsCode.length && depth > 0; i++) {
            if (tsCode[i] === '{') depth++;
            else if (tsCode[i] === '}') depth--;
        }
        interfaces.push({
            name,
            body: tsCode.slice(startIndex + 1, i - 1), // محتوای داخل { }
            start: match.index,
            end: i,
        });
    }

    // 2. تبدیل هر اینترفیس به type Flow (از آخر به اول)
    let result = tsCode;
    for (let idx = interfaces.length - 1; idx >= 0; idx--) {
        const iface = interfaces[idx];
        const lines = iface.body.split('\n');

        // پیدا کردن حداقل تورفتگی (برای nested objects)
        let minIndent = Infinity;
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            const indent = line.length - line.trimStart().length;
            if (indent < minIndent) minIndent = indent;
        }

        const flowBody = lines
            .map(line => {
                const trimmed = line.trim();
                if (!trimmed) return '';

                // حفظ تورفتگی نسبی
                const currentIndent = line.length - line.trimStart().length;
                const relativeIndent = currentIndent - minIndent;
                const baseIndent = '  '.repeat(relativeIndent + 1); // 1 سطح پایه + نسبی

                let processed = trimmed
                    .replace(/readonly\s+/g, '')               // حذف readonly
                    .replace(/;$/, ',')                        // ; → ,
                    .replace(/: Array<([^>]+)>/g, ': $1[]')     // Array<T> → T[]
                    .replace(/: Record<string,\s*([^>]+)>/g, ': { [key: string]: $1 }'); // Record → index signature

                // اضافه کردن تورفتگی مناسب
                return baseIndent + processed;
            })
            .filter(Boolean)
            .join('\n');

        const flowType = `type ${iface.name} = {|\n${flowBody}\n|};`;
        result = result.slice(0, iface.start) + flowType + result.slice(iface.end);
    }

    return `// @flow\n\n${result}`;
}

/**
 * 3. تبدیل TypeScript به Zod Schemas
 */
export async function tsToZod(tsCode: string): Promise<string> {
    if (!tsCode) return '';
    let zodCode = `import { z } from "zod";\n\n`;

    const interfaceRegex = /(?:export\s+)?(?:interface|type)\s+(\w+)(?:<[^>]+>)?\s*(?:=\s*)?\{([^}]+)\}/g;
    let match;

    while ((match = interfaceRegex.exec(tsCode)) !== null) {
        const name = match[1];
        const body = match[2];
        let zodSchema = `export const ${name}Schema = z.object({\n`;

        const lines = body.split(/\n|;/).filter(line => line.trim().length > 0);
        lines.forEach(prop => {
            const cleanedProp = prop.replace(/\/\/.*$/, '').trim();
            const propMatch = cleanedProp.match(/^\s*(readonly\s+)?(\w+)(\?)?\s*:\s*(.+)$/);
            if (!propMatch) return;

            const key = propMatch[2];
            const isOptional = !!propMatch[3];
            let typeStr = propMatch[4].trim();
            let zType = 'z.any()';

            const unionMatch = typeStr.match(/^'([^']+)'\s*\|\s*'([^']+)'(\s*\|\s*'([^']+)')?$/);
            if (unionMatch) {
                const values = [unionMatch[1], unionMatch[2]];
                if (unionMatch[4]) values.push(unionMatch[4]);
                zType = `z.enum([${values.map(v => `"${v}"`).join(', ')}])`;
            } else if (typeStr === 'string') {
                zType = 'z.string()';
            } else if (typeStr === 'number') {
                zType = 'z.number().int()';
            } else if (typeStr === 'boolean') {
                zType = 'z.boolean()';
            } else if (typeStr.endsWith('[]')) {
                const inner = typeStr.replace('[]', '');
                const innerZod = inner === 'string' ? 'z.string()' : inner === 'number' ? 'z.number()' : 'z.any()';
                zType = `z.array(${innerZod})`;
            } else if (/^Array<(.+)>$/.test(typeStr)) {
                const inner = typeStr.replace(/^Array<(.+)>$/, '$1');
                const innerZod = inner === 'string' ? 'z.string()' : inner === 'number' ? 'z.number()' : 'z.any()';
                zType = `z.array(${innerZod})`;
            }

            if (isOptional) zType += '.optional()';
            zodSchema += `  ${key}: ${zType},\n`;
        });

        zodSchema += `});\n\nexport type ${name} = z.infer<typeof ${name}Schema>;\n\n`;
        zodCode += zodSchema;
    }

    return zodCode.trim() || '// هیچ Interface یا Typeای برای تبدیل یافت نشد.';
}

/**
 * 4. تبدیل TypeScript به JSON Schema
 */
export async function tsToJsonSchema(tsCode: string): Promise<string> {
    if (!tsCode) return '';

    const schema: any = {
        $schema: "http://json-schema.org/draft-07/schema#",
        definitions: {}
    };

    // 1. استخراج JSDoc برای فیلدها (کل کد)
    const fieldDescriptions: Record<string, string> = {};
    const jsdocRegex = /\/\*\*\s*\n?\s*\*\s*(.+?)\s*\n?\s*\*\/\s*\n?\s*(\w+)\??\s*:/g;
    let jsdocMatch;
    while ((jsdocMatch = jsdocRegex.exec(tsCode)) !== null) {
        fieldDescriptions[jsdocMatch[2]] = jsdocMatch[1].trim();
    }

    // 2. استخراج interface ها
    const interfaceRegex = /(?:export\s+)?(?:interface|type)\s+(\w+)\s*(?:=\s*)?\{([^}]+)\}/g;
    let match;
    const typeNames: string[] = [];

    while ((match = interfaceRegex.exec(tsCode)) !== null) {
        const name = match[1];
        const body = match[2];
        typeNames.push(name);

        const properties: any = {};
        const required: string[] = [];

        const lines = body.split(/;|\n/).filter(line => line.trim().length > 0);
        lines.forEach(prop => {
            const cleanedProp = prop.replace(/\/\/.*$/, '').trim();
            const propMatch = cleanedProp.match(/^\s*(readonly\s+)?(\w+)(\?)?\s*:\s*(.+)$/);
            if (!propMatch) return;

            const key = propMatch[2];
            const isOptional = !!propMatch[3];
            let typeStr = propMatch[4].trim();

            if (!isOptional) required.push(key);

            // Union literal type
            const unionMatch = typeStr.match(/^'([^']+)'\s*\|\s*'([^']+)'(\s*\|\s*'([^']+)')?$/);
            if (unionMatch) {
                const values = [unionMatch[1], unionMatch[2]];
                if (unionMatch[4]) values.push(unionMatch[4]);
                properties[key] = { type: 'string', enum: values };
                return;
            }

            if (typeStr === 'string') properties[key] = { type: 'string' };
            else if (typeStr === 'number') properties[key] = { type: 'number' };
            else if (typeStr === 'boolean') properties[key] = { type: 'boolean' };
            else if (typeStr.endsWith('[]')) {
                const inner = typeStr.replace('[]', '');
                const itemType = inner === 'string' ? { type: 'string' }
                    : inner === 'number' ? { type: 'number' }
                        : { type: 'object' };
                properties[key] = { type: 'array', items: itemType };
            } else if (/^[A-Z]\w*$/.test(typeStr)) {
                properties[key] = { $ref: `#/definitions/${typeStr}` };
            } else {
                properties[key] = { type: 'string' }; // fallback
            }
        });

        // اعمال JSDoc
        for (const [field, desc] of Object.entries(fieldDescriptions)) {
            if (properties[field]) {
                properties[field].description = desc;
            }
        }

        schema.definitions[name] = {
            type: "object",
            properties,
            ...(required.length > 0 && { required })
        };
    }

    // $ref به آخرین نوع (اصلی)
    if (typeNames.length > 0) {
        schema.$ref = `#/definitions/${typeNames[typeNames.length - 1]}`;
    }

    return JSON.stringify(schema, null, 2);
}

/**
 * 5. تولید TypeScript Declaration (.d.ts)
 */
export async function tsToDts(tsCode: string): Promise<string> {
    if (!tsCode?.trim()) return '';

    let dts = tsCode;

    // ۱. تبدیل `export const name = ...` یا `export const name: Type = ...`
    dts = dts.replace(
        /export\s+const\s+(\w+)\s*(:\s*([A-Za-z0-9_<>[\]|&,\s]+))?\s*=\s*([^;]+);/g,
        (match, varName, _, explicitType, value) => {
            let type: string;
            if (explicitType) {
                type = explicitType.trim();
            } else {
                // حدس نوع از روی مقدار اولیه
                const trimmedValue = value.trim();
                if (trimmedValue === 'true' || trimmedValue === 'false') {
                    type = 'boolean';
                } else if (/^-?\d+(\.\d+)?$/.test(trimmedValue)) {
                    type = 'number';
                } else {
                    type = 'string';
                }
            }
            return `export declare const ${varName}: ${type};`;
        }
    );

    // ۲. تبدیل `export function name(...) { ... }` به `export declare function name(...): ReturnType;`
    dts = replaceFunctionBody(
        dts,
        /export\s+(async\s+)?function\s+(\w+)\s*\(([^)]*)\)\s*(:\s*([A-Za-z0-9_<>[\]|&,\s]+))?\s*\{/g,
        (match, asyncKw, funcName, params, _, returnType) => {
            const asyncPrefix = asyncKw ? 'async ' : '';
            const retType = returnType ? returnType.trim() : 'any';
            return `export ${asyncPrefix}declare function ${funcName}(${params}): ${retType};`;
        }
    );

    // ۳. حذف بدنهٔ توابع غیر export
    dts = replaceFunctionBody(
        dts,
        /(async\s+)?function\s+(\w+)\s*\(([^)]*)\)\s*(:\s*([A-Za-z0-9_<>[\]|&,\s]+))?\s*\{/g,
        (match, asyncKw, funcName, params, _, returnType) => {
            return `declare function ${funcName}(${params}): ${returnType ? returnType.trim() : 'any'};`;
        }
    );

    return dts.trim();
}

function replaceFunctionBody(
    code: string,
    startRegex: RegExp,
    replacementFn: (match: string, ...groups: string[]) => string
): string {
    const result: string[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = startRegex.exec(code)) !== null) {
        result.push(code.slice(lastIndex, match.index));

        const bodyStart = startRegex.lastIndex;
        let depth = 1;
        let i = bodyStart;
        while (i < code.length && depth > 0) {
            if (code[i] === '{') depth++;
            else if (code[i] === '}') depth--;
            i++;
        }
        lastIndex = i;
        const replacement = replacementFn(match[0], ...match.slice(1));
        result.push(replacement);
    }

    result.push(code.slice(lastIndex));
    return result.join('');
}