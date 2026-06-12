import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import Script from 'next/script';

import { Providers } from "@/components/layout/Providers";
import AppLayout from "@/components/layout/AppLayout";

export default function RootLayout({
                                       children,
                                       params: { locale }
                                   }: {
    children: React.ReactNode;
    params: { locale: string };
}) {
    return (
        <html lang="en" suppressHydrationWarning>
        <head>
            {/* اسکریپت تنظیم تم (قبل از رندر) */}
            <script
                dangerouslySetInnerHTML={{
                    __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('zebracode-theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch(e) {}
              })();
            `,
                }}
            />
        </head>
        <body className="font-sans antialiased">
        <Providers>
            <AppLayout locale={locale}>
                {children}
            </AppLayout>
        </Providers>

        {/* اسکریپت تبلیغات یگانه‌نت – با next/script */}
        <Script id="yektanet-script" strategy="afterInteractive">
            {`
              try {
                !function(e,t,n){e.yektanetAnalyticsObject=n,e[n]=e[n]||function(){e[n].q.push(arguments)},e[n].q=e[n].q||[];var a=t.getElementsByTagName("head")[0],r=new Date,c="https://cdn.yektanet.com/superscript/kNlmywKp/native-rocket-wp.ir-41043/yn_pub.js?v="+r.getFullYear().toString()+"0"+r.getMonth()+"0"+r.getDate()+"0"+r.getHours(),s=t.createElement("link");s.rel="preload",s.as="script",s.href=c,a.appendChild(s);var l=t.createElement("script");l.async=!0,l.src=c,a.appendChild(l)}(window,document,"yektanet");
              } catch(e) {
                console.error('Yektanet ad script failed to load:', e);
              }
            `}
        </Script>
        </body>
        </html>
    );
}