// export type ToolType = {
//     icon: React.ReactNode;
//     title: string;
//     description: string;
//     href?: string;
//     onClick?: () => void;
//     category?: string;
// };

import React, {JSX} from "react";
import {LucideIcon} from "lucide-react";

export interface ToolType {
  title: string;
  shortDescription: string;
  description: string;
  icon: LucideIcon;
  href: string;
  category: string;
  subCategory: string;
  type? :string;
}
export interface Feature {
    icon: string;       // معمولاً یک ایموجی یا متن مثل "🔒"
    title: string;      // عنوان کوتاه ویژگی
    description: string;// توضیح ویژگی
}
export interface ToolMeta {
    // اطلاعات ضروری برای لیست و صفحه
    type: string; // شناسۀ یکتا مثل 'cssToJs'
    category: string; // e.g. 'converters'
    subCategory: string; // e.g. 'css'
    title: string;
    shortDescription: string;
    description: string;
    icon: React.ComponentType<any>; // یا LucideIcon (مثلاً Code از lucide-react)
    href: string;
    // اطلاعات اضافه برای صفحهٔ تبدیل
    inputLanguage: string;
    outputLanguage: string;
    transformFunction: (input: string, secondaryInput?: string) => any;
    // فیلدهای اختیاری transform
    secondaryTransformFunction?: (input: string, secondaryInput?: string) => any;
    secondaryButtonText?: string;
    secondaryOutputLanguage?: string;
    requiresSecondaryInput?: boolean;
    secondaryInputTitle?: string;
    secondarySampleCode?: string;
    validateInput?: (input: string) => boolean;
    validationErrorMessage?: string;
    features?: Feature[];
    gradientClasses?: string;
    useCardStyle?: boolean;
    normalHeight?: string;
    maxHeight?: string;
    // نمونه‌های اختصاصی (در صورت نیاز override)
    sampleCodeSimple?: string;
    sampleCodeComplex?: string;
    extraContent?: {
        description?: string;
        faq?: { question: string; answer: string }[];
    };
    structuredData?: Record<string, any>;
}