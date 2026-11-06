import { useLocation } from "react-router-dom";
// ...existing imports...

function AppLayout() {
  const { pathname } = useLocation();
  const isAuthPage = ["/", "/login", "/register"].includes(pathname);

  return (
    <>
      {!isAuthPage && <Navbar />}
      <Routes>
        {/* ...keep all your existing routes unchanged... */}
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;