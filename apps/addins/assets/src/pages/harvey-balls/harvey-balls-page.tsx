import { HarveyBallsPanelView } from "@/components/harvey-balls/harvey-balls-panel-view";
import { useHarveyBallsPanelController } from "@/hooks/use-harvey-balls-panel-controller";

export function HarveyBallsPage() {
  const controller = useHarveyBallsPanelController();

  return <HarveyBallsPanelView controller={controller} />;
}
