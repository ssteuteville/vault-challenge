"use client";

import { useRef, useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer } from "lucide-react";

import { Button } from "@acme/ui/button";

interface PrintQRCodeButtonProps {
  itemId: string;
  itemTitle: string;
}

export function PrintQRCodeButton({
  itemId,
  itemTitle,
}: PrintQRCodeButtonProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [itemUrl, setItemUrl] = useState<string>("");
  const printContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set the item URL once we're on the client
    if (typeof window !== "undefined") {
      setItemUrl(`${window.location.origin}/items/${itemId}`);
    }
  }, [itemId]);

  const handlePrint = () => {
    if (!printContentRef.current || !itemUrl) return;

    setIsPrinting(true);

    // Get the QR code SVG content from the hidden div
    const qrSvg = printContentRef.current.querySelector("svg");
    if (!qrSvg) {
      setIsPrinting(false);
      return;
    }

    const qrSvgContent = qrSvg.outerHTML;

    // Create a new window for printing
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setIsPrinting(false);
      return;
    }

    // Escape HTML in title to prevent XSS
    const escapedTitle = itemTitle
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${escapedTitle}</title>
          <style>
            @media print {
              @page {
                margin: 1in;
              }
              body {
                margin: 0;
                padding: 0;
              }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              padding: 2rem;
              text-align: center;
            }
            .qr-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 1rem;
            }
            .qr-code {
              border: 2px solid #000;
              padding: 1rem;
              background: white;
            }
            .qr-code svg {
              display: block;
            }
            h1 {
              margin: 0 0 0.5rem 0;
              font-size: 1.5rem;
              font-weight: 600;
            }
            p {
              margin: 0;
              color: #666;
              font-size: 0.875rem;
            }
            .url {
              margin-top: 1rem;
              word-break: break-all;
              font-size: 0.75rem;
              color: #999;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h1>${escapedTitle}</h1>
            <div class="qr-code">
              ${qrSvgContent}
            </div>
            <p>Scan to view item details</p>
            <div class="url">${itemUrl}</div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();

    // Wait for the window to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        setIsPrinting(false);
        // Close the window after printing
        setTimeout(() => {
          printWindow.close();
        }, 100);
      }, 250);
    };
  };

  return (
    <>
      {/* Hidden QR code for extracting SVG */}
      {itemUrl && (
        <div ref={printContentRef} className="hidden">
          <QRCodeSVG value={itemUrl} size={256} level="H" />
        </div>
      )}
      <Button
        onClick={handlePrint}
        disabled={isPrinting || !itemUrl}
        variant="outline"
        className="gap-2"
      >
        <Printer className="size-4" />
        {isPrinting ? "Printing..." : "Print QR Code"}
      </Button>
    </>
  );
}

