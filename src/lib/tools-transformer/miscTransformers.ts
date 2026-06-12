// path: src/lib/miscTransformers.ts
import yaml from 'js-yaml';
import toml from 'toml';
import tomlify from 'tomlify-j0.4';
import { xml2json } from 'xml-js';
import { marked } from 'marked';

// 1. YAML to JSON
export async function yamlToJson(input: string): Promise<string> {
    if (!input.trim()) return '';
    try {
        const obj = yaml.load(input);
        return JSON.stringify(obj, null, 2);
    } catch (e: any) {
        throw new Error(`خطا در پارس YAML:\n${e.message}`);
    }
}

// 2. YAML to TOML
export async function yamlToToml(input: string): Promise<string> {
    if (!input.trim()) return '';
    try {
        const obj = yaml.load(input);
        const tomlStr = tomlify.toToml(obj, { space: 2 });
        // حذف تورفتگی‌های اضافی قبل از section headerها
        return tomlStr.replace(/^\s+(\[)/gm, '$1');
    } catch (e: any) {
        throw new Error(`خطا در پارس YAML:\n${e.message}`);
    }
}

// 3. TOML to JSON
export async function tomlToJson(input: string): Promise<string> {
    if (!input.trim()) return '';
    try {
        const obj = toml.parse(input);
        return JSON.stringify(obj, null, 2);
    } catch (e: any) {
        throw new Error(`خطا در پارس TOML:\n${e.message}`);
    }
}

// 4. TOML to YAML
export async function tomlToYaml(input: string): Promise<string> {
    if (!input.trim()) return '';
    try {
        const obj = toml.parse(input);
        return yaml.dump(obj, { indent: 2 });
    } catch (e: any) {
        throw new Error(`خطا در پارس TOML:\n${e.message}`);
    }
}

// 5. XML to JSON
export async function xmlToJsonConvert(input: string): Promise<string> {
    if (!input.trim()) return '';
    try {
        return xml2json(input, { compact: true, spaces: 2 });
    } catch (e: any) {
        throw new Error(`خطا در پارس XML:\n${e.message}`);
    }
}

// 6. Markdown to HTML
// src/lib/tools-transformer/miscTransformers.ts

export async function markdownToHtml(input: string): Promise<string> {
    if (!input?.trim()) return '';

    const lines = input
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n');

    const output: string[] = [];
    const blockStack: string[] = [];  // ردیابی بلاک‌های باز (ul, ol, blockquote, table)

    let i = 0;

    function closeBlock(tag: string) {
        while (blockStack.length > 0 && blockStack[blockStack.length - 1] === tag) {
            output.push(`</${tag}>`);
            blockStack.pop();
        }
    }

    function closeAllBlocks() {
        while (blockStack.length > 0) {
            const tag = blockStack.pop()!;
            output.push(`</${tag}>`);
        }
    }

    while (i < lines.length) {
        let line = lines[i];

        // خط خالی → بستن تمام بلاک‌ها
        if (line.trim() === '') {
            closeAllBlocks();
            i++;
            continue;
        }

        // 1. بلوک کد (```)
        if (line.trim().startsWith('```')) {
            closeAllBlocks();
            const lang = line.trim().slice(3).trim();
            i++;
            const codeLines: string[] = [];
            while (i < lines.length && !lines[i].trim().startsWith('```')) {
                codeLines.push(escapeHtml(lines[i]));
                i++;
            }
            if (codeLines.length > 0) {
                output.push(`<pre><code class="language-${lang}">${codeLines.join('\n')}</code></pre>`);
            }
            i++; // رد کردن خط بسته‌کننده ```
            continue;
        }

        // 2. سرفصل‌ها
        const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
        if (headingMatch) {
            closeAllBlocks();
            const level = headingMatch[1].length;
            const text = headingMatch[2];
            output.push(`<h${level}>${formatInline(text)}</h${level}>`);
            i++;
            continue;
        }

        // 3. خط افقی
        if (line.trim() === '---' || line.trim() === '***' || line.trim() === '___') {
            closeAllBlocks();
            output.push('<hr>');
            i++;
            continue;
        }

        // 4. جدول
        if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
            closeBlock('ul');
            closeBlock('ol');
            closeBlock('blockquote');
            const rows: string[][] = [];

            while (i < lines.length && lines[i].trim().startsWith('|')) {
                const cells = lines[i].split('|').filter(c => c.trim()).map(c => c.trim());
                rows.push(cells);
                i++;
            }

            if (rows.length >= 2) {
                let tableHtml = '<table>\n<thead>\n<tr>';
                rows[0].forEach(cell => {
                    tableHtml += `<th>${formatInline(cell)}</th>`;
                });
                tableHtml += '</tr>\n</thead>\n<tbody>\n';

                for (let r = 1; r < rows.length; r++) {
                    // ردیف جداکننده (---|---) را نادیده بگیر
                    if (rows[r].every(c => /^[-:]+$/.test(c))) continue;
                    tableHtml += '<tr>';
                    rows[r].forEach(cell => {
                        tableHtml += `<td>${formatInline(cell)}</td>`;
                    });
                    tableHtml += '</tr>\n';
                }
                tableHtml += '</tbody>\n</table>';
                output.push(tableHtml);
            }
            continue;
        }

        // 5. بلاک‌کووت
        if (line.startsWith('> ')) {
            closeBlock('ul');
            closeBlock('ol');
            if (blockStack[blockStack.length - 1] !== 'blockquote') {
                output.push('<blockquote>');
                blockStack.push('blockquote');
            }
            const text = line.slice(2);
            output.push(`<p>${formatInline(text)}</p>`);
            i++;
            continue;
        }

        // 6. لیست‌های نامرتب
        if (/^[\*\-]\s+/.test(line)) {
            closeBlock('ol');
            if (blockStack[blockStack.length - 1] !== 'ul') {
                output.push('<ul>');
                blockStack.push('ul');
            }
            const text = line.replace(/^[\*\-]\s+/, '');
            output.push(`<li>${formatInline(text)}</li>`);
            i++;
            continue;
        }

        // 7. لیست‌های مرتب
        if (/^\d+\.\s+/.test(line)) {
            closeBlock('ul');
            if (blockStack[blockStack.length - 1] !== 'ol') {
                output.push('<ol>');
                blockStack.push('ol');
            }
            const text = line.replace(/^\d+\.\s+/, '');
            output.push(`<li>${formatInline(text)}</li>`);
            i++;
            continue;
        }

        // 8. پاراگراف عادی
        closeBlock('ul');
        closeBlock('ol');
        closeBlock('blockquote');
        output.push(`<p>${formatInline(line)}</p>`);
        i++;
    }

    // بستن همه بلاک‌های باز
    closeAllBlocks();

    return output.join('\n');
}

// ========= توابع کمکی =========

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function formatInline(text: string): string {
    // کد درون خطی `code`
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold **text**
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic *text*
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // ~~strikethrough~~
    text = text.replace(/~~(.+?)~~/g, '<del>$1</del>');

    // تصاویر ![alt](url)
    text = text.replace(/!\[([^\]]+)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

    // لینک‌ها [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // خط جدید (درون پاراگراف) → <br>
    text = text.replace(/\n/g, '<br>');

    return text;
}

// 7. Cadence to Go (مبدل هوشمند Struct ها)
// src/lib/miscTransformers.ts

// src/lib/tools-transformer/miscTransformers.ts

export async function cadenceToGo(input: string): Promise<string> {
    if (!input?.trim()) return '';

    const structs: string[] = [];
    const activities: string[] = [];
    const workflows: string[] = [];
    const typeMap: Record<string, string> = {
        'int': 'int',
        'string': 'string',
        'bool': 'bool',
        'float64': 'float64',
        'time': 'time.Time',
        'Address': 'string',
    };

    /**
     * استخراج بدنهٔ یک بلاک { ... } با شروع از موقعیت startIndex
     */
    function extractBraceBlock(code: string, startIndex: number): string | null {
        if (code[startIndex] !== '{') return null;
        let depth = 0;
        for (let i = startIndex; i < code.length; i++) {
            if (code[i] === '{') depth++;
            else if (code[i] === '}') depth--;
            if (depth === 0) return code.slice(startIndex + 1, i).trim();
        }
        return null;
    }

    /**
     * استخراج فیلدهای یک struct از یک رشتهٔ متنی
     */
    function parseFields(body: string): string {
        const lines: string[] = [];
        const parts = body.split(/[,\n]/).filter(Boolean);
        for (let part of parts) {
            part = part.trim();
            if (!part) continue;
            const colonIndex = part.indexOf(':');
            if (colonIndex === -1) continue;
            const key = part.substring(0, colonIndex).trim();
            const type = part.substring(colonIndex + 1).trim();
            if (!key || !type) continue;
            const exported = key.charAt(0).toUpperCase() + key.slice(1);
            const goType = typeMap[type] || type;
            lines.push(`\t${exported} ${goType} \`json:"${key}"\``);
        }
        return lines.join('\n');
    }

    // ۱. استخراج struct
    const structRegex = /(?:pub\s+)?struct\s+(\w+)\s*\{/g;
    let match;
    while ((match = structRegex.exec(input)) !== null) {
        const structName = match[1];
        const body = extractBraceBlock(input, match.index + match[0].length - 1);
        if (!body) continue;
        const fields = parseFields(body);
        if (fields) {
            structs.push(`type ${structName} struct {\n${fields}\n}`);
        }
    }

    // ۲. استخراج activity
    const activityRegex = /activity\s+(\w+)\s*\{/g;
    while ((match = activityRegex.exec(input)) !== null) {
        const actName = match[1];
        const body = extractBraceBlock(input, match.index + match[0].length - 1);
        if (!body) continue;

        let inputStruct = 'interface{}';
        const inputMatch = body.match(/input\s*:\s*\{/);
        if (inputMatch) {
            const inputBody = extractBraceBlock(body, body.indexOf('{', body.indexOf('input')));
            if (inputBody) {
                const fields = parseFields(inputBody);
                if (fields) {
                    inputStruct = `struct {\n${fields}\n}`;
                }
            }
        }

        const outputMatch = body.match(/output\s*:\s*(\w+)/);
        const outputType = outputMatch ? (typeMap[outputMatch[1]] || outputMatch[1]) : 'interface{}';

        activities.push(
            `func ${actName}(ctx workflow.Context, input ${inputStruct}) (${outputType}, error) {\n\tvar result ${outputType}\n\t// TODO: implement activity logic\n\treturn result, nil\n}`
        );
    }

    // ۳. استخراج workflow
    const workflowRegex = /workflow\s+(\w+)\s*\{/g;
    while ((match = workflowRegex.exec(input)) !== null) {
        const wfName = match[1];
        const body = extractBraceBlock(input, match.index + match[0].length - 1);
        if (!body) continue;

        let inputStruct = 'interface{}';
        const inputMatch = body.match(/input\s*:\s*\{/);
        if (inputMatch) {
            const inputBody = extractBraceBlock(body, body.indexOf('{', body.indexOf('input')));
            if (inputBody) {
                const fields = parseFields(inputBody);
                if (fields) {
                    inputStruct = `struct {\n${fields}\n}`;
                }
            }
        }

        const outputMatch = body.match(/output\s*:\s*(\w+)/);
        const outputType = outputMatch ? (typeMap[outputMatch[1]] || outputMatch[1]) : 'interface{}';

        // استخراج فراخوانی activity و استفاده از &result
        const stepMatch = body.match(/(\w+)\s*=\s*(\w+)\s*\{([^}]+)\}/);
        let stepCode = '';
        if (stepMatch) {
            const calledAct = stepMatch[2];
            const args = stepMatch[3].split(',').filter(Boolean).map(a => {
                const [key, value] = a.split(':').map(s => s.trim());
                return `input.${key.charAt(0).toUpperCase() + key.slice(1)}`;
            }).join(', ');
            stepCode = `\terr := workflow.ExecuteActivity(ctx, ${calledAct}, ${args}).Get(ctx, &result)\n\tif err != nil {\n\t\treturn ${outputType}{}, err\n\t}\n`;
        }

        workflows.push(
            `func ${wfName}(ctx workflow.Context, input ${inputStruct}) (${outputType}, error) {\n\tvar result ${outputType}\n${stepCode}\treturn result, nil\n}`
        );
    }

    // ۴. ترکیب خروجی
    let goCode = '';
    if (structs.length > 0) goCode += structs.join('\n\n') + '\n\n';
    if (activities.length > 0) goCode += activities.join('\n\n') + '\n\n';
    if (workflows.length > 0) goCode += workflows.join('\n\n') + '\n\n';

    if (!goCode.trim()) {
        return '// No valid Cadence struct, activity, or workflow found.';
    }

    return `package main\n\nimport (\n\t"go.temporal.io/sdk/workflow"\n)\n\n${goCode.trim()}`;
}