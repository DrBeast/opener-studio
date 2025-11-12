import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { GuestModal } from "@/components/GuestModal";
import { useModal } from "@/contexts/ModalContext";

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const { isModalOpen, closeModal } = useModal();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 min-h-0 overflow-y-auto">{children}</main>
      <Footer />
      <GuestModal isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );
};

export default PublicLayout;

