"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SwapForm } from "./swap-form";
import { LiquidityForm } from "./liquidity-form";
import { useState } from "react";

export function LiquiditySwapCard() {
  const [activeTab, setActiveTab] = useState("swap");

  return (
    <Card className="w-full max-w-md shadow-2xl bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="swap">Swap</TabsTrigger>
            <TabsTrigger value="liquidity">Liquidity</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="swap">
              <SwapForm />
            </TabsContent>
            <TabsContent value="liquidity">
              <LiquidityForm />
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
