import { useState, ReactNode } from "react";
import { Toaster } from "sonner";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className="flex w-full flex-1 flex-col">
        <Navbar toggleSidebar={toggleSidebar} />

        <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <div className="min-h-[calc(100vh-10rem)]">
              {children}
            </div>
          </div>
        </main>
      </div>

      <Toaster 
        position="top-right" 
        closeButton
        className="sm:max-w-sm md:max-w-md"
        toastOptions={{
          className: 'sm:max-w-sm md:max-w-md',
        }}
      />
    </div>
  );
};

export default Layout;
