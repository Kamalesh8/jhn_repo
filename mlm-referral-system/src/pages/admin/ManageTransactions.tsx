import { Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface TransactionData {
  id: string;
  user: string;
  amount: string;
  type: string;
  status: string;
  date: string;
  actions: JSX.Element;
}

interface TableColumn {
  title: string;
  dataIndex: keyof TransactionData;
}

export default function ManageTransactions() {
  const columns: TableColumn[] = [
    { title: "ID", dataIndex: "id" },
    { title: "User", dataIndex: "user" },
    { title: "Amount", dataIndex: "amount" },
    { title: "Type", dataIndex: "type" },
    { title: "Status", dataIndex: "status" },
    { title: "Date", dataIndex: "date" },
    { title: "Actions", dataIndex: "actions" },
  ];

  const data: TransactionData[] = [
    {
      id: "1",
      user: "John Doe",
      amount: "$100",
      type: "Deposit",
      status: "Completed",
      date: "2025-04-11",
      actions: <Button variant="outline" size="sm">View</Button>,
    },
    // Add more sample data as needed
  ];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Manage Transactions</h1>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.title} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="bg-white">
                {columns.map((column) => (
                  <td key={column.title} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row[column.dataIndex]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
