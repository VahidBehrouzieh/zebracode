// src/app/date-time/timestamp-converter/page.tsx
import { Metadata } from 'next';
import TimestampConverter from '@/components/tools/TimestampConverter';
import { getToolConfig} from "@/components/utils/tools/helper";

const TOOL_TYPE = 'timestamp-converter';

export async function generateMetadata(): Promise<Metadata> {
    const tool = getToolConfig(TOOL_TYPE);
    if (!tool) return { title: 'Not Found' };

    const title = `${tool.title} – Free Online Converter | ZebraCode`;
    const description = tool.shortDescription || tool.description;
    const url = 'https://zebracode.ir/timestamp'; // جایگزین شود

    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: { title, description, url, siteName: 'ZebraCode', type: 'website' },
        twitter: { card: 'summary_large_image', title, description },
    };
}

export default function Page() {
    return <TimestampConverter />;
}