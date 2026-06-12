import { generateToolMetadata } from '@/lib/seo';
import ToolPageClient from '@/components/pages/ToolPageClient';
import { Metadata } from 'next';

const TOOL_TYPE = 'jsonToMongoose';

export async function generateMetadata(): Promise<Metadata> {
    return generateToolMetadata(TOOL_TYPE);
}

export default function Page() {
    return <ToolPageClient toolType={TOOL_TYPE} />;
}