'use client';

import React, { useState } from 'react';
import { OrdersTable } from '../../components/OrdersTable';
import { History, ShieldCheck } from 'lucide-react';

export default function OrdersPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center space-x-2">
            <History className="w-5 h-5 text-blue-400" />
            <span>Order Book & Settlement Ledger</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time status of Active, Queued, Executed orders, and immutable CDS trade records with CSE 1.12% fees.
          </p>
        </div>
      </div>

      <OrdersTable
        refreshTrigger={refreshTrigger}
        onOrderCancelled={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </div>
  );
}
