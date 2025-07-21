import type { SVGProps } from "react";

export const IconLogo = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="4"/>
        <path d="M25 75C25 56.5333 33.3333 45.8 50 42C66.6667 45.8 75 56.5333 75 75" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M50 42V25L60 33.5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M50 25L40 33.5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export const IconTable = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M3 12h18M12 21V12M5 21V12M19 21V12" />
        <path d="M21 9a5 5 0 0 0-5-5H8a5 5 0 0 0-5 5" />
    </svg>
);

export const IconChefHat = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M20 14.5a3.5 3.5 0 0 0-3.5-3.5H7.5A3.5 3.5 0 0 0 4 14.5V18h16v-3.5Z" />
        <path d="M6 11V7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v4" />
        <path d="M12 6a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v0" />
        <path d="M12 6a4 4 0 0 0-4-4h0a4 4 0 0 0-4 4v0" />
    </svg>
);

export const IconPOS = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M18 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Z" />
        <path d="M12 18V6" />
        <path d="M8 12h8" />
        <path d="M5 2h14" />
    </svg>
);

export const IconMenu = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v15H6.5A2.5 2.5 0 0 1 4 14.5v-10A2.5 2.5 0 0 1 6.5 2z" />
        <path d="M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
        <path d="M12 10l-1.5 2.5" />
        <path d="M12 10l1.5 2.5" />
        <path d="M12 6V4" />
    </svg>
);

export const IconChart = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M3 3v18h18" />
        <path d="M7 14v-4" />
        <path d="M12 14v-8" />
        <path d="M17 14v-11" />
    </svg>
);

export const IconCoin = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 18V6" />
        <path d="M15 9H9" />
        <path d="M15 15H9" />
    </svg>
);
