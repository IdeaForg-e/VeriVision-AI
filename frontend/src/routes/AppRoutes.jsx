import { Routes, Route, Navigate } from "react-router-dom";
import HumanReviewPage from "../pages/HumanReviewPage.jsx";
import FeedbackPanelPage from "../pages/FeedbackPanelPage.jsx";
import DailyTriagePage from "../pages/DailyTriagePage.jsx";
import CaseDetailPage from "../pages/CaseDetailPage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/triage" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/triage" element={<DailyTriagePage />} />
      {/* :id is optional — CaseDetailPage falls back to a default case when omitted */}
      <Route path="/case/:id" element={<CaseDetailPage />} />
      <Route path="/case" element={<CaseDetailPage />} />
      <Route path="/review" element={<HumanReviewPage />} />
      <Route path="/feedback" element={<FeedbackPanelPage />} />
      {/* 404 catch-all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
