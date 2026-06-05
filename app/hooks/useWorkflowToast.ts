import { useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";

type WorkflowResult = {
  ok?: boolean;
  workflowId?: string;
  simulation?: boolean;
  error?: string;
};

export function useWorkflowToast(data: WorkflowResult | undefined) {
  const shopify = useAppBridge();

  useEffect(() => {
    if (data?.ok && data.workflowId) {
      const sim = data.simulation ? " (simulation)" : "";
      shopify.toast.show(`Workflow started: ${data.workflowId}${sim}`);
    }
    if (data?.ok === false && data.error) {
      shopify.toast.show(data.error, { isError: true });
    }
  }, [data, shopify]);
}
