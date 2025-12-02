"use client"

import { useState, useMemo, useEffect } from "react";
import { Plus, Minus, ArrowDown } from "lucide-react";
import { useLiquidity } from "@/hooks/use-liquidity";
import { Button } from "./ui/button";
import { TokenInput } from "./token-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNumber } from "@/lib/utils";
import type { Token, Pool } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { TokenLogo } from "./token-logo";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";

export function LiquidityForm() {
    const { pools, balances, dispatch, tokens } = useLiquidity();
    const [selectedPoolId, setSelectedPoolId] = useState<string>(pools[0].id);

    const selectedPool = useMemo(() => pools.find(p => p.id === selectedPoolId), [pools, selectedPoolId]);
    
    const lpTokenSymbol = useMemo(() => selectedPool ? `${selectedPool.token0.symbol}-${selectedPool.token1.symbol}-LP` : '', [selectedPool]);
    const userLpBalance = useMemo(() => balances[lpTokenSymbol] || 0, [balances, lpTokenSymbol]);

    // Add Liquidity State
    const [amountA, setAmountA] = useState('');
    const [amountB, setAmountB] = useState('');

    // Remove Liquidity State
    const [lpAmount, setLpAmount] = useState('');
    const [removePercent, setRemovePercent] = useState(0);

    useEffect(() => {
        if (selectedPool && amountA) {
            const numAmountA = parseFloat(amountA);
            if (!isNaN(numAmountA)) {
                const ratio = selectedPool.reserve1 / selectedPool.reserve0;
                setAmountB((numAmountA * ratio).toString());
            }
        } else {
            setAmountB('');
        }
    }, [amountA, selectedPool]);

    useEffect(() => {
        if(userLpBalance > 0) {
            const amount = userLpBalance * (removePercent / 100);
            setLpAmount(amount.toString());
        }
    }, [removePercent, userLpBalance]);


    const handleAddLiquidity = () => {
        const numAmountA = parseFloat(amountA);
        if (!selectedPool || isNaN(numAmountA) || numAmountA <= 0) return;
        dispatch({ type: 'ADD_LIQUIDITY', payload: { tokenA: selectedPool.token0, tokenB: selectedPool.token1, amountA: numAmountA } });
        setAmountA('');
        setAmountB('');
    };

    const handleRemoveLiquidity = () => {
        const numLpAmount = parseFloat(lpAmount);
        if (!selectedPool || isNaN(numLpAmount) || numLpAmount <= 0) return;
        dispatch({ type: 'REMOVE_LIQUIDITY', payload: { pool: selectedPool, lpAmount: numLpAmount } });
        setLpAmount('');
        setRemovePercent(0);
    };

    const removeAmounts = useMemo(() => {
        if (!selectedPool || !lpAmount) return { amount0: 0, amount1: 0 };
        const share = parseFloat(lpAmount) / selectedPool.totalSupply;
        if(isNaN(share)) return { amount0: 0, amount1: 0 };
        return {
            amount0: share * selectedPool.reserve0,
            amount1: share * selectedPool.reserve1,
        };
    }, [lpAmount, selectedPool]);
    
    if (!selectedPool) return <div>Loading...</div>;

    return (
        <div className="space-y-4">
            <div>
                <label className="text-sm font-medium">Select Pool</label>
                 <Select value={selectedPoolId} onValueChange={setSelectedPoolId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a pool" />
                    </SelectTrigger>
                    <SelectContent>
                        {pools.map(pool => (
                            <SelectItem key={pool.id} value={pool.id}>
                                <div className="flex items-center gap-2">
                                    <TokenLogo token={pool.token0} />
                                    <TokenLogo token={pool.token1} className="-ml-4" />
                                    <span>{pool.token0.symbol}/{pool.token1.symbol}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Tabs defaultValue="add" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="add">Add Liquidity</TabsTrigger>
                    <TabsTrigger value="remove">Remove Liquidity</TabsTrigger>
                </TabsList>
                <TabsContent value="add" className="space-y-4 pt-4">
                    <h3 className="text-lg font-semibold text-center">Add Liquidity</h3>
                    <TokenInput
                        token={selectedPool.token0}
                        setToken={() => {}} // Not changeable
                        amount={amountA}
                        setAmount={setAmountA}
                        balance={balances[selectedPool.token0.symbol] || 0}
                        isOutput={false}
                    />
                    <div className="flex justify-center">
                        <Plus className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <TokenInput
                        token={selectedPool.token1}
                        setToken={() => {}} // Not changeable
                        amount={amountB}
                        setAmount={setAmountB}
                        balance={balances[selectedPool.token1.symbol] || 0}
                        isOutput={true}
                    />
                    <Button size="lg" className="w-full" onClick={handleAddLiquidity} disabled={!amountA || !amountB || parseFloat(amountA) <= 0 || parseFloat(amountA) > (balances[selectedPool.token0.symbol] || 0) || parseFloat(amountB) > (balances[selectedPool.token1.symbol] || 0)}>
                        Add Liquidity
                    </Button>
                </TabsContent>
                <TabsContent value="remove" className="space-y-4 pt-4">
                    <h3 className="text-lg font-semibold text-center">Remove Liquidity</h3>
                    <div className="space-y-2">
                         <div className="flex justify-between text-sm">
                            <label htmlFor="lp-amount" className="font-medium">Amount</label>
                            <span className="text-muted-foreground">Balance: {formatNumber(userLpBalance)}</span>
                        </div>
                        <Input id="lp-amount" placeholder="0.0" value={lpAmount} onChange={(e) => setLpAmount(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                        {[25, 50, 75, 100].map(p => (
                            <Button key={p} variant="outline" className="flex-1" onClick={() => setRemovePercent(p)}>{p}%</Button>
                        ))}
                    </div>
                    <div className="flex justify-center">
                        <ArrowDown className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <Card>
                        <CardContent className="p-4 space-y-3">
                            <h4 className="text-sm font-medium">You will receive</h4>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <TokenLogo token={selectedPool.token0} />
                                    <span>{selectedPool.token0.symbol}</span>
                                </div>
                                <span className="font-mono">{formatNumber(removeAmounts.amount0)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <TokenLogo token={selectedPool.token1} />
                                    <span>{selectedPool.token1.symbol}</span>
                                </div>
                                <span className="font-mono">{formatNumber(removeAmounts.amount1)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Button size="lg" className="w-full" onClick={handleRemoveLiquidity} disabled={!lpAmount || parseFloat(lpAmount) <= 0 || parseFloat(lpAmount) > userLpBalance}>
                        Remove Liquidity
                    </Button>
                </TabsContent>
            </Tabs>
        </div>
    );
}
