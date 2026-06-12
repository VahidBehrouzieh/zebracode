// داخل toolRegistry (بخش JSON-LD)
import {compactJsonLd, flattenJsonLd, frameJsonLd, normalizeJsonLd, toNQuads} from "@/lib/tools-transformer/jsonldTransformers";
import {ToolMeta} from "@/types/types";
import {Code} from "lucide-react";


export const JsonldToolsList: Record<string, ToolMeta> = {
    'jsonld-to-compacted': {
        type: 'jsonld-to-compacted',
        category: 'converters',
        subCategory: 'jsonld',
        title: 'JSON-LD to Compacted',
        shortDescription: 'Compact a JSON-LD document with a given context',
        description:
            'Compact your JSON-LD data by applying a specific context to shorten IRIs and reduce document size. This online compactor helps you simplify expanded JSON-LD into a concise, production-ready form. Ideal for SEO, schema markup, and API payloads. Free and processed entirely in your browser.',
        icon: Code,
        href: '/jsonld-to-compacted',
        inputLanguage: 'jsonld',       // JSON-LD
        outputLanguage: 'json',       // خروجی فشرده‌شده همچنان JSON معتبر است
        transformFunction: compactJsonLd,
        gradientClasses: 'from-teal-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800',
        // برای این ابزار نیاز به ورودی دوم (Context) دارد → بعداً requiresSecondaryInput و secondaryInputTitle تنظیم شود
        requiresSecondaryInput: true,
        secondaryInputTitle: 'JSON-LD Context',
        secondarySampleCode: '',
    },
    'jsonld-to-flattened': {
        type: 'jsonld-to-flattened',
        category: 'converters',
        subCategory: 'jsonld',
        title: 'JSON-LD to Flattened',
        shortDescription: 'Flatten a JSON-LD document to a node-based graph',
        description:
            'Flatten your JSON-LD document into a list of top-level nodes, making it easier to index and query. This converter removes nested objects, replacing them with node references. Perfect for debugging, graph databases, and standardizing structured data. Free online tool, no registration required.',
        icon: Code,
        href: '/jsonld-to-flattened',
        inputLanguage: 'jsonld',
        outputLanguage: 'json',
        transformFunction: flattenJsonLd,
        gradientClasses: 'from-cyan-50 to-blue-50 dark:from-gray-900 dark:to-gray-800',
    },
    'jsonld-to-framed': {
        type: 'jsonld-to-framed',
        category: 'converters',
        subCategory: 'jsonld',
        title: 'JSON-LD to Framed',
        shortDescription: 'Shape a JSON-LD document by applying a frame',
        description:
            'Frame your JSON-LD data to extract a specific view of the graph. This online framer applies a JSON-LD frame to match desired property shapes, making it easier to consume linked data in apps and sites. Essential for schema.org SEO and semantic web development. Free and client-side only.',
        icon: Code,
        href: '/jsonld-to-framed',
        inputLanguage: 'jsonld',
        outputLanguage: 'json',
        transformFunction: frameJsonLd,
        gradientClasses: 'from-sky-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800',
        // این ابزار هم معمولاً ورودی ثانویه (Frame) نیاز دارد
        requiresSecondaryInput: true,
        secondaryInputTitle: 'JSON-LD Frame',
        secondarySampleCode: '',
    },
    'jsonld-to-normalized': {
        type: 'jsonld-to-normalized',
        category: 'converters',
        subCategory: 'jsonld',
        title: 'JSON-LD to Normalized',
        shortDescription: 'Normalize a JSON-LD document (RDF Dataset Normalization)',
        description:
            'Apply the RDF Dataset Normalization algorithm (URDNA2015) to your JSON-LD document, producing a canonical form suitable for digital signatures, comparison, and data integrity. This free online tool works entirely in your browser and requires no registration.',
        icon: Code,
        href: '/jsonld-to-normalized',
        inputLanguage: 'jsonld',        // ورودی JSON-LD
        outputLanguage: 'json',        // خروجی همچنان JSON (نرمالایز شده)
        transformFunction: normalizeJsonLd,
        gradientClasses: 'from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800',
    },
    // ---------- جدید: JSON-LD to N-Quads ----------
    'jsonld-to-nquads': {
        type: 'jsonld-to-nquads',
        category: 'converters',
        subCategory: 'jsonld',
        title: 'JSON-LD to N-Quads',
        shortDescription: 'Convert JSON-LD document to N-Quads format',
        description:
            'Serialize your JSON-LD data into the N-Quads line-based format, one quad per line. Ideal for feeding RDF data to triple stores, command-line tools, or standard Linked Data pipelines. Our converter is free, client-side, and requires no sign-up.',
        icon: Code,
        href: '/jsonld-to-nquads',
        inputLanguage: 'jsonld',
        outputLanguage: 'text',        // N-Quads فرمت متنی است
        transformFunction: toNQuads,
        gradientClasses: 'from-lime-50 to-green-50 dark:from-gray-900 dark:to-gray-800',
    },
};