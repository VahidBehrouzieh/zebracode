// path: src/lib/advancedGraphqlTransformers.ts
import { parse, buildSchema, introspectionFromSchema, GraphQLSchema, GraphQLObjectType, GraphQLInterfaceType, GraphQLInputObjectType, GraphQLEnumType, GraphQLUnionType, GraphQLScalarType, GraphQLNonNull, GraphQLList, isSpecifiedScalarType } from 'graphql';

export type GraphqlTarget =
    | 'typescript'
    | 'flow'
    | 'java'
    | 'typescript-mongodb'
    | 'components'
    | 'resolvers-signature'
    | 'schema-ast'
    | 'introspection-json'
    | 'fragment-matcher';

// src/lib/advancedGraphqlTransformers.ts

// تابع کمکی جدید برای پاک‌سازی اسکیما
function sanitizeGraphQLSchema(schemaCode: string): string {
    return schemaCode
        .split('\n')
        .filter(line => !/^\s*(\/\/|#)/.test(line)) // حذف خطوطی که با // یا # شروع می‌شوند
        .join('\n');
}

export async function advancedGraphqlTransform(gql: string, target: GraphqlTarget): Promise<string> {
    if (!gql || !gql.trim()) return '';

    try {
        // ۱. پاک‌سازی اولیه
        let cleanGql = gql.split('\n').filter(line => !/^\s*(\/\/|#)/.test(line)).join('\n');
        // ۲. اضافه کردن scalar JSON
        cleanGql = ensureScalars(cleanGql);

        const ast = parse(cleanGql, { noLocation: true });

        switch (target) {
            case 'schema-ast':
                return JSON.stringify(ast, null, 2);

            case 'introspection-json':
                const schema = buildSchema(cleanGql);
                const introspection = introspectionFromSchema(schema);
                return JSON.stringify(introspection, null, 2);

            case 'fragment-matcher':
                const schemaFM = buildSchema(cleanGql);
                const typeMap = schemaFM.getTypeMap();
                const fragmentTypes: { kind: string; name: string; possibleTypes: { name: string }[] }[] = [];

                for (const [name, type] of Object.entries(typeMap)) {
                    if (name.startsWith('__')) continue;

                    if (type instanceof GraphQLInterfaceType || type instanceof GraphQLUnionType) {
                        let possibleTypes: GraphQLObjectType[] = [];

                        if (type instanceof GraphQLInterfaceType) {
                            possibleTypes = schemaFM.getPossibleTypes(type);
                        } else if (type instanceof GraphQLUnionType) {
                            possibleTypes = type.getTypes();
                        }

                        fragmentTypes.push({
                            kind: type instanceof GraphQLInterfaceType ? 'INTERFACE' : 'UNION',
                            name,
                            possibleTypes: possibleTypes.map(t => ({ name: t.name })),
                        });
                    }
                }

                return JSON.stringify({ __schema: { types: fragmentTypes } }, null, 2);

            case 'typescript':
                return generateTypescript(cleanGql);

            case 'flow':
                // حالا از کتابخانه برای تبدیل دقیق استفاده می‌کنیم
                return generateFlow(cleanGql);

            case 'java':
                return generateJava(cleanGql);

            case 'typescript-mongodb':
                return generateMongoDb(cleanGql);

            case 'resolvers-signature':
                return generateResolvers(cleanGql);

            case 'components':
                return generateReactComponents(cleanGql);

            default:
                return 'Target not supported yet.';
        }
    } catch (error: any) {
        throw new Error(`خطای پردازش GraphQL:\n${error.message}`);
    }
}

function ensureScalars(schemaCode: string): string {
    if (!/scalar JSON\b/.test(schemaCode)) {
        return `scalar JSON\n${schemaCode}`;
    }
    return schemaCode;
}

// ================= Helpers =================

function generateTypescript(gql: string): string {
    try {
        const schema = buildSchema(gql);
        return convertSchemaToTypescript(schema);
    } catch (error) {
        console.warn('buildSchema failed for TypeScript, falling back to regex:', error);
        return generateTypescriptFallback(gql);
    }
}

function convertSchemaToTypescript(schema: GraphQLSchema): string {
    let output = '';
    const typeMap = schema.getTypeMap();

    // ۱. Scalars سفارشی
    const customScalars: string[] = [];
    for (const [name, type] of Object.entries(typeMap)) {
        if (name.startsWith('__')) continue;
        if (type instanceof GraphQLScalarType && !isSpecifiedScalarType(type)) {
            customScalars.push(name);
        }
    }
    if (customScalars.length > 0) {
        output += '/* Custom Scalars */\n';
        for (const name of customScalars) {
            output += `type ${name} = string;\n`;
        }
        output += '\n';
    }

    // ۲. Enumها
    for (const [name, type] of Object.entries(typeMap)) {
        if (name.startsWith('__')) continue;
        if (type instanceof GraphQLEnumType) {
            const values = type.getValues().map(v => `'${v.value}'`).join(' | ');
            output += `export type ${name} = ${values};\n\n`;
        }
    }

    // ۳. Interfaceها
    for (const [name, type] of Object.entries(typeMap)) {
        if (name.startsWith('__')) continue;
        if (type instanceof GraphQLInterfaceType) {
            output += `export interface ${name} {\n`;
            const fields = type.getFields();
            for (const [fieldName, field] of Object.entries(fields)) {
                const tsType = graphqlTypeToTsType(field.type);
                output += `  ${fieldName}${field.args.length > 0 ? `(${field.args.map(a => `${a.name}${a.defaultValue !== undefined ? '?' : ''}: ${graphqlTypeToTsType(a.type)}`).join(', ')})` : ''}: ${tsType};\n`;
            }
            output += `}\n\n`;
        }
    }

    // ۴. Object Typeها
    for (const [name, type] of Object.entries(typeMap)) {
        if (name.startsWith('__')) continue;
        if (type instanceof GraphQLObjectType) {
            const interfaces = type.getInterfaces();
            const extendsClause = interfaces.length > 0 ? ` extends ${interfaces.map(i => i.name).join(', ')}` : '';

            output += `export interface ${name}${extendsClause} {\n`;
            const fields = type.getFields();
            for (const [fieldName, field] of Object.entries(fields)) {
                const tsType = graphqlTypeToTsType(field.type);
                output += `  ${fieldName}${field.args.length > 0 ? `(${field.args.map(a => `${a.name}${a.defaultValue !== undefined ? '?' : ''}: ${graphqlTypeToTsType(a.type)}`).join(', ')})` : ''}: ${tsType};\n`;
            }
            output += `}\n\n`;
        }
    }

    // ۵. Input Objectها
    for (const [name, type] of Object.entries(typeMap)) {
        if (name.startsWith('__')) continue;
        if (type instanceof GraphQLInputObjectType) {
            output += `export interface ${name} {\n`;
            const fields = type.getFields();
            for (const [fieldName, field] of Object.entries(fields)) {
                const tsType = graphqlTypeToTsType(field.type);
                output += `  ${fieldName}${field.defaultValue !== undefined ? '?' : ''}: ${tsType};\n`;
            }
            output += `}\n\n`;
        }
    }

    // ۶. Unionها
    for (const [name, type] of Object.entries(typeMap)) {
        if (name.startsWith('__')) continue;
        if (type instanceof GraphQLUnionType) {
            const types = type.getTypes().map(t => t.name).join(' | ');
            output += `export type ${name} = ${types};\n\n`;
        }
    }

    return output.trim() + '\n';
}

function graphqlTypeToTsType(type: any): string {
    if (type instanceof GraphQLNonNull) {
        return graphqlTypeToTsType(type.ofType);
    }

    if (type instanceof GraphQLList) {
        const inner = graphqlTypeToTsType(type.ofType);
        return `${inner}[]`;
    }

    if (type instanceof GraphQLScalarType) {
        const name = type.name;
        const map: Record<string, string> = {
            'String': 'string',
            'Int': 'number',
            'Float': 'number',
            'Boolean': 'boolean',
            'ID': 'string',
        };
        return map[name] || name;
    }

    if (
        type instanceof GraphQLEnumType ||
        type instanceof GraphQLObjectType ||
        type instanceof GraphQLInterfaceType ||
        type instanceof GraphQLUnionType ||
        type instanceof GraphQLInputObjectType
    ) {
        return type.name;
    }

    return 'any';
}

function generateTypescriptFallback(ts: string): string {
    // همان کد regex قدیمی شما (نسخهٔ fallback)
    let code = ts;
    code = code.replace(/type\s+(\w+)\s*\{/g, 'export interface $1 {\n');
    code = code.replace(/input\s+(\w+)\s*\{/g, 'export interface $1Input {\n');
    code = code.replace(/:\s*\[(\w+)!?\]!/g, ': $1[];');
    code = code.replace(/:\s*\[(\w+)!?\]/g, '?: $1[];');
    code = code.replace(/:\s*ID!/g, ': string;');
    code = code.replace(/:\s*ID(?!!)/g, '?: string;');
    code = code.replace(/:\s*String!/g, ': string;');
    code = code.replace(/:\s*String(?!!)/g, '?: string;');
    code = code.replace(/:\s*Int!|:\s*Float!/g, ': number;');
    code = code.replace(/:\s*Int(?!!)|:\s*Float(?!!)/g, '?: number;');
    code = code.replace(/:\s*Boolean!/g, ': boolean;');
    code = code.replace(/:\s*Boolean(?!!)/g, '?: boolean;');
    code = code.replace(/:\s*(\w+)!/g, ': $1;');
    code = code.replace(/:\s*(\w+)(?!\[|!|;)/g, '?: $1;');
    return code;
}

function generateMongoDb(gql: string): string {
    try {
        const schema = buildSchema(gql);
        return convertSchemaToTypescriptMongo(schema);
    } catch (error) {
        console.warn('buildSchema failed for MongoDB, falling back to regex:', error);
        return generateMongoDbFallback(gql);
    }
}

function convertSchemaToTypescriptMongo(schema: GraphQLSchema): string {
    const header = `import { ObjectId } from 'mongodb';\n\n`;
    let output = header;
    const typeMap = schema.getTypeMap();

    // ۱. Scalars سفارشی
    const customScalars: string[] = [];
    for (const [name, type] of Object.entries(typeMap)) {
        if (name.startsWith('__')) continue;
        if (type instanceof GraphQLScalarType && !isSpecifiedScalarType(type)) {
            customScalars.push(name);
        }
    }
    if (customScalars.length > 0) {
        output += '/* Custom Scalars */\n';
        for (const name of customScalars) {
            output += `type ${name} = string;\n`;
        }
        output += '\n';
    }

    // ۲. Enumها
    for (const [name, type] of Object.entries(typeMap)) {
        if (name.startsWith('__')) continue;
        if (type instanceof GraphQLEnumType) {
            const values = type.getValues().map(v => `'${v.value}'`).join(' | ');
            output += `export type ${name} = ${values};\n\n`;
        }
    }

    // ۳. Interfaceها
    for (const [name, type] of Object.entries(typeMap)) {
        if (name.startsWith('__')) continue;
        if (type instanceof GraphQLInterfaceType) {
            output += `export interface ${name} {\n`;
            const fields = type.getFields();
            for (const [fieldName, field] of Object.entries(fields)) {
                const tsType = graphqlTypeToTsMongoType(field.type, fieldName);
                const optional = !(field.type instanceof GraphQLNonNull) ? '?' : '';
                output += `  ${fieldName}${optional}${field.args.length > 0 ? `(${field.args.map(a => `${a.name}${a.defaultValue !== undefined ? '?' : ''}: ${graphqlTypeToTsMongoType(a.type, a.name)}`).join(', ')})` : ''}: ${tsType};\n`;
            }
            output += `}\n\n`;
        }
    }

    // ۴. Object Typeها
    for (const [name, type] of Object.entries(typeMap)) {
        if (name.startsWith('__')) continue;
        if (type instanceof GraphQLObjectType) {
            const interfaces = type.getInterfaces();
            const extendsClause = interfaces.length > 0 ? ` extends ${interfaces.map(i => i.name).join(', ')}` : '';

            output += `export interface ${name}${extendsClause} {\n`;
            const fields = type.getFields();
            for (const [fieldName, field] of Object.entries(fields)) {
                const tsType = graphqlTypeToTsMongoType(field.type, fieldName);
                const optional = !(field.type instanceof GraphQLNonNull) ? '?' : '';
                output += `  ${fieldName}${optional}${field.args.length > 0 ? `(${field.args.map(a => `${a.name}${a.defaultValue !== undefined ? '?' : ''}: ${graphqlTypeToTsMongoType(a.type, a.name)}`).join(', ')})` : ''}: ${tsType};\n`;
            }
            output += `}\n\n`;
        }
    }

    // ۵. Input Objectها
    for (const [name, type] of Object.entries(typeMap)) {
        if (name.startsWith('__')) continue;
        if (type instanceof GraphQLInputObjectType) {
            output += `export interface ${name} {\n`;
            const fields = type.getFields();
            for (const [fieldName, field] of Object.entries(fields)) {
                const tsType = graphqlTypeToTsMongoType(field.type, fieldName);
                const optional = (field.defaultValue !== undefined || !(field.type instanceof GraphQLNonNull)) ? '?' : '';
                output += `  ${fieldName}${optional}: ${tsType};\n`;
            }
            output += `}\n\n`;
        }
    }

    // ۶. Unionها
    for (const [name, type] of Object.entries(typeMap)) {
        if (name.startsWith('__')) continue;
        if (type instanceof GraphQLUnionType) {
            const types = type.getTypes().map(t => t.name).join(' | ');
            output += `export type ${name} = ${types};\n\n`;
        }
    }

    return output.trim() + '\n';
}

function graphqlTypeToTsMongoType(type: any, fieldName?: string): string {
    // فقط فیلدی که دقیقاً 'id' نام دارد و از نوع ID باشد به ObjectId تبدیل شود
    if (fieldName === 'id' && type instanceof GraphQLScalarType && type.name === 'ID') {
        return 'ObjectId';
    }

    if (type instanceof GraphQLNonNull) {
        return graphqlTypeToTsMongoType(type.ofType, fieldName);
    }

    if (type instanceof GraphQLList) {
        const inner = graphqlTypeToTsMongoType(type.ofType, fieldName);
        return `${inner}[]`;
    }

    if (type instanceof GraphQLScalarType) {
        const name = type.name;
        const map: Record<string, string> = {
            'String': 'string',
            'Int': 'number',
            'Float': 'number',
            'Boolean': 'boolean',
            'ID': 'string',     // در حالت پیش‌فرض string (فقط id اصلی ObjectId می‌شود)
        };
        return map[name] || name;
    }

    if (
        type instanceof GraphQLEnumType ||
        type instanceof GraphQLObjectType ||
        type instanceof GraphQLInterfaceType ||
        type instanceof GraphQLUnionType ||
        type instanceof GraphQLInputObjectType
    ) {
        return type.name;
    }

    return 'any';
}

function generateMongoDbFallback(gql: string): string {
    let code = generateTypescript(gql);
    const header = `import { ObjectId } from 'mongodb';\n\n`;
    code = code.replace(/: string; \/\* ID \*\//g, ': ObjectId;');
    code = code.replace(/id: string;/g, '_id: ObjectId;');
    return header + code;
}

function generateJava(gql: string): string {
    try {
        const schema = buildSchema(gql);
        return convertSchemaToJava(schema);
    } catch (error) {
        console.warn('buildSchema failed for Java, falling back to regex:', error);
        return generateJavaFallback(gql);
    }
}

function convertSchemaToJava(schema: GraphQLSchema): string {
    let output = '// Generated Java Models\n\n';
    const typeMap = schema.getTypeMap();

    for (const [name, type] of Object.entries(typeMap)) {
        // فقط Object Typeها را تبدیل کن (از introspection و interfaceها صرف نظر کن)
        if (name.startsWith('__')) continue;
        if (!(type instanceof GraphQLObjectType)) continue;

        output += `public class ${name} {\n`;
        const fields = type.getFields();
        for (const [fieldName, field] of Object.entries(fields)) {
            const javaType = graphqlTypeToJavaType(field.type);
            output += `    private ${javaType} ${fieldName};\n`;
        }
        output += `\n    // Getters and Setters omitted for brevity...\n}\n\n`;
    }

    return output || '// No types found to convert to Java';
}

function graphqlTypeToJavaType(type: any): string {
    if (type instanceof GraphQLNonNull) {
        return graphqlTypeToJavaType(type.ofType);
    }

    if (type instanceof GraphQLList) {
        const inner = graphqlTypeToJavaType(type.ofType);
        return `List<${inner}>`;
    }

    if (type instanceof GraphQLScalarType) {
        const name = type.name;
        switch (name) {
            case 'String':
            case 'ID':
                return 'String';
            case 'Int':
                return 'Integer';
            case 'Float':
                return 'Double';
            case 'Boolean':
                return 'Boolean';
            default:
                return 'String'; // custom scalars → String
        }
    }

    if (
        type instanceof GraphQLObjectType ||
        type instanceof GraphQLEnumType
    ) {
        return type.name;
    }

    return 'Object';
}

function generateJavaFallback(gql: string): string {
    // همان کد regex قدیمی شما
    const types = [...gql.matchAll(/type\s+(\w+)\s*\{([^}]+)\}/g)];
    let javaCode = `// Generated Java Models\n\n`;

    types.forEach(match => {
        const className = match[1];
        const fields = match[2].trim().split('\n').map(f => f.trim()).filter(Boolean);

        javaCode += `public class ${className} {\n`;
        fields.forEach(field => {
            let [name, type] = field.split(':').map(s => s.trim());
            if(!name || !type) return;
            type = type.replace('!', '');
            let javaType = 'String';
            if (type === 'Int') javaType = 'Integer';
            if (type === 'Float') javaType = 'Double';
            if (type === 'Boolean') javaType = 'Boolean';
            if (type === 'ID') javaType = 'String';
            if (type.includes('[')) javaType = `List<${type.replace(/[\[\]]/g, '')}>`;

            javaCode += `    private ${javaType} ${name};\n`;
        });
        javaCode += `\n    // Getters and Setters omitted for brevity...\n}\n\n`;
    });
    return javaCode || '// No types found to convert to Java';
}

// جایگزین تابع generateResolvers در advancedGraphqlTransformers.ts

function generateResolvers(gql: string): string {
    try {
        const schema = buildSchema(gql);
        return convertSchemaToResolvers(schema);
    } catch (error) {
        console.warn('buildSchema failed for Resolvers, falling back to regex:', error);
        return generateResolversFallback(gql);
    }
}

function convertSchemaToResolvers(schema: GraphQLSchema): string {
    const typeMap = schema.getTypeMap();

    let output = `import { GraphQLResolveInfo } from 'graphql';\n\n`;
    output += `export type ResolverFn<TResult, TParent, TContext, TArgs> = (\n`;
    output += `  parent: TParent,\n`;
    output += `  args: TArgs,\n`;
    output += `  context: TContext,\n`;
    output += `  info: GraphQLResolveInfo\n`;
    output += `) => Promise<TResult> | TResult;\n\n`;
    output += `export interface Resolvers<TContext = any> {\n`;

    for (const [name, type] of Object.entries(typeMap)) {
        if (name.startsWith('__')) continue;
        if (!(type instanceof GraphQLObjectType)) continue;
        if (name === 'Query' || name === 'Mutation' || name === 'Subscription') continue;

        // typeهای معمولی (User, Post, Comment, ...) به شکل ساده‌تر
        output += `  ${name}?: {\n`;
        const fields = type.getFields();
        for (const [fieldName, field] of Object.entries(fields)) {
            const tsReturn = graphqlTypeToTsResolverType(field.type);
            const argsType = buildArgsType(field.args);
            output += `    ${fieldName}?: ResolverFn<${tsReturn}, ${name}, TContext, ${argsType}>;\n`;
        }
        output += `  };\n`;
    }

    output += `}\n`;
    return output;
}

/**
 * ساخت نوع TypeScript برای آرگومان‌ها (مثل { id: string, limit?: number })
 */
function buildArgsType(args: readonly any[]): string {
    if (args.length === 0) return '{}';

    const members: string[] = [];
    for (const arg of args) {
        const tsType = graphqlTypeToTsResolverType(arg.type);
        const optional = arg.defaultValue !== undefined || !(arg.type instanceof GraphQLNonNull) ? '?' : '';
        members.push(`${arg.name}${optional}: ${tsType}`);
    }
    return `{ ${members.join('; ')} }`;
}

/**
 * تبدیل GraphQLType به نوع TypeScript مناسب برای Resolver
 */
function graphqlTypeToTsResolverType(type: any): string {
    if (type instanceof GraphQLNonNull) {
        return graphqlTypeToTsResolverType(type.ofType);
    }

    if (type instanceof GraphQLList) {
        const inner = graphqlTypeToTsResolverType(type.ofType);
        return `${inner}[]`;
    }

    if (type instanceof GraphQLScalarType) {
        const name = type.name;
        const map: Record<string, string> = {
            'String': 'string',
            'Int': 'number',
            'Float': 'number',
            'Boolean': 'boolean',
            'ID': 'string',
        };
        return map[name] || name;
    }

    if (
        type instanceof GraphQLEnumType ||
        type instanceof GraphQLObjectType ||
        type instanceof GraphQLInterfaceType ||
        type instanceof GraphQLUnionType ||
        type instanceof GraphQLInputObjectType
    ) {
        return type.name;
    }

    return 'any';
}

function generateResolversFallback(gql: string): string {
    // همان کد regex قدیمی شما
    let code = `import { GraphQLResolveInfo } from 'graphql';\n\nexport type ResolverFn<TResult, TParent, TContext, TArgs> = (\n  parent: TParent,\n  args: TArgs,\n  context: TContext,\n  info: GraphQLResolveInfo\n) => Promise<TResult> | TResult;\n\nexport interface Resolvers {\n`;
    const types = [...gql.matchAll(/type\s+(\w+)\s*\{([^}]+)\}/g)];

    types.forEach(match => {
        const typeName = match[1];
        code += `  ${typeName}?: {\n`;
        const fields = match[2].trim().split('\n').map(f => f.trim()).filter(Boolean);
        fields.forEach(field => {
            const fieldName = field.split(':')[0].trim();
            code += `    ${fieldName}?: ResolverFn<any, any, any, any>;\n`;
        });
        code += `  };\n`;
    });
    return code + `}\n`;
}

function generateReactComponents(gql: string): string {
    try {
        const schema = buildSchema(gql);
        return convertSchemaToReactComponents(schema);
    } catch (error) {
        console.warn('buildSchema failed for Components, falling back to regex:', error);
        return generateReactComponentsFallback(gql);
    }
}

function convertSchemaToReactComponents(schema: GraphQLSchema): string {
    let output = `import React from 'react';\n`;
    output += `import { useQuery, gql } from '@apollo/client';\n\n`;

    const queryType = schema.getQueryType();
    if (!queryType) {
        return output + `// No Query type found in the schema.\n`;
    }

    const queryFields = queryType.getFields();

    for (const [fieldName, field] of Object.entries(queryFields)) {
        const operationName = `GET_${fieldName.toUpperCase()}`;

        // آرگومان‌ها
        const args = field.args.map(a => `${a.name}: $${a.name}`).join(', ');
        const argDefinitions = field.args.map(a => `$${a.name}: ${graphqlTypeToQueryType(a.type)}`).join(', ');

        // فیلدهای بازگشتی (سعی می‌کنیم از نوع مقصد ۳ فیلد اول را بگیریم)
        let returnFields = '// add your fields here';
        let returnType = field.type;

        // NonNull و List را باز کنیم تا به ObjectType برسیم
        while (returnType instanceof GraphQLNonNull || returnType instanceof GraphQLList) {
            returnType = returnType.ofType;
        }

        if (returnType instanceof GraphQLObjectType) {
            const subFields = returnType.getFields();
            const fieldNames = Object.keys(subFields).slice(0, 3);
            returnFields = fieldNames.join(' ');
        }

        // ساخت query
        const argsString = argDefinitions ? `(${argDefinitions}) ` : '';
        const callArgs = args ? `(${args})` : '';
        const query = `gql\`\n  query ${operationName} ${argsString}{\n    ${fieldName}${callArgs} {\n      ${returnFields}\n    }\n  }\n\``;

        // هوک
        const hookName = `use${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}Query`;
        const hook = `export const ${hookName} = (options?: any) => {\n  return useQuery(${operationName}, options);\n};`;

        output += `export const ${operationName} = ${query};\n\n`;
        output += `${hook}\n\n`;
    }

    return output;
}

function graphqlTypeToQueryType(type: any): string {
    if (type instanceof GraphQLNonNull) {
        return `${graphqlTypeToQueryType(type.ofType)}!`;
    }
    if (type instanceof GraphQLList) {
        return `[${graphqlTypeToQueryType(type.ofType)}]`;
    }
    if (type instanceof GraphQLScalarType) {
        const name = type.name;
        const map: Record<string, string> = {
            'String': 'String',
            'Int': 'Int',
            'Float': 'Float',
            'Boolean': 'Boolean',
            'ID': 'ID',
        };
        return map[name] || 'String';
    }
    return type.name || 'String';
}

function generateReactComponentsFallback(gql: string): string {
    let code = `import React from 'react';\nimport { useQuery, gql } from '@apollo/client';\n\n`;
    const queries = [...gql.matchAll(/type\s+Query\s*\{([^}]+)\}/g)];

    if (queries.length > 0) {
        const fields = queries[0][1].trim().split('\n').map(f => f.trim()).filter(Boolean);
        fields.forEach(field => {
            const queryName = field.split('(')[0].split(':')[0].trim();
            const hookName = `use${queryName.charAt(0).toUpperCase() + queryName.slice(1)}Query`;
            code += `export const ${queryName.toUpperCase()}_QUERY = gql\`\n  query ${queryName} {\n    ${queryName} {\n      // add your fields here\n    }\n  }\n\`;\n\n`;
            code += `export const ${hookName} = (options?: any) => {\n  return useQuery(${queryName.toUpperCase()}_QUERY, options);\n};\n\n`;
        });
    } else {
        code += `// No 'type Query' found in your schema to generate React Hooks.`;
    }
    return code;
}


// تابع generateFlow را هم به‌روز کنید تا از buildSchema استفاده کند
function generateFlow(gql: string): string {
    try {
        const schema = buildSchema(gql);  // gql قبلاً پاک‌سازی شده
        return convertSchemaToFlow(schema);
    } catch (error: any) {
        // در صورت خطا (مثلاً اسکیمای ناقص)، شاید بهتر باشد به regex fallback برگردیم
        return generateFlowFallback(gql);
    }
}
function generateFlowFallback(ts: string): string {
    let code = ts;

    // تبدیل type به export type = {
    code = code.replace(/type\s+(\w+)\s*\{/g, 'export type $1 = {');

    // تبدیل input به export type Input = {
    code = code.replace(/input\s+(\w+)\s*\{/g, 'export type $1Input = {');

    // آرایه‌های Non-null: [Type!]! → Type[]
    code = code.replace(/:\s*\[(\w+)!?\]!/g, ': $1[];');

    // آرایه‌های nullable: [Type] → ?: Type[]
    code = code.replace(/:\s*\[(\w+)!?\]/g, '?: $1[];');

    // ID! → string
    code = code.replace(/:\s*ID!/g, ': string;');

    // ID (nullable) → ?: string
    code = code.replace(/:\s*ID(?!!)/g, '?: string;');

    // String! → string
    code = code.replace(/:\s*String!/g, ': string;');

    // String (nullable) → ?: string
    code = code.replace(/:\s*String(?!!)/g, '?: string;');

    // Int! | Float! → number
    code = code.replace(/:\s*Int!|:\s*Float!/g, ': number;');

    // Int | Float (nullable) → ?: number
    code = code.replace(/:\s*Int(?!!)|:\s*Float(?!!)/g, '?: number;');

    // Boolean! → boolean
    code = code.replace(/:\s*Boolean!/g, ': boolean;');

    // Boolean (nullable) → ?: boolean
    code = code.replace(/:\s*Boolean(?!!)/g, '?: boolean;');

    // هر نوع non-null دیگر: Type! → Type
    code = code.replace(/:\s*(\w+)!/g, ': $1;');

    // هر نوع nullable دیگر: Type → ?: Type
    code = code.replace(/:\s*(\w+)(?!\[|!|;)/g, '?: $1;');

    return `// @flow\n\n${code}`;
}
/**
 * تبدیل یک GraphQLSchema به تعاریف Flow type alias
 */
function convertSchemaToFlow(schema: GraphQLSchema): string {
    let output = '// @flow\n\n';
    const typeMap = schema.getTypeMap();

    // ۱. Scalars سفارشی (فیلتر __)
    const customScalars: string[] = [];
    for (const [name, type] of Object.entries(typeMap)) {
        if (name.startsWith('__')) continue;
        if (type instanceof GraphQLScalarType && !isSpecifiedScalarType(type)) {
            customScalars.push(name);
        }
    }
    if (customScalars.length > 0) {
        output += '/* Custom Scalars */\n';
        for (const name of customScalars) {
            output += `type ${name} = string;\n`;
        }
        output += '\n';
    }

    // ۲. Enumها (فیلتر __)
    for (const [name, type] of Object.entries(typeMap)) {
        if (name.startsWith('__')) continue;
        if (type instanceof GraphQLEnumType) {
            const values = type.getValues().map(v => `'${v.value}'`).join(' | ');
            output += `type ${name} = ${values};\n\n`;
        }
    }

    // ۳. Interfaceها (فیلتر __)
    for (const [name, type] of Object.entries(typeMap)) {
        if (name.startsWith('__')) continue;
        if (type instanceof GraphQLInterfaceType) {
            output += `type ${name} = {\n`;
            const fields = type.getFields();
            for (const [fieldName, field] of Object.entries(fields)) {
                const flowType = graphqlTypeToFlowType(field.type);
                output += `  ${fieldName}: ${flowType},\n`;
            }
            output += `};\n\n`;
        }
    }

    // ۴. Object Typeها (فیلتر __)
    for (const [name, type] of Object.entries(typeMap)) {
        if (name.startsWith('__')) continue;
        if (type instanceof GraphQLObjectType) {
            const interfaces = type.getInterfaces();
            const interfaceNames = interfaces.map(i => i.name);

            output += `type ${name} = {\n`;
            const fields = type.getFields();
            for (const [fieldName, field] of Object.entries(fields)) {
                const flowType = graphqlTypeToFlowType(field.type);
                output += `  ${fieldName}: ${flowType},\n`;
            }
            output += `}`;
            if (interfaceNames.length > 0) {
                output += ` & ${interfaceNames.join(' & ')}`;
            }
            output += `;\n\n`;
        }
    }

    // ۵. Input Objectها (فیلتر __)
    for (const [name, type] of Object.entries(typeMap)) {
        if (name.startsWith('__')) continue;
        if (type instanceof GraphQLInputObjectType) {
            output += `type ${name} = {\n`;
            const fields = type.getFields();
            for (const [fieldName, field] of Object.entries(fields)) {
                const flowType = graphqlTypeToFlowType(field.type);
                output += `  ${fieldName}: ${flowType},\n`;
            }
            output += `};\n\n`;
        }
    }

    // ۶. Unionها (فیلتر __)
    for (const [name, type] of Object.entries(typeMap)) {
        if (name.startsWith('__')) continue;
        if (type instanceof GraphQLUnionType) {
            const types = type.getTypes().map(t => t.name).join(' | ');
            output += `type ${name} = ${types};\n\n`;
        }
    }

    return output.trim() + '\n';
}

/**
 * تبدیل یک GraphQLType به معادل Flow
 */
function graphqlTypeToFlowType(type: any): string {
    // NonNull
    if (type instanceof GraphQLNonNull) {
        return graphqlTypeToFlowType(type.ofType);
    }

    // List
    if (type instanceof GraphQLList) {
        const inner = graphqlTypeToFlowType(type.ofType);
        return `${inner}[]`;
    }

    // Scalar
    if (type instanceof GraphQLScalarType) {
        const name = type.name;
        const map: Record<string, string> = {
            'String': 'string',
            'Int': 'number',
            'Float': 'number',
            'Boolean': 'boolean',
            'ID': 'string',
        };
        return map[name] || name;
    }

    // Enum, Object, Interface, Union, InputObject
    if (
        type instanceof GraphQLEnumType ||
        type instanceof GraphQLObjectType ||
        type instanceof GraphQLInterfaceType ||
        type instanceof GraphQLUnionType ||
        type instanceof GraphQLInputObjectType
    ) {
        return type.name;
    }

    return 'any';
}