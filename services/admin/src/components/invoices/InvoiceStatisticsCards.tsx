import type { InvoiceStatisticsResponse } from "@/types/InvoiceType/invoice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, Clock, CheckCircle2, XCircle, RefreshCcw, DollarSign } from "lucide-react";

interface InvoiceStatisticsCardsProps {
  statistics: InvoiceStatisticsResponse | null;
  loading: boolean;
}

export const InvoiceStatisticsCards = ({
  statistics,
  loading,
}: InvoiceStatisticsCardsProps) => {
  if (loading || !statistics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Invoices",
      value: statistics.totalInvoices.toLocaleString(),
      icon: Receipt,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Pending",
      value: statistics.pendingInvoices.toLocaleString(),
      subtitle: `${statistics.pendingAmount.toLocaleString()} VND`,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Paid",
      value: statistics.paidInvoices.toLocaleString(),
      subtitle: `${statistics.totalRevenue.toLocaleString()} VND`,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Failed",
      value: statistics.failedInvoices.toLocaleString(),
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "Refunded",
      value: statistics.refundedInvoices.toLocaleString(),
      subtitle: `${statistics.refundedAmount.toLocaleString()} VND`,
      icon: RefreshCcw,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Total Revenue",
      value: `${statistics.totalRevenue.toLocaleString()} VND`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.color}`}>
                {card.value}
              </div>
              {card.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">
                  {card.subtitle}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
