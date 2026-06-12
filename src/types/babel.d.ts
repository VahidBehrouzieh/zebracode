// src/types/babel.d.ts
declare module '@babel/parser' {
    export function parse(code: string, opts?: any): any;
}

declare module '@babel/traverse' {
    const traverse: any;
    export default traverse;
}

declare module '@babel/generator' {
    const generate: any;
    export default generate;
}

declare module '@babel/types' {
    export function isBinaryExpression(node: any): boolean;
    export function isStringLiteral(node: any): boolean;
    export function isTemplateLiteral(node: any): boolean;
    export function arrowFunctionExpression(params: any, body: any, async: boolean): any;
    export function variableDeclarator(id: any, init: any): any;
    export function variableDeclaration(kind: string, declarations: any[]): any;
    export function templateLiteral(quasis: any[], expressions: any[]): any;
    export function templateElement(value: { raw: string; cooked: string }, tail: boolean): any;
}