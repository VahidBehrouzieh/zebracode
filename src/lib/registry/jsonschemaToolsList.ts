// مسیر: src/lib/schemaTransformersRegistry.ts (یا هر فایلی که رجیستری ابزارها را نگه می‌دارید)
import {FileJson, FileCode2, CheckCircle, FileCode} from "lucide-react";
import {ToolMeta} from "@/types/types";

// فرض می‌کنیم توابع تبدیل خود را در چنین فایلی دارید
import {
    jsonSchemaToOpenApi,
    jsonSchemaToTs,
    jsonSchemaToZod, jsonSchemaToProtobuf
} from "@/lib/tools-transformer/jsonSchemaTransformers";

export const JsonschemaToolsList: Record<string, ToolMeta> = {
    jsonSchemaToOpenApiSchema: {
        type: 'jsonSchemaToOpenApiSchema',
        category: 'converters',
        subCategory: 'json-schema',
        title: 'JSON Schema to OpenAPI',
        shortDescription: 'Convert JSON Schema definitions to OpenAPI specifications',
        description:
            'Effortlessly convert your JSON Schema into OpenAPI 3.0 or 3.1 schemas. This free online converter maps JSON Schema types, validations, and examples directly to OpenAPI components, saving you hours of manual mapping. Perfect for building Swagger/OpenAPI docs from existing JSON Schema. No sign-up, fully client-side.',
        icon: FileJson,
        href: '/json-schema-to-openapi-schema', // اگر روت شما /tools/ دارد، آن را اضافه کنید
        inputLanguage: 'json',
        outputLanguage: 'json', // خروجی OpenAPI معمولاً JSON یا YAML است
        transformFunction: jsonSchemaToOpenApi,
        gradientClasses: 'from-teal-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800',
        // ext: '.json'
    },
    jsonSchemaToTypeScript: {
        type: 'jsonSchemaToTypeScript',
        category: 'converters',
        subCategory: 'json-schema',
        title: 'JSON Schema to TypeScript',
        shortDescription: 'Generate TypeScript types from a JSON Schema',
        description:
            'Automatically generate accurate TypeScript interfaces and type aliases from your JSON Schema. Our online converter handles nested objects, enums, unions, and optional properties. Ideal for frontend projects, API type syncing, and keeping your types in sync with backend validation. Free, fast, and works offline in your browser.',
        icon: FileCode2,
        href: '/json-schema-to-typescript',
        inputLanguage: 'json',
        outputLanguage: 'typescript',
        transformFunction: jsonSchemaToTs,
        gradientClasses: 'from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800',
        // ext: '.ts'
    },
    jsonSchemaToZod: {
        type: 'jsonSchemaToZod',
        category: 'converters',
        subCategory: 'json-schema',
        title: 'JSON Schema to Zod',
        shortDescription: 'Turn a JSON Schema into a Zod validation schema',
        description:
            'Convert your JSON Schema into a fully typed Zod schema for runtime validation in TypeScript. This online tool preserves refinements, defaults, and nested shapes, bridging the gap between static JSON Schema and Zod’s expressive validators. Perfect for form validation, API gateways, and Next.js server actions. No downloads, entirely browser-based.',
        icon: CheckCircle,
        href: '/json-schema-to-zod',
        inputLanguage: 'json',
        outputLanguage: 'typescript', // Zod کدهای تایپ‌اسکریپت تولید می‌کند
        transformFunction: jsonSchemaToZod,
        gradientClasses: 'from-violet-50 to-purple-50 dark:from-gray-900 dark:to-gray-800',
        // ext: '.ts'
    },
    'json-schema-to-protobuf': {
        type: 'json-schema-to-protobuf',
        category: 'converters',
        subCategory: 'json-schema',
        title: 'JSON Schema to Protobuf',
        shortDescription: 'Generate Protocol Buffers definitions from JSON Schema',
        description:
            'Convert your JSON Schema into high-quality Protocol Buffers (proto3) definitions. This free online converter maps JSON types to proto types, handles nested messages, enums, and repeated fields. Perfect for microservices, gRPC APIs, and sharing data schemas across systems. No installation required, works directly in your browser.',
        icon: FileCode,          // آیکون مناسب برای کد proto
        href: '/json-schema-to-protobuf',
        inputLanguage: 'json',
        outputLanguage: 'text',  // protobuf فرمت متنی (proto) است
        transformFunction: jsonSchemaToProtobuf,
        gradientClasses: 'from-cyan-50 to-blue-50 dark:from-gray-900 dark:to-gray-800',
    },
};