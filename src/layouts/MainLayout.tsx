
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PersistentAssistant from "@/components/PersistentAssistant";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
      <PersistentAssistant />
    </div>
  );
};

export default MainLayout;
