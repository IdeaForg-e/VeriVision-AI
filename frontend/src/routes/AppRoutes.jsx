import { Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "../pages/LandingPage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import DailyTriagePage from "../pages/DailyTriagePage.jsx";
import CaseDetailPage from "../pages/CaseDetailPage.jsx";
import HumanReviewPage from "../pages/HumanReviewPage.jsx";
import FeedbackPanelPage from "../pages/FeedbackPanelPage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";
import { ProtectedRoute } from "../components/layout.jsx";

function WorkspaceRoute({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/triage" element={<WorkspaceRoute><DailyTriagePage /></WorkspaceRoute>} />
      <Route path="/case/:id" element={<WorkspaceRoute><CaseDetailPage /></WorkspaceRoute>} />
      <Route path="/case" element={<WorkspaceRoute><CaseDetailPage /></WorkspaceRoute>} />
      <Route path="/review" element={<WorkspaceRoute><HumanReviewPage /></WorkspaceRoute>} />
      <Route path="/feedback" element={<WorkspaceRoute><FeedbackPanelPage /></WorkspaceRoute>} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
