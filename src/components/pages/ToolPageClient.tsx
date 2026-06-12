'use client';
import { getToolConfig} from "@/components/utils/tools/helper";
import Converter from '@/components/tools/converter';

export default function ToolPageClient({ toolType }: { toolType: string }) {
    const config = getToolConfig(toolType);
    if (!config) return <div>ابزار پیدا نشد</div>;
    return <Converter config={config} />;
}