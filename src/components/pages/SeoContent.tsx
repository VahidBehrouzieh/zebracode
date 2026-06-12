// src/components/SeoContent.tsx
'use client';

import React from 'react';
import Script from 'next/script';
import {getDefaultFaq} from "@/lib/seo";

interface FAQ {
    question: string;
    answer: string;
}

interface Props {
    subCategory: string;
    description?: string; // توضیحات متنی (HTML ساده)
    customFaq?: FAQ[];
}

export default function SeoContent({ subCategory, description, customFaq }: Props) {
    const faq = customFaq && customFaq.length > 0 ? customFaq : getDefaultFaq(subCategory);

    if (!description && faq.length === 0) return null;

    const jsonLd = faq.length > 0 ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faq.map(item => ({
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": item.answer
            }
        }))
    } : null;

    return (
        <>
            {/* اسکیمای JSON‑LD */}
            {jsonLd && (
                <Script
                    id={`faq-schema-${subCategory}`}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}

            <div className="mt-16 max-w-4xl mx-auto space-y-12 px-4">
                {/* توضیحات */}
                {description && (
                    <div className="prose dark:prose-invert max-w-none bg-white dark:bg-gray-800 rounded-2xl p-8 shadow">
                        <h2 className="text-2xl font-bold mb-4">About this tool</h2>
                        <div dangerouslySetInnerHTML={{ __html: description }} />
                    </div>
                )}

                {/* FAQ */}
                {faq.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
                        <div className="space-y-4">
                            {faq.map((item, idx) => (
                                <details key={idx} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 cursor-pointer group">
                                    <summary className="text-lg font-semibold list-none flex justify-between items-center">
                                        {item.question}
                                        <svg className="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </summary>
                                    <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">{item.answer}</p>
                                </details>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}