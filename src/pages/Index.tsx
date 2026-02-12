import { useGame, GameProvider } from '@/contexts/GameContext';
import TeamSelect from '@/components/game/TeamSelect';
import GameLayout from '@/components/game/GameLayout';

function GameContent() {
  const { league } = useGame();

  if (!league || !league.userTeamId) {
    return <TeamSelect />;
  }

  return <GameLayout />;
}

const Index = () => {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
};

export default Index;
