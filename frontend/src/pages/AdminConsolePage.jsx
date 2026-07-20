// AdminConsolePage.jsx — REDESIGNED: Now hosts the Admin tuning panel and pipeline calibration console.
import { Layout } from "../components/Layout.jsx";
import { PerceptionThresholds, BusinessPolicyRouting, PrivacySecurity, AdjustmentHistory, SavePipelineButton, RegisterProductCard } from "../components/Feedback.jsx";
import { useFeedbackConfig } from "../hooks/useFeedbackConfig.js";

export default function AdminConsolePage() {
  const { config, history, loading, saveState, updateThreshold, togglePrivacy, addRoutingRule, save } =
    useFeedbackConfig();

  if (loading || !config) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64 text-on-surface-variant">Loading pipeline config…</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex justify-between items-end mb-8">
        <div className="space-y-1">
          <h1 className="font-headline-lg text-headline-lg text-on-background">Admin Console — Pipeline Tuning</h1>
          <p className="font-body-md text-on-surface-variant">
            Calibrate computer vision thresholds and business logic routing parameters as an administrator.
          </p>
        </div>
        <SavePipelineButton state={saveState} onSave={save} />
      </div>

      <div className="grid grid-cols-12 gap-gutter">
        <RegisterProductCard />
        <PerceptionThresholds thresholds={config.thresholds} onChange={updateThreshold} />
        <BusinessPolicyRouting rules={config.routingRules} onAddRule={addRoutingRule} />
        <PrivacySecurity privacy={config.privacy} onToggle={togglePrivacy} />
        <AdjustmentHistory history={history} />
      </div>
    </Layout>
  );
}
