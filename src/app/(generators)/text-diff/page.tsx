import { Metadata } from 'next';
import {generateToolMetadata} from "@/lib/seo";
import TextDiff from "@/components/tools/TextDiff";

const TOOL_TYPE = 'text-diff';
export async function generateMetadata(): Promise<Metadata> {
    return generateToolMetadata(TOOL_TYPE);
}

export default function Page() {
    return <TextDiff />;
}