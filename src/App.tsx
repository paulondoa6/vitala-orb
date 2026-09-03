import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoadingState } from "@/components/layout/PageScaffold";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import Home from "./pages/Home";

const FlashPage = lazyWithRetry(() => import("./modules/flash/FlashPage"));
const ZonePage = lazyWithRetry(() => import("./modules/zone/ZonePage"));
const ZoneDetail = lazyWithRetry(() => import("./modules/zone/ZoneDetail"));
const ScanPage = lazyWithRetry(() => import("./modules/scan/ScanPage"));
const CreatePage = lazyWithRetry(() => import("./pages/CreatePage"));
const BoiteDetail = lazyWithRetry(() => import("./pages/BoiteDetail"));
const Profile = lazyWithRetry(() => import("./pages/Profile"));
const EditProfile = lazyWithRetry(() => import("./pages/EditProfile"));
const Settings = lazyWithRetry(() => import("./pages/Settings"));
const AuthPage = lazyWithRetry(() => import("./pages/Auth"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));

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
            <Route path="/auth" element={<AuthPage />} />
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
