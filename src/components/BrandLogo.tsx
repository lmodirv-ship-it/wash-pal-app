import logo from "@/assets/logo.jpeg";

interface BrandLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

export function BrandLogo({ size = 40, className = "", showText = false, textClassName = "" }: BrandLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={logo}
        alt="HN Carwash Nizar"
        width={size}
        height={size}
        className="rounded-xl object-cover ring-1 ring-primary/30"
        style={{ width: size, height: size, boxShadow: "0 0 18px hsl(var(--primary) / 0.35)" }}
      />
      {showText && (
        <span className={`font-black tracking-tight ${textClassName}`}>HN Carwash</span>
      )}
    </div>
  );
}
