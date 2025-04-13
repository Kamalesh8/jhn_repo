import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { PDFLayout } from "./pdf-layout";
import type { Transaction } from "@/types";
import React from "react";
import ReactDOM from "react-dom";

interface DownloadPDFButtonProps {
  data: Transaction[];
  type: "transactions" | "referrals";
  title: string;
  label?: string;
}

export function DownloadPDFButton({ data, type, title, label = "Download PDF" }: DownloadPDFButtonProps) {
  const handleDownload = async () => {
    try {
      toast.info("Preparing PDF for download...");

      // Create a temporary container
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "-9999px";
      document.body.appendChild(container);

      // Render the PDF content
      const pdfContent = <PDFLayout title={title} data={data} type={type} />;
      ReactDOM.render(pdfContent, container);

      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate PDF
      const canvas = await html2canvas(container, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: 816, // A4 width at 96 DPI
        height: 1056, // A4 height at 96 DPI
        windowWidth: 816,
        windowHeight: 1056
      });

      // Clean up
      document.body.removeChild(container);

      // Create PDF
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${title.toLowerCase().replace(/\s+/g, "-")}.pdf`);

      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <Button
      onClick={handleDownload}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      {label}
    </Button>
  );
}
