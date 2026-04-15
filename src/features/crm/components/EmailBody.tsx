import { useEffect, useRef, useState } from 'react';

interface Props {
    html?: string;
    text?: string;
}

/**
 * Safely renders email content using an iframe for CSS isolation.
 * Prevents third-party email styles from affecting the CRM application layout.
 */
export default function EmailBody({ html, text }: Props) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [iframeHeight, setIframeHeight] = useState('100px');

    useEffect(() => {
        if (!html || !iframeRef.current) return;

        const updateHeight = () => {
            const iframe = iframeRef.current;
            if (iframe && iframe.contentWindow?.document.body) {
                // Measure the actual content wrapper instead of document scrollHeight
                // to avoid the "height creep" feedback loop.
                const wrapper = iframe.contentWindow.document.querySelector('.overflow-fix') as HTMLElement;
                if (wrapper) {
                    const height = wrapper.offsetHeight;
                    if (height > 0 && `${height}px` !== iframeHeight) {
                        setIframeHeight(`${height}px`);
                    }
                }
            }
        };

        // Update on load and then periodically to handle images/dynamic content
        const iframe = iframeRef.current;
        iframe.addEventListener('load', updateHeight);
        const interval = setInterval(updateHeight, 1000); // Less frequent updates
        
        return () => {
            iframe.removeEventListener('load', updateHeight);
            clearInterval(interval);
        };
    }, [html, iframeHeight]);

    if (!html && !text) {
        return <p className="text-gray-400 italic">No content</p>;
    }

    if (!html) {
        return (
            <div className="whitespace-pre-wrap break-words text-gray-800 dark:text-gray-300 font-sans">
                {text}
            </div>
        );
    }

    // Wrap HTML in a structure that resets base styles and handles basic theme support
    const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          :root {
            color-scheme: light dark;
          }
          html, body {
            margin: 0;
            padding: 0;
            height: auto !important;
            min-height: auto !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #1f2937; /* Default gray-800 */
            word-wrap: break-word;
            overflow: hidden !important; /* Prevent scrollbars inside iframe */
            background-color: transparent;
          }
          /* Handle dark mode within the iframe */
          @media (prefers-color-scheme: dark) {
            body {
              color: #d1d5db; /* Default gray-300 */
            }
          }
          img {
            max-width: 100% !important;
            height: auto !important;
            display: block;
          }
          table {
            max-width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
          }
          /* Fix for common email table issues */
          .overflow-fix {
            width: 100%;
            height: auto !important;
            overflow-x: auto;
            overflow-y: hidden;
          }
        </style>
      </head>
      <body>
        <div class="overflow-fix">
          ${html}
        </div>
      </body>
    </html>
  `;

    return (
        <div className="w-full overflow-hidden">
            <iframe
                ref={iframeRef}
                srcDoc={srcDoc}
                title="Email Message Content"
                style={{
                    width: '100%',
                    height: iframeHeight,
                    border: 'none',
                    display: 'block'
                }}
                sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                scrolling="no"
            />
        </div>
    );
}
