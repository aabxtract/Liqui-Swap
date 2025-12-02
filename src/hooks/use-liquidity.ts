import { useContext } from 'react';
import { LiquidityContext, LiquidityContextType } from '@/contexts/liquidity-context';

export const useLiquidity = (): LiquidityContextType => {
  const context = useContext(LiquidityContext);
  if (!context) {
    throw new Error('useLiquidity must be used within a LiquidityProvider');
  }
  return context;
};
