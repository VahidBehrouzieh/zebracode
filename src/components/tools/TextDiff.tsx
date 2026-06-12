// src/components/TextDiff.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { ArrowRightLeft, Trash2, Copy, Check, Eye, EyeOff, AlignLeft, AlignRight } from 'lucide-react';
import CodeMirrorEditorComponent from '@/components/CodeMirrorEditorComponent';
import { useTheme } from 'next-themes';

// ======================== الگوریتم LCS ========================
function lcsMatrix(a: string[], b: string[]): number[][] {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (a[i - 1] === b[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    return dp;
}

interface DiffLine {
    type: 'added' | 'removed' | 'unchanged';
    value: string;
    lineNum1?: number;
    lineNum2?: number;
}

function diffLines(text1: string, text2: string): DiffLine[] {
    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');
    const dp = lcsMatrix(lines1, lines2);

    const result: DiffLine[] = [];
    let i = lines1.length;
    let j = lines2.length;

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && lines1[i - 1] === lines2[j - 1]) {
            result.unshift({ type: 'unchanged', value: lines1[i - 1], lineNum1: i, lineNum2: j });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            result.unshift({ type: 'added', value: lines2[j - 1], lineNum2: j });
            j--;
        } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
            result.unshift({ type: 'removed', value: lines1[i - 1], lineNum1: i });
            i--;
        }
    }
    return result;
}

// ======================== کامپوننت ========================
export default function TextDiff() {
    const [text1, setText1] = useState('');
    const [text2, setText2] = useState('');
    const [diffResult, setDiffResult] = useState<DiffLine[] | null>(null);
    const [copied, setCopied] = useState(false);
    const [hideUnchanged, setHideUnchanged] = useState(false);
    const [isRTL, setIsRTL] = useState(false);
    const { theme } = useTheme();

    const handleCompare = useCallback(() => {
        const result = diffLines(text1, text2);
        setDiffResult(result);
        setCopied(false);
    }, [text1, text2]);

    const handleSwap = useCallback(() => {
        setText1(text2);
        setText2(text1);
        setDiffResult(null);
    }, [text1, text2]);

    const handleClear = useCallback(() => {
        setText1('');
        setText2('');
        setDiffResult(null);
    }, []);

    const handleCopy = useCallback(async () => {
        if (!diffResult) return;
        const output = diffResult
            .filter(d => !hideUnchanged || d.type !== 'unchanged')
            .map(d => {
                const prefix = d.type === 'added' ? '+' : d.type === 'removed' ? '-' : ' ';
                const line1 = d.lineNum1 !== undefined ? `${String(d.lineNum1).padStart(4)} ` : '     ';
                const line2 = d.lineNum2 !== undefined ? `${String(d.lineNum2).padStart(4)} ` : '     ';
                return `${line1}${line2}${prefix} ${d.value}`;
            })
            .join('\n');
        await navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [diffResult, hideUnchanged]);

    const direction = isRTL ? 'rtl' : 'ltr';

    // دکمه RTL/LTR برای toolbar – اکنون `disabled` دارد
    const rtlButton = {
        key: 'rtl-toggle',
        icon: isRTL ? <AlignLeft size={18} /> : <AlignRight size={18} />,
        title: isRTL ? 'Switch to LTR' : 'Switch to RTL',
        onClick: () => setIsRTL(!isRTL),
        disabled: false,   // <-- اضافه شد
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-3">
                    <ArrowRightLeft size={32} className="text-violet-500" />
                    Text Diff Checker
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Compare two texts and see the differences line by line
                </p>
            </div>

            {/* دو ناحیه ورودی با CodeMirror و دکمه RTL یکپارچه */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Original Text
                    </label>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden h-[400px]">
                        <CodeMirrorEditorComponent
                            theme={theme}
                            language="text"
                            value={text1}
                            onChange={(v) => { setText1(v ?? ''); setDiffResult(null); }}
                            readOnly={false}
                            toolbarConfig={{ copy: true, clear: true, paste: true, save: true }}
                            rightToolbarButtons={[rtlButton]}
                            direction={direction}
                        />
                    </div>
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Modified Text
                    </label>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden h-[400px]">
                        <CodeMirrorEditorComponent
                            theme={theme}
                            language="text"
                            value={text2}
                            onChange={(v) => { setText2(v ?? ''); setDiffResult(null); }}
                            readOnly={false}
                            toolbarConfig={{ copy: true, clear: true, paste: true, save: true }}
                            rightToolbarButtons={[rtlButton]}
                            direction={direction}
                        />
                    </div>
                </div>
            </div>

            {/* دکمه‌ها */}
            <div className="flex flex-wrap justify-center gap-3">
                <button onClick={handleCompare} className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl shadow-md transition-colors flex items-center gap-2">
                    <ArrowRightLeft size={20} /> Compare
                </button>
                <button onClick={handleSwap} className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl transition-colors flex items-center gap-2">
                    <ArrowRightLeft size={20} className="rotate-90" /> Swap
                </button>
                <button onClick={handleClear} className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl transition-colors flex items-center gap-2">
                    <Trash2 size={20} /> Clear
                </button>
            </div>

            {/* نتیجه Diff */}
            {diffResult && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Diff Result</h2>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setHideUnchanged(prev => !prev)}
                                className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                            >
                                {hideUnchanged ? <Eye size={16} /> : <EyeOff size={16} />}
                                {hideUnchanged ? 'Show unchanged' : 'Hide unchanged'}
                            </button>
                            <button onClick={handleCopy} className={`p-2 rounded-lg transition-colors ${copied ? 'bg-green-100 dark:bg-green-900 text-green-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                {copied ? <Check size={18} /> : <Copy size={18} />}
                            </button>
                        </div>
                    </div>
                    <div className="p-4 font-mono text-sm overflow-x-auto" dir={direction}>
            <pre className="whitespace-pre-wrap break-all">
              {(hideUnchanged
                      ? diffResult.filter(d => d.type !== 'unchanged')
                      : diffResult
              ).map((d, i) => (
                  <div
                      key={i}
                      className={`px-2 py-0.5 flex ${
                          d.type === 'added'
                              ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200'
                              : d.type === 'removed'
                                  ? 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'
                                  : ''
                      }`}
                      dir="auto"
                  >
                  <span className="inline-block w-10 text-gray-400 dark:text-gray-500 select-none text-right mr-2">
                    {d.lineNum1 !== undefined ? String(d.lineNum1) : ''}
                  </span>
                      <span className="inline-block w-10 text-gray-400 dark:text-gray-500 select-none text-right mr-2">
                    {d.lineNum2 !== undefined ? String(d.lineNum2) : ''}
                  </span>
                      <span className="select-none mr-2">
                    {d.type === 'added' ? '+' : d.type === 'removed' ? '-' : ' '}
                  </span>
                      <span>{d.value}</span>
                  </div>
              ))}
            </pre>
                    </div>
                </div>
            )}
        </div>
    );
}