import { Header } from "@/components/header";
import { LiquiditySwapCard } from "@/components/liquidity-swap-card";
import { LiquidityProvider } from "@/contexts/liquidity-context";

export default function Home() {
  return (
    <LiquidityProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center p-4">
          <LiquiditySwapCard />
        </main>
      </div>
    </LiquidityProvider>
  );
}
