import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

import { GlobalActionFab } from './GlobalActionFab';

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 overflow-x-hidden pb-24">
        <div className="mx-auto w-full max-w-md">
          <Outlet />
        </div>
      </main>
      <BottomNav />
      <GlobalActionFab />
    </div>
  );
}
