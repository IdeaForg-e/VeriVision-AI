import { Layout } from "../components/layout/index.jsx";
import { PerceptionThresholds, BusinessPolicyRouting, PrivacySecurity, AdjustmentHistory, SavePipelineButton } from "../components/feedback/index.jsx";
import { useFeedbackConfig } from "../hooks/useFeedbackConfig.js";

export default function FeedbackPanelPage() {
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
          <h1 className="font-headline-lg text-headline-lg text-on-background">Pipeline Tuning Panel</h1>
          <p className="font-body-md text-on-surface-variant">
            Calibrate computer vision thresholds and business logic routing parameters.
          </p>
        </div>
        <SavePipelineButton state={saveState} onSave={save} />
      </div>

      <div className="grid grid-cols-12 gap-gutter">
        <PerceptionThresholds thresholds={config.thresholds} onChange={updateThreshold} />
        <BusinessPolicyRouting rules={config.routingRules} onAddRule={addRoutingRule} />
        <PrivacySecurity privacy={config.privacy} onToggle={togglePrivacy} />
        <AdjustmentHistory history={history} />
      </div>
    </Layout>
  );
}
