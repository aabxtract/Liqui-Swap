"use client"

import { useState, useMemo, useEffect } from "react";
import { ArrowDown } from "lucide-react";
import { useLiquidity } from "@/hooks/use-liquidity";
import { Button } from "./ui/button";
import { TokenInput } from "./token-input";
import { SettingsPopover } from "./settings-popover";
import { formatNumber } from "@/lib/utils";
import { SWAP_FEE } from "@/lib/constants";
import type { Token } from "@/lib/types";

export function SwapForm() {
  const { tokens, pools, balances, dispatch, slippage } = useLiquidity();
  const [fromToken, setFromToken] = useState<Token>(tokens[0]);
  const [toToken, setToToken] = useState<Token>(tokens[1]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');

  const handleSwap = () => {
    const amount = parseFloat(fromAmount);
    if (!amount || amount <= 0) return;
    dispatch({ type: 'SWAP', payload: { fromToken, toToken, fromAmount: amount } });
    setFromAmount('');
  };

  const handleSwitchTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
  };
  
  const relevantPool = useMemo(() => pools.find(p =>
    (p.token0.id === fromToken.id && p.token1.id === toToken.id) ||
    (p.token0.id === toToken.id && p.token1.id === fromToken.id)
  ), [pools, fromToken, toToken]);

  useEffect(() => {
    if (fromAmount && relevantPool) {
      const amountIn = parseFloat(fromAmount);
      if (isNaN(amountIn) || amountIn <= 0) {
        setToAmount('');
        return;
      }
      
      const isFromToken0 = relevantPool.token0.id === fromToken.id;
      const reserveIn = isFromToken0 ? relevantPool.reserve0 : relevantPool.reserve1;
      const reserveOut = isFromToken0 ? relevantPool.reserve1 : relevantPool.reserve0;
      
      const amountInWithFee = amountIn * (1 - SWAP_FEE);
      const calculatedAmountOut = (reserveOut * amountInWithFee) / (reserveIn + amountInWithFee);

      setToAmount(calculatedAmountOut > 0 ? calculatedAmountOut.toString() : '');
    } else {
      setToAmount('');
    }
  }, [fromAmount, fromToken, toToken, relevantPool]);

  const priceImpact = useMemo(() => {
    if (!fromAmount || !relevantPool) return 0;
    const amountIn = parseFloat(fromAmount);
    if (!amountIn) return 0;

    const isFromToken0 = relevantPool.token0.id === fromToken.id;
    const reserveIn = isFromToken0 ? relevantPool.reserve0 : relevantPool.reserve1;
    const reserveOut = isFromToken0 ? relevantPool.reserve1 : relevantPool.reserve0;
    
    const midPrice = reserveOut / reserveIn;
    const amountInWithFee = amountIn * (1- SWAP_FEE);
    const amountOut = (reserveOut * amountInWithFee) / (reserveIn + amountInWithFee);
    const effectivePrice = amountOut / amountIn;
    
    return ((midPrice - effectivePrice) / midPrice) * 100;
  }, [fromAmount, fromToken, toToken, relevantPool]);

  const priceDisplay = useMemo(() => {
    if(!relevantPool) return null;
    const isFromToken0 = relevantPool.token0.id === fromToken.id;
    const reserveIn = isFromToken0 ? relevantPool.reserve0 : relevantPool.reserve1;
    const reserveOut = isFromToken0 ? relevantPool.reserve1 : relevantPool.reserve0;
    const price = reserveOut / reserveIn;
    return `1 ${fromToken.symbol} = ${formatNumber(price)} ${toToken.symbol}`;
  }, [fromToken, toToken, relevantPool]);

  const minReceived = parseFloat(toAmount) * (1 - slippage / 100);

  return (
    <div className="space-y-4">
      <div className="flex justify-end -mb-2">
        <SettingsPopover />
      </div>
      <div className="relative">
        <TokenInput
          token={fromToken}
          setToken={setFromToken}
          amount={fromAmount}
          setAmount={setFromAmount}
          balance={balances[fromToken.symbol] || 0}
          label="You Sell"
        />
        <Button variant="ghost" size="icon" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-secondary hover:bg-secondary/80 border" onClick={handleSwitchTokens}>
          <ArrowDown className="h-4 w-4" />
        </Button>
        <TokenInput
          token={toToken}
          setToken={setToToken}
          amount={toAmount}
          label="You Receive"
          isOutput={true}
        />
      </div>
      
      {fromAmount && toAmount && relevantPool && (
        <div className="text-sm text-muted-foreground space-y-2 p-3 bg-muted/50 rounded-lg">
          <div className="flex justify-between items-center">
            <span>Price</span>
            <span className="font-mono">{priceDisplay}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Price Impact</span>
            <span className={`font-mono ${priceImpact > 1 ? 'text-destructive' : ''}`}>{priceImpact.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Minimum Received</span>
            <span className="font-mono">{formatNumber(minReceived)} {toToken.symbol}</span>
          </div>
           <div className="flex justify-between items-center">
            <span>Slippage Tolerance</span>
            <span className="font-mono">{slippage}%</span>
          </div>
        </div>
      )}

      <Button
        size="lg"
        className="w-full text-lg font-semibold"
        onClick={handleSwap}
        disabled={!fromAmount || !toAmount || parseFloat(fromAmount) > (balances[fromToken.symbol] || 0) || !relevantPool}
      >
        {parseFloat(fromAmount) > (balances[fromToken.symbol] || 0) ? 'Insufficient Balance' : 'Swap'}
      </Button>
    </div>
  );
}
