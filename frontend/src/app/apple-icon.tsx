import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #312e81 0%, #4338ca 35%, #4f46e5 70%, #6366f1 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "38px"
        }}
      >
        <svg
          width="110"
          height="110"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="21" x2="21" y2="21" />
          <polygon points="12 4.5 20 9.5 4 9.5" />
          <line x1="6" y1="18.5" x2="6" y2="12.5" />
          <line x1="10" y1="18.5" x2="10" y2="12.5" />
          <line x1="14" y1="18.5" x2="14" y2="12.5" />
          <line x1="18" y1="18.5" x2="18" y2="12.5" />
        </svg>
      </div>
    ),
    {
      ...size
    }
  );
}
