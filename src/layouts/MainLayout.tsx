import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { user } = useAuth();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 min-h-0 overflow-y-auto">{children}</main>
      {!user && <Footer />}
    </div>
  );
};

export default MainLayout;
