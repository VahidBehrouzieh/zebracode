// src/lib/tools-transformer/jsonldTransformers.ts
// نسخه کاملاً مستقل – بدون Fetch، بدون کتابخانه jsonld
import * as jsonld from 'jsonld';
// ---------------------- Compact ----------------------
export async function compactJsonLd(input: string, contextInput?: string): Promise<string> {
    if (!input?.trim()) return '';
    try {
        const doc = JSON.parse(input);
        let finalContext: Record<string, any> = {};
        if (doc['@context'] && typeof doc['@context'] === 'object') {
            Object.assign(finalContext, doc['@context']);
        }
        if (contextInput?.trim()) {
            try {
                const ctxObj = JSON.parse(contextInput);
                const secondaryCtx = ctxObj['@context'] || ctxObj;
                if (typeof secondaryCtx === 'object') Object.assign(finalContext, secondaryCtx);
            } catch {
                finalContext = { '@vocab': contextInput.trim(), ...finalContext };
            }
        }
        if (Object.keys(finalContext).length === 0) return JSON.stringify(doc, null, 2);
        const docWithoutContext = { ...doc };
        delete docWithoutContext['@context'];
        const iriToTerm: Record<string, string> = {};
        for (const [term, iri] of Object.entries(finalContext)) {
            if (typeof iri === 'string') iriToTerm[iri] = term;
        }
        const compacted = compactNode(docWithoutContext, iriToTerm);
        compacted['@context'] = finalContext;
        return JSON.stringify(compacted, null, 2);
    } catch (error: any) {
        throw new Error(`Compaction failed: ${error.message}`);
    }
}

function compactNode(node: any, iriToTerm: Record<string, string>): any {
    if (Array.isArray(node)) return node.map(item => compactNode(item, iriToTerm));
    if (typeof node !== 'object' || node === null) return node;
    const result: any = {};
    if (node['@id']) result['@id'] = node['@id'];
    if (node['@type']) result['@type'] = node['@type'];
    for (const key of Object.keys(node)) {
        if (key === '@id' || key === '@type' || key === '@context') continue;
        const shortKey = iriToTerm[key] || key;
        result[shortKey] = compactNode(node[key], iriToTerm);
    }
    return result;
}

// ---------------------- Flatten ----------------------
export async function flattenJsonLd(input: string): Promise<string> {
    if (!input?.trim()) return '';
    try {
        const doc = JSON.parse(input);
        const nodeMap = new Map<string, any>();
        const result: any[] = [];
        function extractNodes(obj: any): any {
            if (typeof obj !== 'object' || obj === null) return obj;
            if (Array.isArray(obj)) return obj.map(item => extractNodes(item));
            const id = obj['@id'];
            if (id) {
                if (nodeMap.has(id)) return { '@id': id };
                const flat: any = { '@id': id };
                nodeMap.set(id, flat);
                result.push(flat);
                if (obj['@type']) flat['@type'] = obj['@type'];
                for (const key of Object.keys(obj)) {
                    if (key === '@id' || key === '@type' || key === '@context') continue;
                    flat[key] = extractNodes(obj[key]);
                }
                return { '@id': id };
            } else {
                const flat: any = {};
                for (const key of Object.keys(obj)) {
                    if (key === '@context') continue;
                    flat[key] = extractNodes(obj[key]);
                }
                return flat;
            }
        }
        extractNodes(doc);
        return JSON.stringify(result, null, 2);
    } catch (error: any) {
        throw new Error(`Flatten failed: ${error.message}`);
    }
}

// ---------------------- Frame (مستقل) ----------------------
export async function frameJsonLd(input: string, frameInput: string = '{}'): Promise<string> {
    if (!input?.trim()) return '';

    try {
        const doc = JSON.parse(input);
        const frame = JSON.parse(frameInput || '{}');

        if (!frame || Object.keys(frame).length === 0) {
            return JSON.stringify(doc, null, 2);
        }

        const context = doc['@context'];
        // اگر سند دارای @graph باشد، گره‌های داخل آن را پردازش کن
        const itemsToFrame = doc['@graph'] || (Array.isArray(doc) ? doc : [doc]);
        let framedResult: any = null;

        for (const item of itemsToFrame) {
            const framed = applyFrame(item, frame);
            if (framed !== null) {
                framedResult = framed;
                break;
            }
        }

        if (framedResult === null) {
            return '{}';
        }

        if (context) {
            framedResult['@context'] = context;
        }

        return JSON.stringify(framedResult, null, 2);
    } catch (error: any) {
        throw new Error(`Frame failed: ${error.message}`);
    }
}

/**
 * اعمال یک Frame روی یک گره از JSON‑LD
 * @param doc گرهٔ فعلی (می‌تواند یک آبجکت یا آرایه باشد)
 * @param frame الگوی Frame (یک آبجکت)
 * @returns گرهٔ فیلترشده یا null در صورت عدم تطابق
 */
function applyFrame(doc: any, frame: any): any {
    // آرایه → روی هر عنصر اعمال کن
    if (Array.isArray(doc)) {
        const results = doc
            .map((item: any) => applyFrame(item, frame))
            .filter((item: any) => item !== null);
        return results.length > 0 ? results : null;
    }

    if (typeof doc !== 'object' || doc === null) return null;

    // اگر Frame دارای @type باشد، فقط گره‌هایی با همان type را نگه دار
    if (frame['@type'] && doc['@type'] !== frame['@type']) {
        return null;
    }

    const result: any = {};
    if (doc['@id']) result['@id'] = doc['@id'];
    if (doc['@type']) result['@type'] = doc['@type'];

    for (const key of Object.keys(frame)) {
        if (key === '@type' || key === '@id' || key === '@context') continue;

        const frameValue = frame[key];
        const docValue = doc[key];

        if (docValue === undefined) continue;

        // اگر frameValue یک آبجکت باشد
        if (typeof frameValue === 'object' && frameValue !== null && !Array.isArray(frameValue)) {
            // **مورد جدید**: اگر frameValue یک آبجکت خالی باشد (`{}`)، کل فیلد را بدون تغییر کپی کن
            if (Object.keys(frameValue).length === 0) {
                result[key] = docValue;
            } else {
                // در غیر این صورت، زیر‑فریم را روی مقدار اعمال کن
                if (Array.isArray(docValue)) {
                    const filtered = docValue
                        .map((item: any) => applyFrame(item, frameValue))
                        .filter((item: any) => item !== null);
                    if (filtered.length > 0) result[key] = filtered;
                } else if (typeof docValue === 'object') {
                    const sub = applyFrame(docValue, frameValue);
                    if (sub !== null) result[key] = sub;
                }
            }
        } else {
            // مقدار ساده یا هر چیز دیگر → کپی کن
            result[key] = docValue;
        }
    }

    return Object.keys(result).length > 0 ? result : null;
}

// ---------------------- N-Quads (مستقل) ----------------------
// ---------------------- N-Quads (نسخه مستقل با پشتیبانی از context) ----------------------
export async function toNQuads(input: string): Promise<string> {
    if (!input?.trim()) return '';

    try {
        const doc = JSON.parse(input);
        const quads: string[] = [];
        let idCounter = 0;
        const context: Record<string, string> = doc['@context'] && typeof doc['@context'] === 'object' ? doc['@context'] : {};

        function resolveIRI(term: string): string {
            // اگر از قبل IRI کامل باشد، همان را برگردان
            if (term.includes('://')) return term;
            // اگر در context باشد، IRI کامل را برگردان
            if (context[term]) return context[term];
            // در غیر این صورت، با یک base فرضی بساز
            return `http://example.org/${term}`;
        }

        function processNode(subject: any, node: any) {
            if (typeof node !== 'object' || node === null) return;
            const s = subject['@id'] || `_:bn${idCounter++}`;

            if (node['@type']) {
                const typeIRI = resolveIRI(node['@type']);
                quads.push(`${s} <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <${typeIRI}> .`);
            }

            for (const key of Object.keys(node)) {
                if (key === '@id' || key === '@type' || key === '@context' || key === '@graph') continue;
                const predicate = resolveIRI(key);
                const values = Array.isArray(node[key]) ? node[key] : [node[key]];
                for (const val of values) {
                    if (typeof val === 'object' && val !== null) {
                        const o = val['@id'] || `_:bn${idCounter++}`;
                        quads.push(`${s} <${predicate}> ${o} .`);
                        processNode({ '@id': o }, val);
                    } else {
                        const literal = typeof val === 'number' ? val : `"${val}"`;
                        quads.push(`${s} <${predicate}> ${literal} .`);
                    }
                }
            }
        }

        const graph = doc['@graph'] || [doc];
        for (const node of graph) processNode({ '@id': doc['@id'] || `_:bn${idCounter++}` }, node);

        return quads.join('\n');
    } catch (error: any) {
        throw new Error(`N-Quads conversion failed: ${error.message}`);
    }
}

// ---------------------- Normalize (مرتب‌سازی Quads) ----------------------
export async function normalizeJsonLd(input: string): Promise<string> {
    if (!input?.trim()) return '';

    try {
        const nquads = await toNQuads(input);
        // مرتب‌سازی خطوط برای خروجی یکنواخت (شبیه canonicalization)
        return nquads.split('\n').sort().join('\n');
    } catch (error: any) {
        throw new Error(`Normalize failed: ${error.message}`);
    }
}