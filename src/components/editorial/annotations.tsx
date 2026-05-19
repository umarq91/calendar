import type { SVGProps } from 'react';

const BLUE = '#2B2BFF';

export function UnderlineScribble(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 200 16"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      preserveAspectRatio="none"
      {...props}
    >
      <path
        d="M2,8 Q30,2 60,10 Q100,18 140,6 Q170,0 198,9"
        stroke={BLUE}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function OvalEnclosure(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 300 80"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      preserveAspectRatio="none"
      {...props}
    >
      <ellipse
        cx={150}
        cy={40}
        rx={145}
        ry={35}
        stroke={BLUE}
        strokeWidth={2.5}
        fill="none"
        strokeDasharray="6,2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ArrowPointer(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 80 30"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M4,15 Q30,8 65,15 L55,8 M65,15 L55,22"
        stroke={BLUE}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Starburst({ size = 50, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 50 50"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <g stroke={BLUE} strokeWidth={2} strokeLinecap="round">
        <line x1="25" y1="4" x2="25" y2="46" />
        <line x1="4" y1="25" x2="46" y2="25" />
        <line x1="11" y1="11" x2="39" y2="39" />
        <line x1="39" y1="11" x2="11" y2="39" />
        <line x1="25" y1="9" x2="25" y2="41" transform="rotate(22.5 25 25)" />
        <line x1="25" y1="9" x2="25" y2="41" transform="rotate(67.5 25 25)" />
      </g>
    </svg>
  );
}
