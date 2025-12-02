import type { Token, Pool } from '@/lib/types';
import { Address } from 'viem';

export const TOKENS: Token[] = [
  { id: 'usdc', name: 'USD Coin', symbol: 'USDC', logoColor: '#2775ca' },
  { id: 'usdt', name: 'Tether', symbol: 'USDT', logoColor: '#26a17b' },
  { id: 'weth', name: 'Wrapped Ether', symbol: 'WETH', logoColor: '#716b94' },
  { id: 'zora', name: 'Zora', symbol: 'ZORA', logoColor: '#8F00FF' },
];

export const TOKEN_CONTRACTS: Record<string, Address> = {
    // Sepolia Testnet Addresses
    'USDC': '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
    'USDT': '0x966953B02F103A6553a7391374A6156a59612086', // This is a mock USDT, not official
    'WETH': '0x7b79995e5f793A07Bc00c21412e50Eaae098E7F9',
    'ZORA': '0x45ee2614838d5F35401345F949A3311029143719', // This is a mock ZORA, not official
}

export const INITIAL_POOLS: Pool[] = [
  {
    id: 'weth-usdc',
    token0: TOKENS.find(t => t.symbol === 'WETH')!,
    token1: TOKENS.find(t => t.symbol === 'USDC')!,
    reserve0: 100, // 100 WETH
    reserve1: 400000, // 400,000 USDC
    totalSupply: 20000,
  },
  {
    id: 'zora-weth',
    token0: TOKENS.find(t => t.symbol === 'ZORA')!,
    token1: TOKENS.find(t => t.symbol === 'WETH')!,
    reserve0: 1000000, // 1,000,000 ZORA
    reserve1: 50, // 50 WETH
    totalSupply: 22360,
  },
];

export const SWAP_FEE = 0.003; // 0.3%
