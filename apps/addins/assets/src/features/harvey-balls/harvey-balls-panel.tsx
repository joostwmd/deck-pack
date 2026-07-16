import { HarveyBallsPanelView } from "@/features/harvey-balls/harvey-balls-panel-view";
import { useHarveyBallsPanelController } from "@/features/harvey-balls/use-harvey-balls-panel-controller";

export function HarveyBallsPanel() {
  const controller = useHarveyBallsPanelController();

  return <HarveyBallsPanelView controller={controller} />;
}
