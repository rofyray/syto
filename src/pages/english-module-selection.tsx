import { AppLayout } from "@/components/layout/app-layout";
import { ModuleSelection } from "@/components/learning/module-selection";

export function EnglishModuleSelectionPage() {
  return (
    <AppLayout>
      <ModuleSelection subject="english" />
    </AppLayout>
  );
}
