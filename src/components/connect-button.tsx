"use client";

import { ConnectKitButton } from "connectkit";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export function ConnectButton() {
    return (
        <ConnectKitButton.Custom>
        {({
            isConnected,
            isConnecting,
            show,
            hide,
            address,
            ensName,
            chain,
        }) => {
            return (
            <Button
                onClick={show}
                className={cn("bg-primary/90 text-primary-foreground hover:bg-primary/80 transition-colors", 
                isConnected && "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
            >
                {isConnected ? address?.slice(0, 6) + "..." + address?.slice(-4) : "Connect Wallet"}
            </Button>
            );
        }}
        </ConnectKitButton.Custom>
    )
}
