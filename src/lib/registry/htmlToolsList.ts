// داخل toolRegistry (بخش HTML)
import { htmlToJsx,htmlToPugConvert } from"@/lib/tools-transformer/htmlTransformers";
import {ToolMeta} from "@/types/types";
import {Code} from "lucide-react";

// ...

export const HtmlToolsList: Record<string, ToolMeta> = {
    'html-to-jsx': {
        type: 'html-to-jsx',
        category: 'converters',
        subCategory: 'html',
        title: 'HTML to JSX',
        shortDescription: 'Convert HTML to JSX for React',
        description:
            'Quickly convert your standard HTML into JSX syntax ready for React components. This free online converter automatically transforms attributes like `class` to `className`, `for` to `htmlFor`, and self-closes empty elements. Ideal for migrating existing markup or prototyping UI without manual rewriting. No registration needed, entirely client-side.',
        icon: Code,
        href: '/html-to-jsx',
        inputLanguage: 'html',
        outputLanguage: 'javascript',   // JSX در زبان جاوااسکریپت هایلایت می‌شود
        transformFunction: htmlToJsx,
        gradientClasses: 'from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800',
    },
    'html-to-pug': {
        type: 'html-to-pug',
        category: 'converters',
        subCategory: 'html',
        title: 'HTML to Pug',
        shortDescription: 'Transform HTML into Pug (formerly Jade) templates',
        description:
            'Effortlessly convert your HTML code into clean, indented Pug syntax. This online converter eliminates angle brackets and closing tags, giving you a concise template ready for Node.js or Express apps. Perfect for developers transitioning to Pug or maintaining legacy projects. Fast, free, and browser-based—no installation required.',
        icon: Code,
        href: '/html-to-pug',
        inputLanguage: 'html',
        outputLanguage: 'text',         // Pug به‌عنوان زبان مستقل پشتیبانی نمی‌شود → text
        transformFunction: htmlToPugConvert,
        gradientClasses: 'from-yellow-50 to-lime-50 dark:from-gray-900 dark:to-gray-800',
    },
};