// src/lib/renderIcon.tsx
import React from 'react';

/**
 * رندر ایمن یک آیکون که می‌تواند کامپوننت (Function/Class/ForwardRef/Memo) یا المان JSX باشد.
 */
export default function renderIcon(Icon: any, className?: string): React.ReactNode {
    if (!Icon) return null;
    if (React.isValidElement(Icon)) return Icon;

    // اگر یک کامپوننت React معتبر باشد (Function, Class, ForwardRef, Memo)
    const isValidComponentType =
        typeof Icon === 'function' ||
        (typeof Icon === 'object' &&
            Icon !== null &&
            (Icon.$$typeof === Symbol.for('react.forward_ref') ||
                Icon.$$typeof === Symbol.for('react.memo')));

    if (isValidComponentType) {
        try {
            return React.createElement(Icon, { className });
        } catch (error) {
            console.error('Failed to create icon element:', Icon, error);
            return null;
        }
    }

    console.warn('Unrecognised icon type:', Icon);
    return null;
}