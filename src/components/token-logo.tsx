import type { Token } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TokenLogoProps extends React.HTMLAttributes<HTMLDivElement> {
    token?: Token;
}

export function TokenLogo({ token, className }: TokenLogoProps) {
    if (!token) {
        return <div className={cn("w-6 h-6 rounded-full bg-muted", className)} />;
    }

    return (
        <div
            className={cn("w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-xs", className)}
            style={{ backgroundColor: token.logoColor }}
        >
            {token.symbol.charAt(0)}
        </div>
    );
}
