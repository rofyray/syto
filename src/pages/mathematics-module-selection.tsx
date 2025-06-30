import { AppLayout } from "@/components/layout/app-layout";
import { ModuleSelection } from "@/components/learning/module-selection";

export function MathematicsModuleSelectionPage() {
  return (
    <AppLayout>
      <ModuleSelection subject="mathematics" />
    </AppLayout>
  );
}
