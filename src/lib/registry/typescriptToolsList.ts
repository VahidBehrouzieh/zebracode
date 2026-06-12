// بخش TypeScript tools در toolRegistry.ts

import {tsToDts, tsToJs, tsToFlow, tsToZod, tsToJsonSchema} from '@/lib/tools-transformer/typescriptTransformers';

import {Code} from "lucide-react";
import {ToolMeta} from "@/types/types";

// ... داخل toolRegistry
export const TypescriptToolsList: Record<string, ToolMeta> = {
    // ... ابزارهای قبلی ...

    // --------------------- TypeScript Converters ---------------------
    'typescript-to-flow': {
        type: 'typescript-to-flow',
        category: 'converters',
        subCategory: 'typescript',
        title: 'TypeScript to Flow',
        shortDescription: 'Convert TypeScript types to Flow type annotations',
        description:
            'Migrate your TypeScript type definitions to Flow with our free online converter. It maps interfaces, types, enums, and generics to their Flow equivalents, helping you transition codebases between these two static type checkers. Fast, browser-based, and requires no sign-up.',
        icon: Code,
        href: '/typescript-to-flow',
        inputLanguage: 'typescript',
        outputLanguage: 'flow',
        transformFunction: tsToFlow,
        gradientClasses: 'from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800',
    },
    'typescript-to-javascript': {
        type: 'typescript-to-javascript',
        category: 'converters',
        subCategory: 'typescript',
        title: 'TypeScript to JavaScript',
        shortDescription: 'Compile TypeScript to plain JavaScript online',
        description:
            'Strip TypeScript type annotations and compile your code to clean JavaScript instantly. This free online tool removes types, handles enums and decorators, and outputs standard JavaScript that runs in any browser or Node.js environment. Perfect for quick demos, debugging, or sharing snippets without a build step.',
        icon: Code,
        href: '/typescript-to-javascript',
        inputLanguage: 'typescript',
        outputLanguage: 'javascript',
        transformFunction: tsToJs,
        gradientClasses: 'from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-gray-800',
    },
    'typescript-to-json-schema': {
        type: 'typescript-to-json-schema',
        category: 'converters',
        subCategory: 'typescript',
        title: 'TypeScript to JSON Schema',
        shortDescription: 'Generate JSON Schema from TypeScript interfaces',
        description:
            'Transform your TypeScript interfaces and types into valid JSON Schema drafts. This online converter supports generics, unions, optional properties, and arrays, producing schemas perfect for request validation, configuration files, or API documentation. No registration needed, fully client-side.',
        icon: Code,
        href: '/typescript-to-json-schema',
        inputLanguage: 'typescript',
        outputLanguage: 'json',
        transformFunction: tsToJsonSchema,
        gradientClasses: 'from-purple-50 to-violet-50 dark:from-gray-900 dark:to-gray-800',
    },
    'typescript-to-typescript-declaration': {
        type: 'typescript-to-typescript-declaration',
        category: 'converters',
        subCategory: 'typescript',
        title: 'TypeScript to Declaration (.d.ts)',
        shortDescription: 'Generate .d.ts declaration files from TypeScript source',
        description:
            'Extract only the type declarations from your TypeScript code, producing .d.ts files ready for library publishing. This free online tool removes implementations and keeps interfaces, types, and exports, helping you create type packages for your JavaScript modules. Works directly in your browser with no installation.',
        icon: Code,
        href: '/typescript-to-typescript-declaration',
        inputLanguage: 'typescript',
        outputLanguage: 'typescript',  // .d.ts ها هم‌چنان TypeScript محسوب می‌شوند
        transformFunction: tsToDts,
        gradientClasses: 'from-teal-50 to-green-50 dark:from-gray-900 dark:to-gray-800',
    },
    'typescript-to-zod': {
        type: 'typescript-to-zod',
        category: 'converters',
        subCategory: 'typescript',
        title: 'TypeScript to Zod',
        shortDescription: 'Generate Zod validation schemas from TypeScript types',
        description:
            'Convert your TypeScript type definitions into Zod schemas instantly. This free online tool translates interfaces, enums, unions, and optional properties into safe, runtime type validators. Perfect for adding validation to Next.js server actions, API routes, or form libraries without writing schemas by hand. Entirely browser-based—no sign-up needed.',
        icon: Code,
        href: '/typescript-to-zod',
        inputLanguage: 'typescript',
        outputLanguage: 'typescript',   // خروجی Zod معمولاً در فایل‌های TypeScript استفاده می‌شود
        transformFunction: tsToZod,
        gradientClasses: 'from-cyan-50 to-teal-50 dark:from-gray-900 dark:to-gray-800',
    },
};