importScripts('./workers/sass.sync.min.js');

self.onmessage = function (event) {
    console.log("Worker received:", event.data);

    const { scss } = event.data;
    if (!scss) {
        self.postMessage({ success: false, error: 'No SCSS provided' });
        return;
    }

    try {
        Sass.compile(scss, function (result) {
            console.log("Sass compiled result:", result);

            if (result.status === 0) {
                // موفقیت
                self.postMessage({
                    success: true,
                    css: result.text
                });
            } else {
                // خطا
                self.postMessage({
                    success: false,
                    error: result.message || 'Compilation failed'
                });
            }
        });
    } catch (error) {
        console.error("Worker Compilation Error:", error);
        self.postMessage({
            success: false,
            error: error?.message || String(error)
        });
    }
};
