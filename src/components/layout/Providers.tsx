// 🚀 این خط اجباری است! حتماً در بالاترین قسمت فایل باشد
'use client';

import { ThemeProvider } from 'next-themes';
import { ReactNode, useEffect, useState } from 'react';

export function Providers({ children }: { children: ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <ThemeProvider attribute="class"
                       defaultTheme="system"
                       enableSystem
                       storageKey="zebracode-theme"
                       disableTransitionOnChange>
            {children}
        </ThemeProvider>
    );
}