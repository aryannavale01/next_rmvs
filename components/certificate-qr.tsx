"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface CertificateQrProps {
  value: string;
  size?: number;
  className?: string;
}

/**
 * Renders a scannable QR code for a certificate verification URL. The QR is
 * generated client-side so members/admins can share or print it without the
 * server having to embed image data everywhere.
 */
export default function CertificateQr({ value, size = 84, className }: CertificateQrProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, {
      width: size * 4,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(() => {
        if (active) setDataUrl(null);
      });
    return () => {
      active = false;
    };
  }, [value, size]);

  if (!dataUrl) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      width={size}
      height={size}
      alt="QR code to verify this certificate"
      className={className}
    />
  );
}
