// src/app/lorem-generator/page.tsx
import { Metadata } from 'next';
import LoremGenerator from '@/components/tools/LoremGenerator';
import {generateToolMetadata} from "@/lib/seo";

const TOOL_TYPE = 'lorem-generator';
export async function generateMetadata(): Promise<Metadata> {
    return generateToolMetadata(TOOL_TYPE);
}

export default function Page() {
    return <LoremGenerator />;
}