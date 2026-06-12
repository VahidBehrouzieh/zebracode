// بخش Flow در toolRegistry

import { flowToDts , flowToTs , flowToJs } from '@/lib/tools-transformer/flowTransformers';

import {Code} from "lucide-react";
import {ToolMeta} from "@/types/types";

export const FlowToolsList: Record<string, ToolMeta> = {
    // ... ابزارهای قبلی ...

    // --------------------- Flow tools ---------------------
    flowToJavascript: {
        type: 'flowToJavascript',
        category: 'converters',
        subCategory: 'flow',
        title: 'Flow to JavaScript',
        shortDescription: 'Strip Flow type annotations to get plain JavaScript',
        description:
            'Convert Flow-typed JavaScript to standard, browser-ready JavaScript by removing all type annotations. This free online converter lets you compile Flow code instantly without installing the Flow binary. Ideal for sharing code snippets, migrating away from Flow, or debugging type-stripped output. No registration required, all processing is client-side.',
        icon: Code,
        href: '/flow-to-javascript',
        inputLanguage: 'flow',
        outputLanguage: 'javascript',
        transformFunction: flowToJs,
        gradientClasses: 'from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800',
    },
    flowToTypescript: {
        type: 'flowToTypescript',
        category: 'converters',
        subCategory: 'flow',
        title: 'Flow to TypeScript',
        shortDescription: 'Convert Flow type definitions to TypeScript',
        description:
            'Migrate your codebase from Flow to TypeScript with our online converter. It translates Flow type annotations into equivalent TypeScript interfaces, types, and utility types. Designed to speed up migration, the tool handles common patterns like maybe types, union types, and utility types. Free, browser-based, and secure—your code stays on your machine.',
        icon: Code,
        href: '/flow-to-typescript',
        inputLanguage: 'flow',
        outputLanguage: 'typescript',
        transformFunction: flowToTs,
        gradientClasses: 'from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800',
    },
    flowToTypescriptDeclaration: {
        type: 'flowToTypescriptDeclaration',
        category: 'converters',
        subCategory: 'flow',
        title: 'Flow to TypeScript Declaration',
        shortDescription: 'Generate TypeScript declaration files from Flow types',
        description:
            'Automatically generate TypeScript .d.ts declaration files from your Flow type definitions. This converter preserves exported types, interfaces, and module shapes, making it perfect for creating type stubs for JavaScript libraries originally typed with Flow. A vital tool for teams transitioning to TypeScript while maintaining type safety. Works entirely in your browser.',
        icon: Code,
        href: '/flow-to-typescript-declaration',
        inputLanguage: 'flow',
        outputLanguage: 'typescript',   // .d.ts فایل‌های هم‌چنان TypeScript محسوب می‌شوند
        transformFunction: flowToDts,
        gradientClasses: 'from-violet-50 to-purple-50 dark:from-gray-900 dark:to-gray-800',
    },
};