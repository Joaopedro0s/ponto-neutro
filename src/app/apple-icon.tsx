import { ImageResponse } from "next/og";
import { LOGO } from "@/components/logo";

// Ícone do app (tela inicial do celular): o mesmo símbolo do logotipo, em 180px.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: LOGO.tile }}>
        <svg viewBox="0 0 32 32" width="180" height="180">
          <path d={LOGO.path} stroke={LOGO.line} strokeWidth="2.6" strokeLinecap="round" fill="none" />
          <circle cx="16" cy="16" r="3.8" fill={LOGO.neutral} stroke={LOGO.tile} strokeWidth="1.8" />
        </svg>
      </div>
    ),
    size,
  );
}
