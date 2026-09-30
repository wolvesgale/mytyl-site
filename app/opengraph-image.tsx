import { ImageResponse } from 'next/og';

export const alt = 'Mytyl — 3D Creator';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 96px',
          background:
            'radial-gradient(circle at 75% 40%, #2a2160 0%, #0a0b14 55%)',
          backgroundColor: '#0a0b14',
          color: '#edebf5',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 26, letterSpacing: 8, color: '#a4a1b8' }}>3D CREATOR</div>
          <div style={{ fontSize: 190, fontStyle: 'italic', lineHeight: 1, marginTop: 10, fontFamily: 'serif' }}>Mytyl</div>
          <div style={{ fontSize: 30, color: '#b8a6ff', marginTop: 24, fontStyle: 'italic', fontFamily: 'serif' }}>
            Crafting light into form.
          </div>
        </div>
        <svg width="300" height="400" viewBox="0 0 120 160">
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c9b8ff" />
              <stop offset="50%" stopColor="#9ff5e8" />
              <stop offset="100%" stopColor="#ffd0ec" />
            </linearGradient>
          </defs>
          <polygon points="60,4 96,44 88,128 60,156 32,128 24,44" fill="url(#g)" fillOpacity="0.18" stroke="url(#g)" strokeWidth="1.5" />
          <polyline points="24,44 60,60 96,44" fill="none" stroke="url(#g)" strokeWidth="1" />
          <line x1="60" y1="4" x2="60" y2="156" stroke="url(#g)" strokeWidth="0.7" />
          <circle cx="60" cy="78" r="7" fill="#ffffff" />
        </svg>
      </div>
    ),
    size,
  );
}
