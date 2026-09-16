import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #3730a3 0%, #4f46e5 50%, #6366f1 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "7px"
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.25"
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
