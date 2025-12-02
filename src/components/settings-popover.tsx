"use client"

import { Cog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLiquidity } from "@/hooks/use-liquidity";

export function SettingsPopover() {
  const { slippage, dispatch } = useLiquidity();

  const handleSlippageChange = (value: number) => {
    if (!isNaN(value) && value >= 0 && value <= 50) {
      dispatch({ type: "SET_SLIPPAGE", payload: value });
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Cog className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Settings</h4>
            <p className="text-sm text-muted-foreground">
              Adjust your transaction settings.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="slippage">Slippage Tolerance</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 grid grid-cols-3 gap-1">
                <Button variant={slippage === 0.5 ? 'secondary': 'outline'} size="sm" onClick={() => handleSlippageChange(0.5)}>0.5%</Button>
                <Button variant={slippage === 1 ? 'secondary': 'outline'} size="sm" onClick={() => handleSlippageChange(1)}>1%</Button>
                <Button variant={slippage === 2 ? 'secondary': 'outline'} size="sm" onClick={() => handleSlippageChange(2)}>2%</Button>
              </div>
              <div className="relative">
                <Input
                  id="slippage"
                  type="number"
                  value={slippage}
                  onChange={(e) => handleSlippageChange(parseFloat(e.target.value))}
                  className="w-20 pr-6"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
