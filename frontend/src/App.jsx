import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AdminPage } from "./components/AdminPage";
import { PublicSite } from "./components/PublicSite";
import { RegisterPage } from "./components/RegisterPage";
import { basePath } from "./lib/basePath";
import { DEFAULT_PUBLIC_VERSION } from "./lib/versions";

export default function App() {
  return (
    <BrowserRouter basename={basePath || undefined}>
      <Routes>
        <Route path="/" element={<PublicSite forcedVersion={DEFAULT_PUBLIC_VERSION} />} />
        <Route path="/register" element={<RegisterPage forcedVersion={DEFAULT_PUBLIC_VERSION} />} />
        <Route path="/backend" element={<AdminPage />} />
        <Route path="/:version/register" element={<RegisterPage />} />
        <Route path="/:version" element={<PublicSite />} />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
