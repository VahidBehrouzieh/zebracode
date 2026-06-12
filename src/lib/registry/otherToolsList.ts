// بخش Other tools در toolRegistry.ts

import {
    cadenceToGo,
    markdownToHtml,
    tomlToJson,
    xmlToJsonConvert,
    yamlToJson,
    yamlToToml, tomlToYaml
} from '@/lib/tools-transformer/miscTransformers';
import {Code} from "lucide-react";
import {ToolMeta} from "@/types/types";

// ... داخل toolRegistry
export const OtherToolsList: Record<string, ToolMeta> = {
    // ... ابزارهای قبلی ...

    // --------------------- Other Converters ---------------------
    'cadence-to-go': {
        type: 'cadence-to-go',
        category: 'converters',
        subCategory: 'others',
        title: 'Cadence to Go',
        shortDescription: 'Convert Cadence workflow definitions to Go code',
        description:
            'Generate Go worker boilerplate from your Cadence workflow definitions. This free online converter translates your Cadence DSL into ready-to-compile Go structs, activities, and workflow interfaces—perfect for bootstrapping Temporal or Cadence projects. All processing happens in your browser, no sign-up required.',
        icon: Code,
        href: '/cadence-to-go',
        inputLanguage: 'text',        // تعاریف Cadence معمولاً ساختارمند هستند ولی نه زبان شناخته‌شده برای CodeMirror
        outputLanguage: 'text',      // خروجی Go (اگر افزونه‌ای ندارید، text بماند)
        transformFunction: cadenceToGo,
        gradientClasses: 'from-rose-50 to-pink-50 dark:from-gray-900 dark:to-gray-800',
    },
    'markdown-to-html': {
        type: 'markdown-to-html',
        category: 'converters',
        subCategory: 'others',
        title: 'Markdown to HTML',
        shortDescription: 'Convert Markdown to clean, semantic HTML',
        description:
            'Transform your Markdown into clean, responsive HTML with our free online converter. Supports tables, code blocks (with syntax highlighting), GitHub-flavored Markdown, and custom CSS. Ideal for developers, content creators, and anyone building static sites. Works instantly in your browser, no account needed.',
        icon: Code,
        href: '/markdown-to-html',
        inputLanguage: 'markdown',
        outputLanguage: 'html',
        transformFunction: markdownToHtml,
        gradientClasses: 'from-gray-50 to-stone-50 dark:from-gray-900 dark:to-gray-800',
    },
    tomlToJson: {
        type: 'tomlToJson',
        category: 'converters',
        subCategory: 'others',
        title: 'TOML to JSON',
        shortDescription: 'Convert TOML files to JSON online',
        description:
            'Easily convert your TOML configuration files into structured JSON. This free online tool preserves arrays, nested tables, and inline objects, making it perfect for migrating configs between Rust, Python, and JavaScript ecosystems. Fast, client-side, and requires no installation or sign-up.',
        icon: Code,
        href: '/toml-to-json',
        inputLanguage: 'text',        // یا 'toml' (در صورت پشتیبانی)
        outputLanguage: 'json',
        transformFunction: tomlToJson,
        gradientClasses: 'from-lime-50 to-green-50 dark:from-gray-900 dark:to-gray-800',
    },
    xmlToJson: {
        type: 'xmlToJson',
        category: 'converters',
        subCategory: 'others',
        title: 'XML to JSON',
        shortDescription: 'Convert XML data to JSON format',
        description:
            'Transform XML documents into JSON with a single click. Our converter handles attributes, nested elements, and arrays intelligently, producing clean JSON perfect for APIs, web services, or data interchange. Free, secure, and works entirely in your browser—no XML file touches a server.',
        icon: Code,
        href: '/xml-to-json',
        inputLanguage: 'text',        // یا 'xml'
        outputLanguage: 'json',
        transformFunction: xmlToJsonConvert,
        gradientClasses: 'from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800',
    },
    yamlToJson: {
        type: 'yamlToJson',
        category: 'converters',
        subCategory: 'others',
        title: 'YAML to JSON',
        shortDescription: 'Convert YAML to JSON instantly',
        description:
            'Quickly translate your YAML configuration or data files into valid JSON. This free online converter supports all YAML types, anchors, and multiline strings. Ideal for migrating from Docker Compose, Kubernetes manifests, or CI/CD pipelines to JSON-based tools. No registration required, completely client-side.',
        icon: Code,
        href: '/yaml-to-json',
        inputLanguage: 'yaml',
        outputLanguage: 'json',
        transformFunction: yamlToJson,
        gradientClasses: 'from-sky-50 to-blue-50 dark:from-gray-900 dark:to-gray-800',
    },
    yamlToToml: {
        type: 'yamlToToml',
        category: 'converters',
        subCategory: 'others',
        title: 'YAML to TOML',
        shortDescription: 'Convert YAML files to TOML format',
        description:
            'Effortlessly convert your YAML files into clean, readable TOML. This free converter handles nested tables, arrays of tables, and preserves comments where possible. Perfect for teams moving configuration from YAML to TOML for better readability in Python or Rust projects. Works online, no download needed.',
        icon: Code,
        href: '/yaml-to-toml',
        inputLanguage: 'yaml',
        outputLanguage: 'text',      // 'toml' (در صورت پشتیبانی)
        transformFunction: yamlToToml,
        gradientClasses: 'from-teal-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800',
    },
    'toml-to-yaml': {
        type: 'toml-to-yaml',
        category: 'converters',
        subCategory: 'others',
        title: 'TOML to YAML',
        shortDescription: 'Convert TOML files to YAML format',
        description:
            'Transform your TOML configuration files into clean, indented YAML. This free online converter preserves tables, arrays, and nested structures, making it ideal for migrating configs between Rust, Python, and Kubernetes ecosystems. No registration needed, all processing is done in your browser.',
        icon: Code,
        href: '/toml-to-yaml',
        inputLanguage: 'text',        // TOML به‌عنوان متن ورودی (می‌توان به 'toml' تغییر داد)
        outputLanguage: 'yaml',
        transformFunction: tomlToYaml,
        gradientClasses: 'from-green-50 to-lime-50 dark:from-gray-900 dark:to-gray-800',
    },
};