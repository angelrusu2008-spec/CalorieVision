import { Switch, Route, Router as WouterRouter } from "wouter";
import { ScanProvider } from "./context/ScanContext";
import { BottomNav } from "./components/BottomNav";
import Home from "./pages/Home";
import Scan from "./pages/Scan";
import History from "./pages/History";
import Result from "./pages/Result";
import Goals from "./pages/Goals";
import { useColors } from "./hooks/useColors";

function Layout() {
  const colors = useColors();
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: colors.background, maxWidth: 480, margin: "0 auto", position: "relative" }}>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/scan" component={Scan} />
          <Route path="/history" component={History} />
          <Route path="/result/:id" component={Result} />
          <Route path="/goals" component={Goals} />
        </Switch>
      </div>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <ScanProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Layout />
      </WouterRouter>
    </ScanProvider>
  );
}
