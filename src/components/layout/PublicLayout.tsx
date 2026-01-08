import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 min-h-0 overflow-y-auto">{children}</main>
      <Footer />
    </div>
  );
};

export default PublicLayout;

