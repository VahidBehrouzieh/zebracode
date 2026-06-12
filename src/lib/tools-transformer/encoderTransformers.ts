// path: src/lib/encoderTransformers.ts

export async function base64Encode(text: string): Promise<string> {
    if (!text) return '';
    try {
        // پشتیبانی از کاراکترهای یونیکد (مثل فارسی و ایموجی)
        return btoa(unescape(encodeURIComponent(text)));
    } catch (e) {
        throw new Error('خطا در انکد کردن متن');
    }
}

export async function base64Decode(base64: string): Promise<string> {
    if (!base64.trim()) return '';
    try {
        return decodeURIComponent(escape(atob(base64.trim())));
    } catch (e) {
        throw new Error('رشته وارد شده قالب Base64 معتبری ندارد.');
    }
}

export async function urlEncode(text: string): Promise<string> {
    if (!text) return '';
    return encodeURIComponent(text);
}

export async function urlDecode(url: string): Promise<string> {
    if (!url.trim()) return '';
    try {
        return decodeURIComponent(url);
    } catch (e) {
        throw new Error('URL وارد شده معتبر نیست.');
    }
}

export async function jwtDecode(token: string): Promise<string> {
    if (!token.trim()) return '';
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('توکن JWT باید شامل 3 بخش (Header, Payload, Signature) باشد که با نقطه از هم جدا شده‌اند.');
        }

        // جایگزینی کاراکترهای خاص Base64Url
        const decodePart = (part: string) => {
            const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(decodeURIComponent(escape(atob(base64))));
        };

        const header = decodePart(parts[0]);
        const payload = decodePart(parts[1]);

        return JSON.stringify({ Header: header, Payload: payload }, null, 2);
    } catch (e: any) {
        throw new Error(`ساختار توکن نامعتبر است: ${e.message}`);
    }
}