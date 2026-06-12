// src/lib/seo.ts
import { Metadata } from 'next';
import { getToolConfig } from "@/components/utils/tools/helper";

export function generateToolMetadata(toolType: string, locale?: string): Metadata {
    const tool = getToolConfig(toolType);
    if (!tool) {
        return {
            title: 'Tool Not Found',
            description: 'The requested converter was not found.',
        };
    }

    const title = `${tool.title} – Free Online Converter | ZebraCode`;
    const description = tool.shortDescription || tool.description;
    const url = `https://zebracode.ir${tool.href}`;

    // ۱. اسکیمای SoftwareApplication (همیشه)
    const softwareAppSchema = tool.structuredData || {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": tool.title,
        "description": tool.shortDescription || tool.description,
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "Any",
        "url": url,
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        }
    };

    // ۲. FAQ Schema – اولویت با FAQ اختصاصی، سپس پیش‌فرض بر اساس subCategory
    const faq = tool.extraContent?.faq && tool.extraContent.faq.length > 0
        ? tool.extraContent.faq
        : getDefaultFaq(tool.subCategory || 'others');

    const faqSchema = faq.length > 0 ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faq.map(item => ({
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": item.answer
            }
        }))
    } : null;

    // ۳. ترکیب اسکیماها
    const structuredData = faqSchema ? [softwareAppSchema, faqSchema] : [softwareAppSchema];

    return {
        title,
        description,
        alternates: { canonical: url },
        robots: { index: true, follow: true },
        openGraph: {
            title,
            description,
            url,
            siteName: 'ZebraCode',
            type: 'website',
            locale: locale || 'en_US',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
        other: {
            'script:ld+json': JSON.stringify(structuredData),
        },
    };
}

export function getDefaultFaq(subCategory: string): { question: string; answer: string }[] {
    const faqs: Record<string, { question: string; answer: string }[]> = {
        // ---------- دسته‌های قبلی (converters) ----------
        json: [
            { question: "Is this JSON tool free to use?", answer: "Yes, all JSON tools on ZebraCode are completely free. You can use them without any registration or limitations." },
            { question: "Is my JSON data secure?", answer: "Absolutely. All processing happens directly in your browser. Your data is never uploaded to any server, ensuring complete privacy." },
            { question: "Can I process large JSON files?", answer: "Yes, our tools are optimized for performance and can handle files up to several megabytes, depending on your browser's capabilities." }
        ],
        css: [
            { question: "Is this CSS tool free to use?", answer: "Yes, all CSS tools on ZebraCode are completely free. No registration or sign-up is required." },
            { question: "Does the tool support modern CSS features?", answer: "Yes, our CSS tools support modern CSS features including custom properties, flexbox, grid, and more." },
            { question: "Is my CSS code processed securely?", answer: "Yes, all processing is done locally in your browser. Your code never leaves your device." }
        ],
        graphql: [
            { question: "Is this GraphQL tool free?", answer: "Yes, all GraphQL tools on ZebraCode are completely free to use with no limitations." },
            { question: "Does the tool support the latest GraphQL spec?", answer: "Yes, our tools are built on the official GraphQL.js library and support the latest specification." },
            { question: "Is my GraphQL schema secure?", answer: "Yes, all processing happens locally in your browser. Your schema is never sent to any server." }
        ],
        html: [
            { question: "Is this HTML tool free?", answer: "Yes, all HTML tools on ZebraCode are completely free and require no registration." },
            { question: "Does the tool handle complex HTML structures?", answer: "Yes, our HTML tools are designed to handle complex nested structures and large documents." },
            { question: "Is my HTML code processed securely?", answer: "Yes, all processing happens in your browser. Your code never leaves your device." }
        ],
        javascript: [
            { question: "Is this JavaScript tool free?", answer: "Yes, all JavaScript tools on ZebraCode are completely free to use." },
            { question: "Does the tool support modern JavaScript (ES6+)?", answer: "Yes, our JavaScript tools support modern syntax including arrow functions, template literals, and more." },
            { question: "Is my JavaScript code secure?", answer: "Yes, all processing is done locally in your browser. Your code is never uploaded anywhere." }
        ],
        typescript: [
            { question: "Is this TypeScript tool free?", answer: "Yes, all TypeScript tools on ZebraCode are completely free to use without restrictions." },
            { question: "Does the tool support the latest TypeScript features?", answer: "Yes, our TypeScript tools are built on the official TypeScript compiler and support the latest features." },
            { question: "Is my TypeScript code processed securely?", answer: "Yes, all processing happens locally in your browser. Your code never leaves your device." }
        ],
        svg: [
            { question: "Is this SVG tool free?", answer: "Yes, all SVG tools on ZebraCode are completely free to use." },
            { question: "Does the tool handle complex SVG graphics?", answer: "Yes, our SVG tools can process complex vector graphics with multiple elements and attributes." },
            { question: "Is my SVG code secure?", answer: "Yes, all processing is done locally in your browser. Your SVG code is never uploaded." }
        ],
        jsonld: [
            { question: "Is this JSON-LD tool free?", answer: "Yes, all JSON-LD tools on ZebraCode are completely free to use." },
            { question: "Does the tool support all JSON-LD contexts?", answer: "Yes, our JSON-LD tools support custom contexts and standard schema.org vocabularies." },
            { question: "Is my JSON-LD data processed securely?", answer: "Yes, all processing happens locally in your browser. Your data is never uploaded." }
        ],
        'json-schema': [
            { question: "Is this JSON Schema tool free?", answer: "Yes, all JSON Schema tools on ZebraCode are completely free to use." },
            { question: "Does the tool support the latest JSON Schema drafts?", answer: "Yes, our tools support JSON Schema drafts up to 2020-12." },
            { question: "Is my JSON Schema processed securely?", answer: "Yes, all processing happens locally in your browser. Your schema is never uploaded." }
        ],
        flow: [
            { question: "Is this Flow tool free?", answer: "Yes, all Flow tools on ZebraCode are completely free to use." },
            { question: "Does the tool accurately strip Flow types?", answer: "Yes, our Flow tools use Babel with the Flow preset to ensure accurate type removal." },
            { question: "Is my Flow code processed securely?", answer: "Yes, all processing happens locally in your browser." }
        ],
        encoders: [
            { question: "Is this encoding tool free?", answer: "Yes, all encoding/decoding tools on ZebraCode are completely free to use." },
            { question: "Is my data processed securely?", answer: "Yes, all processing happens locally in your browser. Your data is never uploaded." },
            { question: "What types of encoding are supported?", answer: "We support Base64 encoding/decoding and JWT decoding. More formats are coming soon." }
        ],

        // ---------- دسته‌های جدید ----------
        'date-time': [
            { question: "Is this date/time tool free?", answer: "Yes, all date/time tools on ZebraCode are completely free to use." },
            { question: "Does the tool support different calendars?", answer: "Yes, our date/time tools support both Gregorian and Persian (Jalali/Shamsi) calendars." },
            { question: "How accurate are the calculations?", answer: "All calculations are performed using JavaScript's built-in Date API and the jalaali-js library, ensuring high accuracy." },
            { question: "Is my timestamp data processed securely?", answer: "Yes, all processing happens locally in your browser. Your data is never uploaded to any server." }
        ],
        generators: [
            { question: "Is this generator tool free?", answer: "Yes, all generator tools on ZebraCode are completely free to use." },
            { question: "How are the generated values created?", answer: "All generators use cryptographically secure randomization (for passwords) or proper text generation algorithms (for Lorem Ipsum)." },
            { question: "Are the generated values stored anywhere?", answer: "No, everything is generated locally in your browser. No data is stored, transmitted, or logged." }
        ],
        text: [
            { question: "Is this text tool free?", answer: "Yes, all text tools on ZebraCode are completely free to use." },
            { question: "How does the text comparison work?", answer: "The text comparison uses a line-by-line diff algorithm to show exactly what has changed between two texts." },
            { question: "Is my text data secure?", answer: "Yes, all processing happens locally in your browser. Your text never leaves your device." }
        ],
        password: [
            { question: "Are the generated passwords secure?", answer: "Yes, passwords are generated using the Web Crypto API (Crypto.getRandomValues), which provides cryptographically strong random numbers." },
            { question: "Can I customize the password length?", answer: "Yes, you can generate passwords from 8 to 64 characters long and choose which character types to include." },
            { question: "Are my passwords stored or logged?", answer: "No. Passwords are generated entirely in your browser and are never transmitted, stored, or logged anywhere." }
        ],
        others: [
            { question: "Is this tool free to use?", answer: "Yes, all tools on ZebraCode are completely free and require no registration." },
            { question: "How does this tool work?", answer: "All processing happens directly in your browser. Your data is never sent to any server." },
            { question: "Can I use this tool offline?", answer: "Yes, once the page is loaded, the tool works completely offline in your browser." }
        ]
    };

    return faqs[subCategory] || faqs['others'] || [];
}