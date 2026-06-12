// src/components/layout/ConditionalSlider.tsx
'use client';

import { usePathname } from 'next/navigation';

// مسیرهایی که اسلایدر باید در آن‌ها نمایش داده شود
const NOT_ALLOWED_PATHS = ['/', '/about/'];

export default function ConditionalSlider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // اگر مسیر فعلی در لیست مجاز نبود، چیزی نمایش نده
    if (!NOT_ALLOWED_PATHS.includes(pathname)) {
        return <>{children}</>;
    }
    return null;

}