// src/lib/registry/samples.ts

export const samples = {
    json: {
        simple: `{ "name": "Ali", "age": 28 }`,
        complex: `{ "userId": "u_123", "profile": { "firstName": "Sara" }, "roles": ["user"] }`,
    },
    css: {
        simple: `.button { color: red; }`,
        complex: `.card { background: white; border-radius: 8px; }`,
    },
    html: {
        simple: `<div class="container"><h1>Hello World</h1></div>`,
        complex: `<div class="page"><header>Logo</header><main><p>Welcome!</p></main></div>`,
    },
    graphql: {
        simple: `query { user(id: "1") { name } }`,
        complex: `query GetPost($id: ID!) { post(id: $id) { title, author { name } } }`,
    },
    javascript: {
        simple: `const greet = (name) => \`Hello, \${name}!\`;`,
        complex: `async function fetchUser(id) { const res = await fetch(\`/api/users/\${id}\`); return res.json(); }`,
    },
    typescript: {
        simple: `interface User { name: string; age: number; }`,
        complex: `type ApiResponse<T> = { data: T; success: boolean; };`,
    },
    text: {
        simple: 'Sample plain text for conversion.',
        complex: `Line 1: This is a sample text.\nLine 2: Used for format conversions.`,
    },
    // ... هر نمونهٔ عمومی دیگری که لازم دارید (yaml, toml, xml, ...)
};