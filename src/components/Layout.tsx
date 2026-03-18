import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      <div className="max-w-7xl mx-auto bg-white min-h-screen flex flex-col border-x border-zinc-200">
        <Navbar />
        <main className="grow">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
