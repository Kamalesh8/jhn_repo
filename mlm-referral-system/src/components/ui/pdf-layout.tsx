import { formatCurrency } from "@/lib/utils";
import type { Transaction } from "@/types";

interface PDFLayoutProps {
  title: string;
  data: Transaction[];
  type: "transactions" | "referrals";
}

export function PDFLayout({ title, data, type }: PDFLayoutProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "pending":
        return "text-yellow-600";
      case "failed":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "deposit":
        return "text-green-600";
      case "withdrawal":
        return "text-red-600";
      case "level_income":
        return "text-blue-600";
      case "sponsor_income":
        return "text-purple-600";
      case "profit_share":
        return "text-amber-600";
      default:
        return "text-gray-600";
    }
  };

  const formatDate = (date: string | number | Date | null | undefined) => {
    if (!date) return "N/A";
    
    try {
      const dateObj = typeof date === "string" || typeof date === "number" 
        ? new Date(date) 
        : date;

      if (isNaN(dateObj.getTime())) return "Invalid Date";

      return dateObj.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  return (
    <div className="min-h-[1056px] w-[816px] bg-white p-8 text-black relative">
      {/* Border */}
      <div className="absolute inset-4 border-4 border-primary/10 rounded-lg pointer-events-none" />
      
      {/* Inner Border */}
      <div className="relative z-10 min-h-[984px] border border-gray-200 rounded-lg p-6">
        {/* Header with Logo and Title */}
        <div className="border-b-2 border-gray-200 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-lg bg-primary text-white flex items-center justify-center text-2xl font-bold">
                MLM
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">MLM Referral System</h1>
                <p className="text-sm text-gray-500">Building Success Together</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">Generated on:</p>
              <p className="text-sm text-gray-600">{formatDate(new Date())}</p>
            </div>
          </div>
        </div>

        {/* Document Title */}
        <div className="my-8 text-center">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        </div>

        {/* Content */}
        <div className="mb-8">
          {type === "transactions" && (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border-b px-4 py-3 text-left font-medium text-gray-600">Date</th>
                    <th className="border-b px-4 py-3 text-left font-medium text-gray-600">Type</th>
                    <th className="border-b px-4 py-3 text-left font-medium text-gray-600">Status</th>
                    <th className="border-b px-4 py-3 text-left font-medium text-gray-600">Description</th>
                    <th className="border-b px-4 py-3 text-right font-medium text-gray-600">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.map((item: Transaction) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className={`px-4 py-3 ${getTypeColor(item.type)}`}>
                        {item.type.split('_').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </td>
                      <td className={`px-4 py-3 ${getStatusColor(item.status)}`}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {item.description || "-"}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${
                        item.type === "withdrawal" ? "text-red-600" : "text-green-600"
                      }`}>
                        {item.type === "withdrawal" ? "-" : "+"}{formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right font-medium text-gray-600">
                      Total Transactions:
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800">
                      {data.length}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {type === "referrals" && (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border-b px-4 py-3 text-left font-medium text-gray-600">Name</th>
                    <th className="border-b px-4 py-3 text-left font-medium text-gray-600">Email</th>
                    <th className="border-b px-4 py-3 text-left font-medium text-gray-600">Level</th>
                    <th className="border-b px-4 py-3 text-left font-medium text-gray-600">Joined Date</th>
                    <th className="border-b px-4 py-3 text-right font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                      <td className="px-4 py-3 text-gray-600">{item.email}</td>
                      <td className="px-4 py-3 text-gray-600">Level {item.level}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatDate(item.registeredAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                          item.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                        }`}>
                          {item.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right font-medium text-gray-600">
                      Total Referrals:
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800">
                      {data.length}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4">
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div>
                <p className="font-medium">CONFIDENTIAL</p>
                <p>This document contains confidential information. Do not share without authorization.</p>
              </div>
              <div className="text-right">
                <p>Page 1 of 1</p>
                <p> {new Date().getFullYear()} MLM Referral System</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
