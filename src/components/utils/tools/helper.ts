import { ToolMeta } from "@/types/types";
import { AllToolsList } from "@/lib/registry/tools";
import { samples } from "@/lib/registry/samples";

export function getToolConfig(toolType: string): ToolMeta | undefined {
    // AllToolsList باید یک Record<string, ToolMeta> باشد
    const meta = (AllToolsList as Record<string, ToolMeta>)[toolType];
    if (!meta) return undefined;

    // نمونه‌های پیش‌فرض بر اساس زبان ورودی (json, css, graphql, ...)
    const langSamples = samples[meta.inputLanguage as keyof typeof samples] || samples.json;

    return {
        ...meta, // تمام فیلدهای ToolMeta از جمله type, category, shortDescription, href ... حفظ می‌شوند
        sampleCodeSimple: meta.sampleCodeSimple ?? langSamples.simple,
        sampleCodeComplex: meta.sampleCodeComplex ?? langSamples.complex,
    };
}