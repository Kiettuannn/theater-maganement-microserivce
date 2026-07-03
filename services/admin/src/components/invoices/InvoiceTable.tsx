import type { InvoiceResponse } from "@/types/InvoiceType/invoice";
import { InvoiceStatus } from "@/types/InvoiceType/invoice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Clock, CheckCircle2, XCircle, RefreshCcw } from "lucide-react";
import { format } from "date-fns";

interface InvoiceTableProps {
  invoices: InvoiceResponse[];
  loading: boolean;
  onViewDetail: (invoice: InvoiceResponse) => void;
}

const getStatusBadge = (status: InvoiceStatus) => {
  const config = {
    [InvoiceStatus.PENDING]: {
      label: "Pending",
      className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      icon: Clock,
    },
    [InvoiceStatus.PAID]: {
      label: "Paid",
      className: "bg-green-100 text-green-800 hover:bg-green-100",
      icon: CheckCircle2,
    },
    [InvoiceStatus.FAILED]: {
      label: "Failed",
      className: "bg-red-100 text-red-800 hover:bg-red-100",
      icon: XCircle,
    },
    [InvoiceStatus.REFUNDED]: {
      label: "Refunded",
      className: "bg-purple-100 text-purple-800 hover:bg-purple-100",
      icon: RefreshCcw,
    },
  };

  const statusConfig = config[status];
  const Icon = statusConfig.icon;

  return (
    <Badge className={statusConfig.className}>
      <Icon className="h-3 w-3 mr-1" />
      {statusConfig.label}
    </Badge>
  );
};

export const InvoiceTable = ({
  invoices,
  loading,
  onViewDetail,
}: InvoiceTableProps) => {
  if (loading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice ID</TableHead>
              <TableHead>Booking ID</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={7}>
                  <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="rounded-full bg-gray-100 p-6 mb-4">
            <svg
              className="h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            No invoices found
          </h3>
          <p className="text-gray-500">
            Try adjusting your search or filter criteria
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice ID</TableHead>
            <TableHead>Booking ID</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-mono text-sm">
                {invoice.id.substring(0, 8)}...
              </TableCell>
              <TableCell className="font-mono text-sm">
                {invoice.bookingId.substring(0, 8)}...
              </TableCell>
              <TableCell className="font-semibold">
                {invoice.totalAmount.toLocaleString()} VND
              </TableCell>
              <TableCell>{getStatusBadge(invoice.status)}</TableCell>
              <TableCell>
                {format(new Date(invoice.createdAt), "dd/MM/yyyy HH:mm")}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewDetail(invoice)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
