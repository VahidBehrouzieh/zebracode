// src/app/date-time/page.tsx
import { Metadata } from 'next';
import DateTimeSuite from '@/components/tools/DateTimeSuite';
import {getToolConfig} from "@/components/utils/tools/helper";


const TOOL_TYPE = 'date-diff';

export async function generateMetadata(): Promise<Metadata> {
    const tool = getToolConfig(TOOL_TYPE);
    if (!tool) return { title: 'Not Found' };
    return {
        title: `${tool.title} - ZebraCode`,
        description: tool.shortDescription || tool.description,
        alternates: { canonical: 'https://zebracode.ir/date-time' },
        openGraph: {
            title: tool.title,
            description: tool.shortDescription,
            url: 'https://zebracode.ir/date-time',
            type: 'website',
        },
    };
}

export default function Page() {
    return <DateTimeSuite />;
}