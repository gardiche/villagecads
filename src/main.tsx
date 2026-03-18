import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { queryClient } from "./lib/queryClient";
import { GuestDataSyncProvider } from "./components/GuestDataSyncProvider";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <GuestDataSyncProvider>
        <App />
      </GuestDataSyncProvider>
    </QueryClientProvider>
  </HelmetProvider>
);
