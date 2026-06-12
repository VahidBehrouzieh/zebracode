// src/components/pages/HomePageClient.tsx
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Terminal, LayoutGrid, List, X, ArrowRight, ChevronDown } from 'lucide-react';
import { AllToolsList } from '@/lib/registry/tools';
import { ToolMeta } from '@/types/types';
import renderIcon from '@/components/layout/renderIcon';
import {BASE_URL} from "@/lib/env";

// ---------- تایپ‌های جدید ----------
interface GroupedSubCategory {
    title: string;
    items: ToolMeta[];
}

interface GroupedCategory {
    title: string;
    items: GroupedSubCategory[];
}

// ---------- تابع گروه‌بندی ----------
const getGroupedTools = (tools: ToolMeta[]): GroupedCategory[] => {
    const groups: Record<string, Record<string, ToolMeta[]>> = {};

    tools.forEach(tool => {
        const cat = (tool.category || 'other').toUpperCase();
        const sub = (tool.subCategory || 'general').toUpperCase();

        if (!groups[cat]) groups[cat] = {};
        if (!groups[cat][sub]) groups[cat][sub] = [];
        groups[cat][sub].push(tool);
    });

    return Object.entries(groups).map(([category, subGroups]) => ({
        title: category,
        items: Object.entries(subGroups).map(([sub, tools]) => ({
            title: sub,
            items: tools,
        })),
    }));
};

export default function HomePageClient() {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('all');

    // تمام ابزارها
    const allTools = useMemo(() => Object.values(AllToolsList), []);

    // استخراج زیرمجموعه‌های یکتا
    const categories = useMemo(() => {
        const cats = new Set<string>();
        allTools.forEach(tool => {
            if (tool.subCategory) cats.add(tool.subCategory);
        });
        return Array.from(cats).sort();
    }, [allTools]);

    // ابزارهای فیلترشده بر اساس جستجو و دسته‌بندی
    const filteredTools = useMemo(() => {
        return allTools.filter(tool => {
            const matchCategory = activeCategory === 'all' || tool.subCategory === activeCategory;
            const matchSearch =
                !searchTerm ||
                tool.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tool.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tool.description?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchCategory && matchSearch;
        });
    }, [allTools, activeCategory, searchTerm]);

    // گروه‌بندی ابزارهای فیلترشده
    const groupedTools = useMemo(() => getGroupedTools(filteredTools), [filteredTools]);

    return (
        <div
            className="min-h-screen bg-white dark:bg-[#0d1117] text-gray-900 dark:text-[#c9d1d9] font-sans transition-colors duration-300">
            {/* هیرو */}
            <section
                className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-[#0d1117] py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-4 flex items-center justify-center gap-3">
                        <Terminal size={36} className="text-blue-600 dark:text-blue-400"/>
                        <span
                            className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            ZebraCode
                        </span>
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Free online developer tools — convert, format, and transform your data instantly.
                    </p>
                </div>
            </section>

            {/* نوار جستجو و فیلترها */}
            <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-10">
                <div
                    className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                            <input
                                type="text"
                                placeholder="Search tools..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    <X size={18}/>
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                            >
                                <LayoutGrid size={20}/>
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                            >
                                <List size={20}/>
                            </button>
                        </div>
                    </div>

                    {/* فیلترهای دسته‌بندی */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        <button
                            onClick={() => setActiveCategory('all')}
                            className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
                                activeCategory === 'all'
                                    ? 'bg-blue-600 text-white shadow'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            All
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-3 py-1.5 text-sm rounded-full font-medium capitalize transition-colors ${
                                    activeCategory === cat
                                        ? 'bg-blue-600 text-white shadow'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* نمایش گروه‌بندی‌ها */}
            <main className="max-w-6xl mx-auto px-4 pb-20 mt-8">
                {groupedTools.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                        No tools found for &quot;{searchTerm}&quot;
                    </div>
                ) : (
                    groupedTools.map(category => (
                        <div key={category.title} className="mb-10">
                            {/* عنوان دستهٔ اصلی – همیشه باز */}
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
                                {category.title}
                            </h2>

                            {/* زیرگروه‌ها */}
                            {category.items.map(subGroup => (
                                <div key={subGroup.title} className="mb-8">
                                    {/* عنوان زیرگروه – فقط نمایش، بدون دکمه */}
                                    <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-3 uppercase tracking-wider">
                                        {subGroup.title}
                                    </h3>

                                    {/* ابزارهای زیرگروه */}
                                    {viewMode === 'grid' ? (
                                        <div
                                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {subGroup.items.map(tool => (
                                                <ToolCard key={tool.href} tool={tool}/>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {subGroup.items.map(tool => (
                                                <ToolListItem key={tool.href} tool={tool}/>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))
                )}
            </main>
        </div>
    );
}

// ---------- کارت گرید ----------
function ToolCard({ tool }: { tool: ToolMeta }) {
    const Icon = tool.icon;
    return (
        <Link
            href={BASE_URL+tool.href}
            className="group relative bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-500/50 transition-all duration-200 flex flex-col"
        >
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                {renderIcon(Icon, "w-5 h-5")}
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{tool.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 flex-1">{tool.shortDescription}</p>
            <div className="mt-3 flex items-center text-xs font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                Open tool <ArrowRight size={14} className="ml-1" />
            </div>
        </Link>
    );
}

// ---------- آیتم لیست ----------
function ToolListItem({ tool }: { tool: ToolMeta }) {
    const Icon = tool.icon;
    return (
        <Link
            href={tool.href}
            className="flex items-center gap-4 px-4 py-3 bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1c2128] transition-colors group"
        >
            <div className="flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                {renderIcon(Icon, "w-4 h-4")}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{tool.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{tool.shortDescription}</p>
            </div>
            <ArrowRight size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
        </Link>
    );
}