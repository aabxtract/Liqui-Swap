"use client";

import React, { createContext, useReducer, ReactNode, useEffect } from 'react';
import { INITIAL_POOLS, SWAP_FEE, TOKENS, TOKEN_CONTRACTS } from '@/lib/constants';
import type { Pool, UserBalance, Token } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAccount, useBalance, useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';

interface State {
  pools: Pool[];
  balances: UserBalance;
  slippage: number;
}

type Action =
  | { type: 'SWAP'; payload: { fromToken: Token; toToken: Token; fromAmount: number } }
  | { type: 'ADD_LIQUIDITY'; payload: { tokenA: Token; tokenB: Token; amountA: number } }
  | { type: 'REMOVE_LIQUIDITY'; payload: { pool: Pool; lpAmount: number } }
  | { type: 'SET_SLIPPAGE'; payload: number }
  | { type: 'SET_BALANCES'; payload: UserBalance };

export interface LiquidityContextType extends State {
  dispatch: React.Dispatch<Action>;
  tokens: Token[];
}

const initialState: State = {
  pools: INITIAL_POOLS,
  balances: {
    USDC: 0,
    USDT: 0,
    WETH: 0,
    ZORA: 0,
  },
  slippage: 0.5,
};

export const LiquidityContext = createContext<LiquidityContextType | undefined>(undefined);

const liquidityReducer = (state: State, action: Action): State => {
  const { toast } = useToast();

  switch (action.type) {
    case 'SET_BALANCES':
      return { ...state, balances: action.payload };
    case 'SWAP': {
      const { fromToken, toToken, fromAmount } = action.payload;
      const pool = state.pools.find(
        (p) =>
          (p.token0.id === fromToken.id && p.token1.id === toToken.id) ||
          (p.token0.id === toToken.id && p.token1.id === fromToken.id)
      );

      if (!pool) {
        toast({ title: "Error", description: "No liquidity pool for this pair.", variant: "destructive" });
        return state;
      }
      if (state.balances[fromToken.symbol] < fromAmount) {
        toast({ title: "Error", description: "Insufficient balance.", variant: "destructive" });
        return state;
      }

      const isFromToken0 = pool.token0.id === fromToken.id;
      const reserveIn = isFromToken0 ? pool.reserve0 : pool.reserve1;
      const reserveOut = isFromToken0 ? pool.reserve1 : pool.reserve0;
      
      const amountInWithFee = fromAmount * (1 - SWAP_FEE);
      const amountOut = (reserveOut * amountInWithFee) / (reserveIn + amountInWithFee);

      const newBalances = { ...state.balances };
      newBalances[fromToken.symbol] -= fromAmount;
      newBalances[toToken.symbol] = (newBalances[toToken.symbol] || 0) + amountOut;

      const newPools = state.pools.map((p) => {
        if (p.id === pool.id) {
          return {
            ...p,
            reserve0: isFromToken0 ? p.reserve0 + fromAmount : p.reserve0,
            reserve1: !isFromToken0 ? p.reserve1 + fromAmount : p.reserve1,
          };
        }
        return p;
      });
      
      toast({ title: "Swap Successful", description: `This is a simulation. No real transaction occurred.` });
      return { ...state, balances: newBalances, pools: newPools };
    }
    case 'ADD_LIQUIDITY': {
        const { tokenA, tokenB, amountA } = action.payload;
        const pool = state.pools.find(p => (p.token0.id === tokenA.id && p.token1.id === tokenB.id) || (p.token0.id === tokenB.id && p.token1.id === tokenA.id));
        if (!pool) {
            toast({ title: "Error", description: "Pool does not exist.", variant: "destructive" });
            return state;
        }

        const isTokenA_token0 = pool.token0.id === tokenA.id;
        const reserveA = isTokenA_token0 ? pool.reserve0 : pool.reserve1;
        const reserveB = isTokenA_token0 ? pool.reserve1 : pool.reserve0;

        const amountB = (reserveB / reserveA) * amountA;

        if (state.balances[tokenA.symbol] < amountA || state.balances[tokenB.symbol] < amountB) {
            toast({ title: "Error", description: "Insufficient balance for one of the tokens.", variant: "destructive" });
            return state;
        }

        const lpTokenSymbol = `${pool.token0.symbol}-${pool.token1.symbol}-LP`;
        const lpTokensToMint = (amountA / reserveA) * pool.totalSupply;

        const newBalances = { ...state.balances };
        newBalances[tokenA.symbol] -= amountA;
        newBalances[tokenB.symbol] -= amountB;
        newBalances[lpTokenSymbol] = (newBalances[lpTokenSymbol] || 0) + lpTokensToMint;

        const newPools = state.pools.map(p => {
            if (p.id === pool.id) {
                return {
                    ...p,
                    reserve0: isTokenA_token0 ? p.reserve0 + amountA : p.reserve0 + amountB,
                    reserve1: isTokenA_token0 ? p.reserve1 + amountB : p.reserve1 + amountA,
                    totalSupply: p.totalSupply + lpTokensToMint,
                };
            }
            return p;
        });

        toast({ title: "Liquidity Added", description: `This is a simulation. No real transaction occurred.` });
        return { ...state, balances: newBalances, pools: newPools };
    }
    case 'REMOVE_LIQUIDITY': {
        const { pool, lpAmount } = action.payload;
        const lpTokenSymbol = `${pool.token0.symbol}-${pool.token1.symbol}-LP`;

        if ((state.balances[lpTokenSymbol] || 0) < lpAmount) {
            toast({ title: "Error", description: "Insufficient LP token balance.", variant: "destructive" });
            return state;
        }

        const share = lpAmount / pool.totalSupply;
        const amount0 = share * pool.reserve0;
        const amount1 = share * pool.reserve1;

        const newBalances = { ...state.balances };
        newBalances[lpTokenSymbol] -= lpAmount;
        newBalances[pool.token0.symbol] += amount0;
        newBalances[pool.token1.symbol] += amount1;

        const newPools = state.pools.map(p => {
            if (p.id === pool.id) {
                return {
                    ...p,
                    reserve0: p.reserve0 - amount0,
                    reserve1: p.reserve1 - amount1,
                    totalSupply: p.totalSupply - lpAmount,
                };
            }
            return p;
        });
        
        toast({ title: "Liquidity Removed", description: `This is a simulation. No real transaction occurred.` });
        return { ...state, balances: newBalances, pools: newPools };
    }
    case 'SET_SLIPPAGE': {
      toast({ title: "Settings Updated", description: `Slippage tolerance set to ${action.payload}%` });
      return { ...state, slippage: action.payload };
    }
    default:
      return state;
  }
};

const erc20Abi = [
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "type": "function"
  }
] as const;

export const LiquidityProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(liquidityReducer, initialState);
  const { address, isConnected } = useAccount();

  const contracts = TOKENS.map(token => ({
    address: TOKEN_CONTRACTS[token.symbol as keyof typeof TOKEN_CONTRACTS],
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address!],
  }));

  const { data: balancesData, isSuccess } = useReadContracts({
    contracts: contracts,
    query: {
        enabled: isConnected && !!address,
    },
    chainId: 11155111, // Sepolia
  });

  useEffect(() => {
    if (isSuccess && balancesData) {
      const newBalances: UserBalance = {};
      TOKENS.forEach((token, index) => {
        const balanceResult = balancesData[index];
        if (balanceResult.status === 'success') {
          // This is a placeholder for decimals. For a real app, you'd fetch decimals for each token.
          const decimals = (token.symbol === 'USDC' || token.symbol === 'USDT') ? 6 : 18;
          newBalances[token.symbol] = parseFloat(formatUnits(balanceResult.result as bigint, decimals));
        } else {
          newBalances[token.symbol] = 0;
        }
      });
      // Keep LP token balances from state as they are not on-chain
      Object.keys(state.balances).forEach(key => {
        if(key.includes('-LP')) {
          newBalances[key] = state.balances[key];
        }
      });
      dispatch({ type: 'SET_BALANCES', payload: newBalances });
    } else if (!isConnected) {
      dispatch({ type: 'SET_BALANCES', payload: initialState.balances });
    }
  }, [balancesData, isSuccess, isConnected]);


  return (
    <LiquidityContext.Provider value={{ ...state, dispatch, tokens: TOKENS }}>
      {children}
    </LiquidityContext.Provider>
  );
};
