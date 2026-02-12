import { useGame } from '@/contexts/GameContext';
import GameSidebar from './GameSidebar';
import Dashboard from './Dashboard';
import SquadView from './SquadView';
import PlayoffsView from './PlayoffsView';
import FreeAgentsView from './FreeAgentsView';
import TransferMarketView from './TransferMarketView';
import FinanceView from './FinanceView';

const viewComponents: Record<string, React.ComponentType> = {
  dashboard: Dashboard,
  squad: SquadView,
  playoffs: PlayoffsView,
  recruitment: FreeAgentsView,
  transfers: TransferMarketView,
  finance: FinanceView,
};

export default function GameLayout() {
  const { currentView } = useGame();
  const ViewComponent = viewComponents[currentView] || Dashboard;

  return (
    <div className="flex min-h-screen w-full">
      <GameSidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-h-screen">
        <ViewComponent />
      </main>
    </div>
  );
}
