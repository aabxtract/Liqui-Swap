"use client";

import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLiquidity } from "@/hooks/use-liquidity";
import { formatNumber } from "@/lib/utils";
import { TokenLogo } from "./token-logo";
import { Separator } from "./ui/separator";

export function UserWallet() {
  const { balances, tokens } = useLiquidity();
  const allTokens = [...tokens, 
    { id: 'weth-dai-lp', name: 'WETH-DAI LP', symbol: 'WETH-DAI-LP', logoColor: '#aa4d8d' },
    { id: 'lqs-weth-lp', name: 'LQS-WETH LP', symbol: 'LQS-WETH-LP', logoColor: '#8338ec' },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Wallet className="w-4 h-4" />
          My Wallet
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Wallet Balances</h4>
            <p className="text-sm text-muted-foreground">
              Your simulated token balances.
            </p>
          </div>
          <Separator />
          <div className="grid gap-3">
            {Object.entries(balances).map(([symbol, balance]) => {
              if (balance <= 0) return null;
              const tokenInfo = allTokens.find(t => t.symbol === symbol);
              return (
              <div key={symbol} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TokenLogo token={tokenInfo} />
                  <span className="font-medium">{symbol}</span>
                </div>
                <span className="font-mono text-sm">{formatNumber(balance)}</span>
              </div>
            )})}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
