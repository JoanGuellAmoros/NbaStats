import { useEffect, type ReactNode } from "react";
import { HashRouter, Route, Routes, useLocation } from "react-router-dom";
import { DataProvider } from "@/context/DataContext";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SyncPanel } from "@/components/SyncPanel";
import { Toasts } from "@/components/Toasts";
import HomePage from "@/pages/HomePage";
import GamesPage from "@/pages/GamesPage";
import GamePage from "@/pages/GamePage";
import StandingsPage from "@/pages/StandingsPage";
import TeamsPage from "@/pages/TeamsPage";
import TeamPage from "@/pages/TeamPage";
import PlayersPage from "@/pages/PlayersPage";
import PlayerPage from "@/pages/PlayerPage";
import RecordsPage from "@/pages/RecordsPage";
import DataPage from "@/pages/DataPage";
import NotFoundPage from "@/pages/NotFoundPage";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <DataProvider>
        <ScrollToTop />
        <Shell>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/partits" element={<GamesPage />} />
            <Route path="/partits/:id" element={<GamePage />} />
            <Route path="/classificacio" element={<StandingsPage />} />
            <Route path="/equips" element={<TeamsPage />} />
            <Route path="/equips/:id" element={<TeamPage />} />
            <Route path="/jugadors" element={<PlayersPage />} />
            <Route path="/jugadors/:id" element={<PlayerPage />} />
            <Route path="/records" element={<RecordsPage />} />
            <Route path="/dades" element={<DataPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Shell>
        <SyncPanel />
        <Toasts />
      </DataProvider>
    </HashRouter>
  );
}
