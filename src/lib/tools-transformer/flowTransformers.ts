// path: src/lib/flowTransformers.ts

/**
 * تبدیل کدهای پیچیده Flow به TypeScript
 */
export async function flowToTs(flowCode: string): Promise<string> {
    if (!flowCode?.trim()) return '';
    // فقط خط // @flow را حذف کن
    return flowCode.replace(/\/\/\s*@flow\s*\n?/g, '');
}

/**
 * تبدیل Flow به کدهای جاوااسکریپت خالص (حذف تایپ‌ها)
 */
export async function flowToJs(flowCode: string): Promise<string> {
    if (!flowCode?.trim()) return '';

    try {
        const babel = await import('@babel/standalone');
        const result = babel.transform(flowCode, {
            filename: 'file.js',
            presets: ['flow'],  // فقط preset flow
            comments: false,
        });
        return result.code?.trim() ?? '';
    } catch {
        return flowCode;
    }
}

/**
 * تبدیل Flow به فایل‌های Type Declaration (.d.ts)
 */
export async function flowToDts(flowCode: string): Promise<string> {
    if (!flowCode?.trim()) return '';

    // ۱. ابتدا کد Flow را به TypeScript تمیز (بدون @flow) تبدیل کن
    let dts = await flowToTs(flowCode);

    // ۲. تبدیل `export const name = ...` یا `export const name: Type = ...`
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

    // ۳. تبدیل `export function name(...) { ... }` به `export declare function name(...): ReturnType;`
    dts = replaceFunctionBody(
        dts,
        /export\s+(async\s+)?function\s+(\w+)\s*\(([^)]*)\)\s*(:\s*([A-Za-z0-9_<>[\]|&,\s]+))?\s*\{/g,
        (match, asyncKw, funcName, params, _, returnType) => {
            const asyncPrefix = asyncKw ? 'async ' : '';
            const retType = returnType ? returnType.trim() : 'any';
            return `export ${asyncPrefix}declare function ${funcName}(${params}): ${retType};`;
        }
    );

    // ۴. حذف بدنهٔ توابع غیر export (در صورت وجود)
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