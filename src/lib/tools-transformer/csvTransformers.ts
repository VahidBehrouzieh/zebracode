// path: src/lib/csvTransformers.ts
import Papa from 'papaparse';

export async function csvToJson(csv: string): Promise<string> {
    if (!csv.trim()) return '';
    return new Promise((resolve, reject) => {
        Papa.parse(csv, {
            header: true, // ردیف اول را به عنوان کلید در نظر می‌گیرد
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0 && results.data.length === 0) {
                    reject(new Error(results.errors[0].message));
                } else {
                    resolve(JSON.stringify(results.data, null, 2));
                }
            },
            error: (error: any) => reject(new Error(error.message))
        });
    });
}

export async function jsonToCsv(jsonStr: string): Promise<string> {
    if (!jsonStr.trim()) return '';
    try {
        const data = JSON.parse(jsonStr);
        // Papa.unparse آرایه‌ای از آبجکت‌ها را به CSV تبدیل می‌کند
        const csv = Papa.unparse(data);
        return csv;
    } catch (e: any) {
        throw new Error(`داده وارد شده JSON معتبری نیست:\n${e.message}`);
    }
}