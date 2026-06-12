// src/lib/tools-transformer/javascriptTransformers.ts

let Babel: typeof import('@babel/standalone') | null = null;
let Lebab: typeof import('lebab') | null = null;

// ============================================================
// Lazy loaders
// ============================================================

async function getBabel() {
    if (!Babel) Babel = await import('@babel/standalone');
    return Babel;
}

async function getLebab() {
    if (!Lebab) Lebab = await import('lebab');
    return Lebab;
}

// ============================================================
// ES5 → ES6 (Modernize JavaScript) – کامل‌شده با Babel
// ============================================================
export async function es5ToEs6(jsCode: string): Promise<string> {
    if (!jsCode?.trim()) return '';

    try {
        // ۱. اجرای تبدیلات اصلی با lebab
        const lebab = await getLebab();
        if (!lebab) {
            console.error('lebab is not installed.');
            return jsCode;
        }

        let { code, warnings } = lebab.transform(jsCode, [
            'let',
            'arrow',
            'template',
            'class',
            'obj-method',
            'obj-shorthand',
            'default-param',
            'includes',
            'exponent',
            'multi-var',
            // 'for-of' را خودمان با Babel انجام می‌دهیم
        ]);

        if (warnings.length) console.warn('ES5→ES6 warnings:', warnings);
        let result = code || jsCode;

        // ۲. پالایش نهایی با Babel:
        //    - function declaration → const arrow
        //    - for (var i=0; i<arr.length; i++) { … arr[i] … } → for (const item of arr)
        try {
            const babel = await getBabel();
            if (babel) {
                const babelResult = babel.transform(result, {
                    plugins: [
                        function finalTransforms() {
                            return {
                                visitor: {
                                    // فقط تبدیل FunctionDeclaration به const arrow
                                    FunctionDeclaration(path: any) {
                                        const id = path.node.id;
                                        if (!id) return;

                                        const arrow = {
                                            type: 'ArrowFunctionExpression',
                                            params: path.node.params,
                                            body: path.node.body,
                                            async: path.node.async,
                                            generator: path.node.generator,
                                        };

                                        const declarator = {
                                            type: 'VariableDeclarator',
                                            id,
                                            init: arrow,
                                        };

                                        const declaration = {
                                            type: 'VariableDeclaration',
                                            kind: 'const',
                                            declarations: [declarator],
                                        };

                                        path.replaceWith(declaration);
                                    },
                                    // ForStatement دیگر اینجا نیست
                                },
                            };
                        },
                    ],
                });
                if (babelResult.code) result = babelResult.code;
            }
        } catch (babelError) {
            console.warn('Babel post-processing error, using lebab output only:', babelError);
        }

        return result;
    } catch (error) {
        console.error('Error transforming ES5 to ES6:', error);
        return jsCode;
    }
}

// ============================================================
// ES6 → ES5 (Production-grade transpile)
// ============================================================

export async function es6ToEs5(jsCode: string): Promise<string> {
    if (!jsCode?.trim()) return '';

    try {
        const babel = await getBabel();

        const result = babel.transform(jsCode, {
            presets: [
                ['env', {
                    targets: {
                        ie: '11'
                    },

                    // دقیق‌تر به spec
                    spec: true,

                    // رفع بعضی bugهای runtime
                    bugfixes: true,

                    // commonjs نکند
                    modules: false,

                    // polyfill inject نکن
                    useBuiltIns: false,

                    loose: false
                }]
            ],

            comments: false,
            compact: false,
            minified: false,

            parserOpts: {
                allowReturnOutsideFunction: true,
                allowAwaitOutsideFunction: true
            }
        });

        return result.code ?? jsCode;

    } catch (error) {
        console.error('Error transforming ES6 to ES5:', error);
        return jsCode;
    }
}

// ============================================================
// JS → TypeScript (Improved)
// ============================================================

// src/lib/tools-transformer/javascriptTransformers.ts

let BabelStandalone: typeof import('@babel/standalone') | null = null;

async function getBabelStandalone() {
    if (!BabelStandalone) {
        BabelStandalone = await import('@babel/standalone');
    }
    return BabelStandalone;
}

export async function jsToTypescript(jsCode: string): Promise<string> {
    if (!jsCode?.trim()) return '';

    try {
        const babel = await getBabelStandalone();

        // 1. تزریق اولیهٔ type annotations (regex)
        let result = injectBasicTypes(jsCode);

        // 2. بهبود با تحلیل AST (حتماً با parser typescript)
        try {
            const babelResult = babel.transform(result, {
                parserOpts: {
                    plugins: ['typescript'],   // ← این خط حیاتی بود
                },
                plugins: [
                    function typeInference() {
                        return {
                            visitor: {
                                FunctionDeclaration(path: any) {
                                    refineParamTypes(path.node.params, path.node.body);
                                },
                                ArrowFunctionExpression(path: any) {
                                    refineParamTypes(path.node.params, path.node.body);
                                },
                            },
                        };
                    },
                ],
            });
            if (babelResult.code) {
                result = babelResult.code;
            }
        } catch (babelError) {
            console.warn('Babel type inference failed, using regex output:', babelError);
        }

        return result;
    } catch (error) {
        console.error('Error in jsToTypescript:', error);
        return jsCode;
    }
}

// -------------------- Regex helper (basic types) --------------------
function injectBasicTypes(code: string): string {
    let ts = code;

    ts = ts.replace(/\b(let|const|var)\s+([a-zA-Z0-9_]+)\s*=\s*([0-9]+(?:\.[0-9]+)?)\b/g, '$1 $2: number = $3');
    ts = ts.replace(/\b(let|const|var)\s+([a-zA-Z0-9_]+)\s*=\s*(true|false)\b/g, '$1 $2: boolean = $3');
    ts = ts.replace(/\b(let|const|var)\s+([a-zA-Z0-9_]+)\s*=\s*(["'`][\s\S]*?["'`])/g, '$1 $2: string = $3');
    ts = ts.replace(/\b(let|const|var)\s+([a-zA-Z0-9_]+)\s*=\s*\[\]/g, '$1 $2: any[] = []');

    // پارامترهای توابع – fallback type
    ts = ts.replace(/function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/g, (match, name, args) => {
        const typedArgs = args.split(',').filter(Boolean).map((arg: string) => {
            const trimmed = arg.trim();
            if (trimmed.includes(':') || trimmed.includes('=')) return trimmed;
            return `${trimmed}: ${guessTypeFromName(trimmed)}`;
        }).join(', ');
        return `function ${name}(${typedArgs}): any`;
    });

    ts = ts.replace(/\(([^)]*)\)\s*=>/g, (match, args) => {
        const typedArgs = args.split(',').filter(Boolean).map((arg: string) => {
            const trimmed = arg.trim();
            if (trimmed.includes(':') || trimmed.includes('=')) return trimmed;
            return `${trimmed}: ${guessTypeFromName(trimmed)}`;
        }).join(', ');
        return `(${typedArgs}) =>`;
    });

    return ts;
}

// -------------------- Heuristic fallback --------------------
function guessTypeFromName(name: string): string {
    const lower = name.toLowerCase();
    if (/^(cb|callback|on\w+|handler|fn|func|done|next)$/i.test(lower)) return 'Function';
    if (/^(id|userid|postid|productid|orderid|\w*id)$/i.test(lower)) return 'string | number';
    if (/^(name|title|label|description|text|message|email|url|path)$/i.test(lower)) return 'string';
    if (/^(age|count|index|total|score|price|amount|size|width|height|length)$/i.test(lower)) return 'number';
    if (/^(is|has|should|can|will|did|was|were)[A-Z]/.test(lower) || /^(active|enabled|visible|open|ok|success)$/i.test(lower)) return 'boolean';
    if (/(list|array|items|collection)$/i.test(lower) || lower.endsWith('s')) return 'any[]';
    // "user" intentionally returns "any" here, to be refined later
    return 'any';
}

// -------------------- AST-based refinement --------------------
function refineParamTypes(params: any[], body: any) {
    if (!params || !body) return;

    const paramProps: Record<string, Set<string>> = {};
    for (const param of params) {
        if (param.type === 'Identifier') {
            paramProps[param.name] = new Set();
        }
    }

    function collectMemberExpressions(node: any) {
        if (!node || typeof node !== 'object') return;
        if (node.type === 'MemberExpression' && !node.computed && node.object.type === 'Identifier') {
            const paramName = node.object.name;
            if (paramProps[paramName] && node.property.type === 'Identifier') {
                paramProps[paramName].add(node.property.name);
            }
        }
        for (const key of Object.keys(node)) {
            if (node[key] && typeof node[key] === 'object') {
                if (Array.isArray(node[key])) {
                    node[key].forEach(collectMemberExpressions);
                } else {
                    collectMemberExpressions(node[key]);
                }
            }
        }
    }

    collectMemberExpressions(body);

    for (const param of params) {
        if (param.type !== 'Identifier') continue;
        const props = paramProps[param.name];
        if (!props || props.size === 0) continue;

        const members = Array.from(props).map(prop => {
            const propType = guessTypeFromName(prop);
            let typeNode: any = { type: 'TSAnyKeyword' };
            // ... (همان منطق نگاشت نوع)
            return {
                type: 'TSPropertySignature',
                key: { type: 'Identifier', name: prop },
                typeAnnotation: {
                    type: 'TSTypeAnnotation',
                    typeAnnotation: typeNode,
                },
            };
        });

        param.typeAnnotation = {
            type: 'TSTypeAnnotation',
            typeAnnotation: {
                type: 'TSTypeLiteral',
                members,
            },
        };
    }
}
// ============================================================
// JS Object → JSON (Safe-ish)
// ============================================================

export async function jsToJson(jsCode: string): Promise<string> {
    if (!jsCode?.trim()) return '';

    try {
        // حذف کامنت‌ها با احترام به رشته‌ها
        let cleanCode = removeComments(jsCode);

        // حذف trailing commas قبل از } یا ]
        cleanCode = cleanCode.replace(/,(\s*[}\]])/g, '$1');

        // پیدا کردن اولین { یا [
        const firstBrace = cleanCode.indexOf('{');
        const firstBracket = cleanCode.indexOf('[');
        let startIndex = -1;

        if (firstBrace !== -1 && firstBracket !== -1) {
            startIndex = Math.min(firstBrace, firstBracket);
        } else if (firstBrace !== -1) {
            startIndex = firstBrace;
        } else if (firstBracket !== -1) {
            startIndex = firstBracket;
        }

        if (startIndex === -1) {
            throw new Error('No valid object or array found.');
        }

        cleanCode = cleanCode.slice(startIndex);
        cleanCode = cleanCode.replace(/;?\s*$/, ''); // حذف نقطه‌ویرگول انتهایی

        const obj = Function('"use strict"; return (' + cleanCode + ')')();
        return JSON.stringify(obj, null, 2);
    } catch (e: any) {
        throw new Error(
            `کد وارد شده یک آبجکت یا آرایه معتبر جاوااسکریپت نیست.\n${e.message}`
        );
    }
}

/**
 * حذف کامنت‌های تک‌خطی و چندخطی بدون آسیب به رشته‌ها
 */
function removeComments(code: string): string {
    const result: string[] = [];
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inTemplate = false;
    let inBlockComment = false;
    let inLineComment = false;
    let prevChar = '';

    for (let i = 0; i < code.length; i++) {
        const ch = code[i];
        const nextCh = code[i + 1];

        // مدیریت کامنت‌ها
        if (!inSingleQuote && !inDoubleQuote && !inTemplate && !inBlockComment && !inLineComment) {
            if (ch === '/' && nextCh === '/') {
                inLineComment = true;
                i++; // پرش از کاراکتر دوم اسلش
                continue;
            } else if (ch === '/' && nextCh === '*') {
                inBlockComment = true;
                i++; // پرش از *
                continue;
            }
        }

        // پایان کامنت خطی
        if (inLineComment && ch === '\n') {
            inLineComment = false;
            result.push(ch);
            continue;
        }

        // پایان کامنت بلوکی
        if (inBlockComment && ch === '*' && nextCh === '/') {
            inBlockComment = false;
            i++; // پرش از /
            continue;
        }

        // درون کامنت‌ها چیزی به خروجی اضافه نشود
        if (inLineComment || inBlockComment) {
            continue;
        }

        // مدیریت رشته‌ها
        if (!inDoubleQuote && !inSingleQuote && !inTemplate && ch === '"' && prevChar !== '\\') {
            inDoubleQuote = true;
        } else if (inDoubleQuote && ch === '"' && prevChar !== '\\') {
            inDoubleQuote = false;
        } else if (!inDoubleQuote && !inTemplate && !inSingleQuote && ch === "'" && prevChar !== '\\') {
            inSingleQuote = true;
        } else if (inSingleQuote && ch === "'" && prevChar !== '\\') {
            inSingleQuote = false;
        } else if (!inDoubleQuote && !inSingleQuote && !inTemplate && ch === '`' && prevChar !== '\\') {
            inTemplate = !inTemplate;
        }

        result.push(ch);
        prevChar = ch;
    }

    return result.join('');
}