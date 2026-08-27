import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoadingState } from "@/components/layout/PageScaffold";
import Home from "./pages/Home";

const FlashPage = lazy(() => import("./modules/flash/FlashPage"));
const ZonePage = lazy(() => import("./modules/zone/ZonePage"));
const ZoneDetail = lazy(() => import("./modules/zone/ZoneDetail"));
const ScanPage = lazy(() => import("./modules/scan/ScanPage"));
const CreatePage = lazy(() => import("./pages/CreatePage"));
const BoiteDetail = lazy(() => import("./pages/BoiteDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<LoadingState label="Un instant…" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/flash" element={<FlashPage />} />
            <Route path="/zone" element={<ZonePage />} />
            <Route path="/zone/:zoneId" element={<ZoneDetail />} />
            <Route path="/scan" element={<ScanPage />} />
            <Route path="/espace" element={<CreatePage />} />
            <Route path="/create" element={<CreatePage />} />
            <Route path="/boite/:uuid" element={<BoiteDetail />} />
            <Route path="/espace/:uuid" element={<BoiteDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
