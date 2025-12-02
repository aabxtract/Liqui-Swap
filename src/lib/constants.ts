import type { Token, Pool, UserBalance } from '@/lib/types';

export const TOKENS: Token[] = [
  { id: 'weth', name: 'Wrapped Ether', symbol: 'WETH', logoColor: '#716b94' },
  { id: 'dai', name: 'Dai', symbol: 'DAI', logoColor: '#f7bf4f' },
  { id: 'lqs', name: 'LiquiSwap', symbol: 'LQS', logoColor: '#8F00FF' },
];

export const INITIAL_POOLS: Pool[] = [
  {
    id: 'weth-dai',
    token0: TOKENS.find(t => t.symbol === 'WETH')!,
    token1: TOKENS.find(t => t.symbol === 'DAI')!,
    reserve0: 100, // 100 WETH
    reserve1: 400000, // 400,000 DAI
    totalSupply: 20000,
  },
  {
    id: 'lqs-weth',
    token0: TOKENS.find(t => t.symbol === 'LQS')!,
    token1: TOKENS.find(t => t.symbol === 'WETH')!,
    reserve0: 1000000, // 1,000,000 LQS
    reserve1: 50, // 50 WETH
    totalSupply: 22360,
  },
];

export const INITIAL_USER_BALANCE: UserBalance = {
  WETH: 10,
  DAI: 20000,
  LQS: 50000,
  'WETH-DAI-LP': 0,
  'LQS-WETH-LP': 0,
};

export const SWAP_FEE = 0.003; // 0.3%
