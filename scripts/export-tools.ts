import { writeFileSync } from 'fs';
import { AllToolsList } from '../src/lib/registry/tools';

const tools = Object.values(AllToolsList).map((tool) => ({
    path: tool.href.replace(/^\//, ''),
    title: tool.title,
    lastmod: new Date().toISOString().split('T')[0],
}));

writeFileSync('scripts/tools.json', JSON.stringify(tools, null, 2), 'utf8');
console.log('✅ tools.json generated');