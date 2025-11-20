// src/components/icons/SivecLogo.tsx
interface SivecLogoProps {
  className?: string;
  size?: number;
}

export const SivecLogo: React.FC<SivecLogoProps> = ({
  className = "",
  size = 40,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Aquí irían los paths del SVG */}
      {/* Por ahora uso un placeholder, necesitarías el SVG real */}
      <rect width="200" height="200" rx="20" fill="#2563eb" />
      <path
        d="M50 100 L150 100 L150 80 L170 100 L150 120 L150 100 Z"
        fill="white"
      />
      <circle cx="80" cy="140" r="15" fill="white" />
      <circle cx="140" cy="140" r="15" fill="white" />
    </svg>
  );
};
