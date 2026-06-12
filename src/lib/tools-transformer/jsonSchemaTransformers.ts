// path: src/lib/jsonSchemaTransformers.ts

/**
 * تبدیل JSON Schema به TypeScript Interfaces
 */
export async function jsonSchemaToTs(schemaStr: string): Promise<string> {
    try {
        const schema = JSON.parse(schemaStr);
        let interfaces = '';

        function parseNode(name: string, node: any, isExport = false): string {
            if (node.$ref) return node.$ref.split('/').pop();

            if (node.enum) {
                const enumValues = node.enum.map((e: any) => typeof e === 'string' ? `"${e}"` : e).join(' | ');
                return enumValues;
            }

            if (node.anyOf || node.allOf || node.oneOf) {
                const items = node.anyOf || node.allOf || node.oneOf;
                const separator = node.allOf ? ' & ' : ' | ';
                return items.map((i: any) => parseNode('', i)).join(separator);
            }

            switch (node.type) {
                case 'string': return 'string';
                case 'number':
                case 'integer': return 'number';
                case 'boolean': return 'boolean';
                case 'array':
                    const itemType = node.items ? parseNode('', node.items) : 'any';
                    return `${itemType}[]`;
                case 'object':
                    let props = '';
                    if (node.properties) {
                        for (const key in node.properties) {
                            const isRequired = node.required && node.required.includes(key);
                            const propType = parseNode(key, node.properties[key]);
                            props += `  ${key}${isRequired ? '' : '?'}: ${propType};\n`;
                        }
                    } else if (node.additionalProperties) {
                        return `Record<string, ${parseNode('', node.additionalProperties)}>`;
                    } else {
                        return 'Record<string, any>';
                    }
                    if (name && isExport) {
                        interfaces += `export interface ${name} {\n${props}}\n\n`;
                        return name;
                    }
                    return `{\n${props}}`;
                default:
                    return 'any';
            }
        }

        const rootName = schema.title || 'Root';
        parseNode(rootName, schema, true);

        // پردازش Definitions ($defs یا definitions)
        const defs = schema.$defs || schema.definitions;
        if (defs) {
            for (const key in defs) {
                parseNode(key, defs[key], true);
            }
        }

        return interfaces.trim() || 'export interface Root {}';
    } catch (e: any) {
        throw new Error(`خطا در پارس JSON Schema:\n${e.message}`);
    }
}

/**
 * تبدیل JSON Schema به اعتبارسنج‌های Zod
 */
export async function jsonSchemaToZod(schemaCode: string): Promise<string> {
    if (!schemaCode?.trim()) return '';

    try {
        const schema = JSON.parse(schemaCode);
        const definitions: Record<string, any> = schema.$defs || schema.definitions || {};
        const allSchemas: Record<string, any> = { main: schema, ...definitions };
        const output: string[] = [];
        const generated = new Set<string>();

        output.push(`import { z } from 'zod';`);
        output.push('');

        // ابتدا تعاریف جانبی ($defs) را تولید کن
        for (const [name, def] of Object.entries(definitions)) {
            if (generated.has(name)) continue;
            output.push(generateZodSchema(def, name, allSchemas, generated, true));
            output.push(`export type ${name} = z.infer<typeof ${name}Schema>;`);
            output.push('');
        }

        // حالا schema اصلی
        const mainName = schema.title || 'MainSchema';
        output.push(generateZodSchema(schema, mainName, allSchemas, generated, true));
        output.push(`export type ${mainName} = z.infer<typeof ${mainName}Schema>;`);

        return output.join('\n');
    } catch (error: any) {
        throw new Error(`Zod conversion failed: ${error.message}`);
    }
}

function generateZodSchema(
    schema: any,
    name: string,
    allSchemas: Record<string, any>,
    generated: Set<string>,
    topLevel: boolean
): string {
    if (generated.has(name)) return '';
    generated.add(name);

    const lines: string[] = [];
    const description = schema.description || schema.title || '';
    if (description) lines.push(`/** ${description} */`);

    if (schema.enum) {
        const values = schema.enum.map((v: string) => `"${v}"`).join(' | ');
        const enumName = name + 'Enum';
        lines.push(`export const ${enumName} = z.enum([${schema.enum.map((v: string) => `"${v}"`).join(', ')}]);`);
        if (topLevel) {
            lines.push(`export type ${name} = z.infer<typeof ${enumName}>;`);
        }
        return lines.join('\n');
    }

    if (schema.type === 'array') {
        const itemType = schema.items ? resolveType(schema.items, allSchemas, generated) : 'z.any()';
        const arraySchema = `z.array(${itemType})`;
        if (topLevel) {
            lines.push(`export const ${name}Schema = ${arraySchema};`);
            lines.push(`export type ${name} = z.infer<typeof ${name}Schema>;`);
        } else {
            lines.push(`export const ${name}Schema = ${arraySchema};`);
        }
        return lines.join('\n');
    }

    if (schema.type === 'object' || schema.properties) {
        const required = schema.required || [];
        const props = schema.properties || {};
        const additional = schema.additionalProperties === undefined ? true : schema.additionalProperties;

        const shapeLines: string[] = [];
        for (const [key, prop] of Object.entries(props)) {
            const isRequired = required.includes(key);
            const propSchema = resolveType(prop, allSchemas, generated);
            const modifiers = buildModifiers(prop);
            const optional = isRequired ? '' : '.optional()';
            shapeLines.push(`  ${key}: ${propSchema}${modifiers}${optional},`);
        }

        const schemaName = `${name}Schema`;
        lines.push(`export const ${schemaName} = z.object({`);
        lines.push(shapeLines.join('\n'));
        lines.push(`})${additional === false ? '.strict()' : ''};`);

        return lines.join('\n');
    }

    return '';
}

function resolveType(prop: any, allSchemas: Record<string, any>, generated: Set<string>): string {
    if (prop.$ref) {
        const refName = prop.$ref.split('/').pop()!;
        if (allSchemas[refName] && !generated.has(refName)) {
            // بازگشت برای تولید schema ارجاع‌شده (فقط در صورت لزوم)
            generateZodSchema(allSchemas[refName], refName, allSchemas, generated, true);
        }
        return `${refName}Schema`;
    }

    if (prop.enum) {
        const enumName = (prop.title || 'Enum') + 'Enum';
        if (!generated.has(enumName)) {
            generated.add(enumName);
            // enum به‌صورت جداگانه تولید نمی‌شود، مستقیماً اینجا inline می‌کنیم
        }
        const values = prop.enum.map((v: string) => `"${v}"`).join(', ');
        return `z.enum([${values}])`;
    }

    const typeMap: Record<string, string> = {
        string: 'z.string()',
        integer: 'z.number().int()',
        number: 'z.number()',
        boolean: 'z.boolean()',
        array: prop.items ? `z.array(${resolveType(prop.items, allSchemas, generated)})` : 'z.array(z.any())',
        object: 'z.record(z.string(), z.any())',
    };

    return typeMap[prop.type] || 'z.any()';
}

function buildModifiers(prop: any): string {
    const parts: string[] = [];

    if (prop.readOnly) parts.push('.readonly()');
    if (prop.minLength !== undefined) parts.push(`.min(${prop.minLength})`);
    if (prop.maxLength !== undefined) parts.push(`.max(${prop.maxLength})`);
    if (prop.minimum !== undefined) parts.push(`.min(${prop.minimum})`);
    if (prop.maximum !== undefined) parts.push(`.max(${prop.maximum})`);
    if (prop.format === 'email') parts.push('.email()');
    if (prop.format === 'url') parts.push('.url()');
    if (prop.format === 'uuid') parts.push('.uuid()');
    if (prop.default !== undefined) parts.push(`.default(${JSON.stringify(prop.default)})`);

    return parts.join('');
}

/**
 * تبدیل JSON Schema به OpenAPI 3.0 Schema
 */
export async function jsonSchemaToOpenApi(schemaCode: string): Promise<string> {
    if (!schemaCode?.trim()) return '';

    try {
        const schema = JSON.parse(schemaCode);

        // ۱. حذف $schema و $id
        delete schema.$schema;
        delete schema.$id;

        // ۲. انتقال $defs به components/schemas و اصلاح $refها
        if (schema.$defs) {
            schema.components = { schemas: { ...schema.$defs } };
            delete schema.$defs;

            // اصلاح $refها در کل سند
            const updatedSchema = JSON.parse(
                JSON.stringify(schema).replace(
                    /"#\/\$defs\/(\w+)"/g,
                    '"#/components/schemas/$1"'
                )
            );
            return JSON.stringify(updatedSchema, null, 2);
        }

        return JSON.stringify(schema, null, 2);
    } catch (error: any) {
        throw new Error(`OpenAPI conversion failed: ${error.message}`);
    }
}

/**
 * تبدیل JSON Schema به Protobuf (Protocol Buffers v3)
 */
export async function jsonSchemaToProtobuf(schemaCode: string): Promise<string> {
    if (!schemaCode?.trim()) return '';

    try {
        const schema = JSON.parse(schemaCode);
        const messages: string[] = [];
        const generated = new Map<string, any>();

        const mainName = schema.title || 'Main';
        generateProtobufMessage(schema, mainName, messages, generated);

        return `syntax = "proto3";\n\n${messages.join('\n\n')}`;
    } catch (error: any) {
        throw new Error(`Protobuf conversion failed: ${error.message}`);
    }
}

function generateProtobufMessage(
    schema: any,
    name: string,
    messages: string[],
    generated: Map<string, any>
): string {
    if (generated.has(name)) return name;
    generated.set(name, schema);

    const required = schema.required || [];
    const props = schema.properties || {};
    const lines: string[] = [];

    // توضیحات
    if (schema.description) {
        lines.push(`// ${schema.description}`);
    }

    lines.push(`message ${name} {`);
    let fieldNumber = 1;

    for (const [key, prop] of Object.entries(props)) {
        const isRequired = required.includes(key);
        const optional = isRequired ? '' : 'optional ';
        const { protoType, nestedName } = resolveProtoType(prop, key, name, messages, generated);
        const desc = prop.description ? `// ${prop.description}\n  ` : '';

        lines.push(`${desc}${optional}${protoType} ${key} = ${fieldNumber};`);
        fieldNumber++;
    }

    lines.push('}');
    messages.push(lines.join('\n'));
    return name;
}

function resolveProtoType(
    prop: any,
    key: string,
    parentName: string,
    messages: string[],
    generated: Map<string, any>
): { protoType: string; nestedName?: string } {
    if (prop.$ref) {
        const refName = prop.$ref.split('/').pop()!;
        return { protoType: refName };
    }

    if (prop.type === 'array') {
        if (prop.items) {
            const item = resolveProtoType(prop.items, key, parentName, messages, generated);
            return { protoType: `repeated ${item.protoType}` };
        }
        return { protoType: 'repeated string' };
    }

    if (prop.type === 'object' || prop.properties) {
        const nestedName = `${parentName}${capitalize(key)}`;
        if (!generated.has(nestedName)) {
            const nestedSchema = { ...prop, title: nestedName };
            generateProtobufMessage(nestedSchema, nestedName, messages, generated);
        }
        return { protoType: nestedName };
    }

    if (prop.enum) {
        // برای سادگی string
        return { protoType: 'string' };
    }

    const typeMap: Record<string, string> = {
        string: 'string',
        integer: 'int32',
        number: 'double',
        boolean: 'bool',
    };

    return { protoType: typeMap[prop.type] || 'string' };
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}