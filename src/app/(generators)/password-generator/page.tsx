import { Metadata } from 'next';
import PasswordGenerator from '@/components/tools/PasswordGenerator';
import {generateToolMetadata} from "@/lib/seo";

const TOOL_TYPE = 'password-generator';
export async function generateMetadata(): Promise<Metadata> {
    return generateToolMetadata(TOOL_TYPE);
}

export default function Page() {
    return <PasswordGenerator />;
}