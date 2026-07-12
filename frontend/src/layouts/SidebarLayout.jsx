export default function SidebarLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="p-4 text-2xl font-bold border-b border-gray-700">TransitOps</div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="/" className="block p-2 rounded hover:bg-gray-700">Dashboard</a>
          <a href="/vehicles" className="block p-2 rounded hover:bg-gray-700">Vehicles</a>
          <a href="/drivers" className="block p-2 rounded hover:bg-gray-700">Drivers</a>
          <a href="/trips" className="block p-2 rounded hover:bg-gray-700">Trips</a>
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
