
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1 relative">
        <main className="flex-1 px-4 py-8 overflow-x-hidden">
          {children}
        </main>
        {/* PersistentAssistant component removed */}
      </div>
      <Footer />
    </div>
  );
};

export default MainLayout;
