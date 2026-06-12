// بخش SVG tools در toolRegistry.ts

import {svgToJsx, svgToReactNative} from '@/lib/tools-transformer/svgTransformers';
import {Code} from "lucide-react";
import {ToolMeta} from "@/types/types";

// ... داخل toolRegistry
export const SvgToolsList: Record<string, ToolMeta> = {
    // ... ابزارهای قبلی ...

    // --------------------- SVG Converters ---------------------
    svgToJsx: {
        type: 'svgToJsx',
        category: 'converters',
        subCategory: 'svg',
        title: 'SVG to JSX',
        shortDescription: 'Convert SVG files to JSX for React components',
        description:
            'Transform your SVG code into JSX syntax ready for React components. This free online converter correctly converts SVG attributes to React-compatible props (e.g., `class` to `className`, `stroke-width` to `strokeWidth`), handles self-closing elements, and strips unnecessary namespaces. Ideal for creating React icons and illustrations. Works entirely in your browser, no registration needed.',
        icon: Code,
        href: '/svg-to-jsx',
        inputLanguage: 'svg',          // یا 'text' (بسته به پشتیبانی CodeMirror)
        outputLanguage: 'javascript', // JSX در زبان جاوااسکریپت هایلایت می‌شود
        transformFunction: svgToJsx,
        gradientClasses: 'from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800',
    },
    svgToReactNative: {
        type: 'svgToReactNative',
        category: 'converters',
        subCategory: 'svg',
        title: 'SVG to React Native',
        shortDescription: 'Convert SVGs to React Native SVG components',
        description:
            'Easily convert your SVG files to React Native-compatible SVG components. This free online tool adapts SVG elements for libraries like react-native-svg, mapping tags to their React Native equivalents and optimising attributes for mobile rendering. Perfect for cross-platform mobile app development. Fast, client-side, and requires no sign-up.',
        icon: Code,
        href: '/svg-to-react-native',
        inputLanguage: 'svg',          // یا 'text'
        outputLanguage: 'javascript', // خروجی JSX / React Native style
        transformFunction: svgToReactNative,
        gradientClasses: 'from-indigo-50 to-violet-50 dark:from-gray-900 dark:to-gray-800',
    },
};