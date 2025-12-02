"use client"

import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useLiquidity } from "@/hooks/use-liquidity";
import type { Token } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";
import { TokenLogo } from "./token-logo";
import { Dispatch, SetStateAction } from "react";

interface TokenInputProps {
  token: Token;
  setToken?: Dispatch<SetStateAction<Token>>;
  amount: string;
  setAmount?: Dispatch<SetStateAction<string>>;
  balance?: number;
  label?: string;
  isOutput?: boolean;
}

export function TokenInput({ token, setToken, amount, setAmount, balance, label, isOutput = false }: TokenInputProps) {
  const { tokens } = useLiquidity();

  const handleSelectToken = (tokenId: string) => {
    if(setToken) {
      const selected = tokens.find(t => t.id === tokenId);
      if (selected) setToken(selected);
    }
  };

  const handleMax = () => {
    if (setAmount && balance) {
      setAmount(balance.toString());
    }
  }

  return (
    <div className="p-4 bg-muted/50 rounded-lg space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-muted-foreground">{label}</span>
        {balance !== undefined && !isOutput && (
          <span className="font-mono">Balance: {formatNumber(balance)}</span>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          type="number"
          placeholder="0.0"
          className="text-2xl h-auto p-0 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 flex-grow"
          value={amount}
          onChange={(e) => setAmount && setAmount(e.target.value)}
          readOnly={isOutput}
        />
        <div className="flex items-center gap-2">
        {!isOutput && balance && balance > 0 && <Button variant="ghost" size="sm" onClick={handleMax}>Max</Button>}
        <Select value={token.id} onValueChange={handleSelectToken} disabled={isOutput || !setToken}>
          <SelectTrigger className="w-[130px] h-auto p-2">
            <SelectValue>
              <div className="flex items-center gap-2">
                <TokenLogo token={token} />
                <span className="font-semibold">{token.symbol}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {tokens.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                <div className="flex items-center gap-2">
                  <TokenLogo token={t} />
                  <span className="font-semibold">{t.symbol}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        </div>
      </div>
    </div>
  );
}
