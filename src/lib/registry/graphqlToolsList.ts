// مسیر: src/lib/graphqlTransformersRegistry.ts

import { FileType, FileCode2, Coffee, Database, FileJson, FileSignature, Puzzle } from "lucide-react";
import { ToolMeta } from "@/types/types";

// فرض می‌کنیم توابع تبدیل خود را در چنین فایلی دارید
import {
    advancedGraphqlTransform
} from "@/lib/tools-transformer/advancedGraphqlTransformers";
import {Component} from "react";

export const GraphqlToolsList: Record<string, ToolMeta> = {
    // ---------- ابزارهای پیشین ----------
    graphqlToFlow: {
        type: 'graphqlToFlow',
        category: 'converters',
        subCategory: 'graphql',
        title: 'GraphQL to Flow',
        shortDescription: 'Convert GraphQL schema to Flow type definitions',
        description:
            'Easily convert your GraphQL schema into Flow type definitions. This free online tool parses your schema and outputs precise Flow types for queries, mutations, and subscriptions, ensuring end-to-end type safety in your JavaScript projects. No sign-up required, all processing happens locally in your browser.',
        icon: FileType,
        href: '/graphql-to-flow',
        inputLanguage: 'graphql',
        outputLanguage: 'flow',
        transformFunction: (input) => advancedGraphqlTransform(input, 'flow'),
        gradientClasses: 'from-yellow-50 to-orange-50 dark:from-gray-900 dark:to-gray-800',
    },
    graphqlToTypeScript: {
        type: 'graphqlToTypeScript',
        category: 'converters',
        subCategory: 'graphql',
        title: 'GraphQL to TypeScript',
        shortDescription: 'Generate TypeScript types from a GraphQL schema',
        description:
            'Automatically generate TypeScript types and interfaces from your GraphQL schema. This converter supports enums, unions, interfaces, and custom scalars, giving you fully typed frontend code that mirrors your API. Perfect for React, Vue, or Node.js projects using Apollo or URQL. Free, fast, and entirely client-based.',
        icon: FileCode2,
        href: '/graphql-to-typescript',
        inputLanguage: 'graphql',
        outputLanguage: 'typescript',
        transformFunction: (input) => advancedGraphqlTransform(input, 'typescript'),
        gradientClasses: 'from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800',
    },
    graphqlToJava: {
        type: 'graphqlToJava',
        category: 'converters',
        subCategory: 'graphql',
        title: 'GraphQL to Java',
        shortDescription: 'Map your GraphQL schema to Java classes',
        description:
            'Transform your GraphQL schema into clean, well-structured Java classes with this online converter. Ideal for backend Java developers who need to model their domain objects based on a GraphQL API. Get fields, types, and relationships mapped directly into POJOs. No downloads, no registration—just paste your schema and copy the Java code.',
        icon: Coffee,
        href: '/graphql-to-java',
        inputLanguage: 'graphql',
        outputLanguage: 'java',
        transformFunction: (input) => advancedGraphqlTransform(input, 'java'),
        gradientClasses: 'from-red-50 to-rose-50 dark:from-gray-900 dark:to-gray-800',
    },

    // ---------- ابزارهای جدید ----------
    graphqlToTypeScriptMongoDB: {
        type: 'graphqlToTypeScriptMongoDB',
        category: 'converters',
        subCategory: 'graphql',
        title: 'GraphQL to TypeScript MongoDB',
        shortDescription: 'Generate TypeScript models for MongoDB from GraphQL schema',
        description:
            'Convert your GraphQL schema into TypeScript interfaces and models optimized for MongoDB documents. This tool maps GraphQL types to MongoDB document structures, adding appropriate decorators or schema definitions for Mongoose or the native MongoDB Node.js driver. Free, fast, and all processing happens in your browser.',
        icon: Database,
        href: '/graphql-to-typescript-mongodb',
        inputLanguage: 'graphql',
        outputLanguage: 'typescript',
        transformFunction: (input) => advancedGraphqlTransform(input, 'typescript-mongodb'),
        gradientClasses: 'from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800',
    },
    graphqlSchemaAst: {
        type: 'graphqlSchemaAst',
        category: 'converters',
        subCategory: 'graphql',
        title: 'GraphQL Schema AST',
        shortDescription: 'Output the Abstract Syntax Tree of your GraphQL schema',
        description:
            'Parse your GraphQL schema and obtain its Abstract Syntax Tree (AST) in JSON format. This online tool is perfect for debugging, building schema analysis tools, or developing your own GraphQL code generators. Works locally in your browser, no server uploads required.',
        icon: FileJson,
        href: '/graphql-to-schema-ast',
        inputLanguage: 'graphql',
        outputLanguage: 'json',
        transformFunction: (input) => advancedGraphqlTransform(input, 'schema-ast'),
        gradientClasses: 'from-purple-50 to-violet-50 dark:from-gray-900 dark:to-gray-800',
        sampleCodeSimple: `type Query {
  hello: String
}`,
        sampleCodeComplex: `scalar DateTime
enum Role { ADMIN EDITOR VIEWER }
interface Node { id: ID! }
type User implements Node {
  id: ID!
  name: String!
  posts: [Post!]!
}
type Post implements Node {
  id: ID!
  title: String!
  author: User!
}
type Query { user(id: ID!): User }`,
    },
    graphqlResolversSignature: {
        type: 'graphqlResolversSignature',
        category: 'converters',
        subCategory: 'graphql',
        title: 'GraphQL Resolvers Signature',
        shortDescription: 'Generate resolver function signatures from GraphQL schema',
        description:
            'Automatically generate TypeScript resolver function signatures based on your GraphQL schema. This converter provides the boilerplate code for resolvers with correct argument types, return types, and context typing. Save time and reduce errors when implementing a GraphQL server with Apollo, Express, or any other framework. Free and client-side.',
        icon: FileSignature,
        href: '/graphql-to-resolvers-signature',
        inputLanguage: 'graphql',
        outputLanguage: 'typescript',
        transformFunction: (input) => advancedGraphqlTransform(input, 'resolvers-signature'),
        gradientClasses: 'from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-gray-800',
    },
    graphqlIntrospectionJson: {
        type: 'graphqlIntrospectionJson',
        category: 'converters',
        subCategory: 'graphql',
        title: 'GraphQL Introspection JSON',
        shortDescription: 'Convert GraphQL schema to introspection JSON',
        description:
            'Generate a standard GraphQL introspection query result from your schema definition. This JSON can be used with GraphQL IDEs, code generators, or other tools that expect an introspection format. Instant, free, and performed entirely within your browser.',
        icon: FileJson,
        href: '/graphql-to-introspection-json',
        inputLanguage: 'graphql',
        outputLanguage: 'json',
        transformFunction: (input) => advancedGraphqlTransform(input, 'introspection-json'),
        gradientClasses: 'from-teal-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800',
    },
    graphqlFragmentMatcher: {
        type: 'graphqlFragmentMatcher',
        category: 'converters',
        subCategory: 'graphql',
        title: 'GraphQL Fragment Matcher',
        shortDescription: 'Generate a fragment matcher config from a GraphQL schema',
        description:
            'Create a fragment matcher configuration (possible types map) for Apollo Client from your GraphQL schema. This JSON tells the cache how to match interfaces and unions to concrete types, crucial for fragment matching in union queries. This online tool generates the config directly from your schema, no manual mapping needed. Free and unlimited.',
        icon: Puzzle,
        href: '/graphql-to-fragment-matcher',
        inputLanguage: 'graphql',
        outputLanguage: 'json',
        transformFunction: (input) => advancedGraphqlTransform(input, 'fragment-matcher'),
        gradientClasses: 'from-amber-50 to-yellow-50 dark:from-gray-900 dark:to-gray-800',
    },
    graphqlToComponents: {
        type: 'graphqlToComponents',
        category: 'converters',
        subCategory: 'graphql',
        title: 'GraphQL to Components',
        shortDescription: 'Generate React/Vue components from GraphQL schema',
        description:
            'Turn your GraphQL schema into ready-to-use React or Vue components. This free online tool generates form components, list views, and detail components based on types and queries, accelerating frontend development. All processing happens locally—no sign-up required.',
        icon: FileType,   // آیکون پیشنهادی از lucide-react
        href: '/graphql-to-components',
        inputLanguage: 'graphql',
        outputLanguage: 'javascript',   // یا 'typescript' بسته به نیاز
        transformFunction: (input) => advancedGraphqlTransform(input, 'components'),
        gradientClasses: 'from-fuchsia-50 to-pink-50 dark:from-gray-900 dark:to-gray-800',
    },
};