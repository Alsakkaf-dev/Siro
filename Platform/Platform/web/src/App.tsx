import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Shell } from './shell/Shell.js';
import { SemesterLayout } from './core/sem-context.js';
import { RedirectKeep } from './shell/RedirectKeep.js';
import { REDIRECTS } from './core/registry.js';
import Dashboard from './pages/Dashboard.js'; // الصفحة الأكثر زيارة: ضمن الحزمة الرئيسية لتقليل جولات الشبكة

const Today = lazy(() => import('./pages/Today.js'));
const Calendar = lazy(() => import('./pages/Calendar.js'));
const CalendarMeals = lazy(() => import('./pages/CalendarMeals.js'));
const CalendarProposals = lazy(() => import('./pages/CalendarProposals.js'));
const Kitchen = lazy(() => import('./pages/Kitchen.js'));
const KitchenStore = lazy(() => import('./pages/KitchenStore.js'));
const KitchenCart = lazy(() => import('./pages/KitchenCart.js'));
const KitchenPantry = lazy(() => import('./pages/KitchenPantry.js'));
const KitchenWallet = lazy(() => import('./pages/KitchenWallet.js'));
const KitchenPrices = lazy(() => import('./pages/KitchenPrices.js'));
const KitchenCodex = lazy(() => import('./pages/KitchenCodex.js'));
const KitchenCook = lazy(() => import('./pages/KitchenCook.js'));
const KitchenPlan = lazy(() => import('./pages/KitchenPlan.js'));
const Semesters = lazy(() => import('./pages/Semesters.js'));
const Courses = lazy(() => import('./pages/Courses.js'));
const CoursePage = lazy(() => import('./pages/CoursePage.js'));
const Timeline = lazy(() => import('./pages/Timeline.js'));
const Calculator = lazy(() => import('./pages/Calculator.js'));
const Unknowns = lazy(() => import('./pages/Unknowns.js'));
const PrintSummary = lazy(() => import('./pages/PrintSummary.js'));
const Settings = lazy(() => import('./pages/Settings.js'));
const SearchPage = lazy(() => import('./pages/SearchPage.js'));
const Life = lazy(() => import('./pages/Life.js'));
const LifeFinance = lazy(() => import('./pages/LifeFinance.js'));
const LifePrayers = lazy(() => import('./pages/LifePrayers.js'));
const LifeHabits = lazy(() => import('./pages/LifeHabits.js'));
const LifeRoutine = lazy(() => import('./pages/LifeRoutine.js'));
const LifeBody = lazy(() => import('./pages/LifeBody.js'));
const LifeCommands = lazy(() => import('./pages/LifeCommands.js'));
const LifeAlternatives = lazy(() => import('./pages/LifeAlternatives.js'));
const LifeLedger = lazy(() => import('./pages/LifeLedger.js'));
const LifeRoutineMap = lazy(() => import('./pages/LifeRoutineMap.js'));
const LifeInsights = lazy(() => import('./pages/LifeInsights.js'));
const LifeQadaPlan = lazy(() => import('./pages/LifeQadaPlan.js'));
const Glossary = lazy(() => import('./pages/Glossary.js'));
const Review = lazy(() => import('./pages/Review.js'));
const Sports = lazy(() => import('./pages/Sports.js'));
const SportsTemplates = lazy(() => import('./pages/SportsTemplates.js'));
const SportsMine = lazy(() => import('./pages/SportsMine.js'));
const Library = lazy(() => import('./pages/Library.js'));
const LibraryFolders = lazy(() => import('./pages/LibraryFolders.js'));
const LibraryYoutube = lazy(() => import('./pages/LibraryYoutube.js'));
const LibraryItem = lazy(() => import('./pages/LibraryItem.js'));
const NotFound = lazy(() => import('./pages/NotFound.js'));

/** المسارات مطابقة لسجل التنقل (core/registry.ts) — يتحقق منها tests/registry.test.ts. */
export function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Today />} />
        <Route path="academic" element={<Semesters />} />
        <Route path="academic/s/:semId" element={<SemesterLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/:courseId" element={<CoursePage />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="calculator" element={<Calculator />} />
          <Route path="unknowns" element={<Unknowns />} />
          <Route path="print" element={<PrintSummary />} />
        </Route>
        <Route path="library" element={<Library />} />
        <Route path="library/folders" element={<LibraryFolders />} />
        <Route path="library/youtube" element={<LibraryYoutube />} />
        <Route path="library/f/:id" element={<LibraryItem source="file" />} />
        <Route path="library/y/:id" element={<LibraryItem source="youtube" />} />
        <Route path="life" element={<Life />} />
        <Route path="life/finance" element={<LifeFinance />} />
        <Route path="life/prayers" element={<LifePrayers />} />
        <Route path="life/habits" element={<LifeHabits />} />
        <Route path="life/routine" element={<LifeRoutine />} />
        <Route path="life/body" element={<LifeBody />} />
        <Route path="life/alternatives" element={<LifeAlternatives />} />
        <Route path="life/ledger" element={<LifeLedger />} />
        <Route path="life/routine-map" element={<LifeRoutineMap />} />
        <Route path="life/insights" element={<LifeInsights />} />
        <Route path="life/qada-plan" element={<LifeQadaPlan />} />
        <Route path="review" element={<Review />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="calendar/meals" element={<CalendarMeals />} />
        <Route path="calendar/proposals" element={<CalendarProposals />} />
        <Route path="sports" element={<Sports />} />
        <Route path="sports/templates" element={<SportsTemplates />} />
        <Route path="sports/mine" element={<SportsMine />} />
        <Route path="life/commands" element={<LifeCommands />} />
        <Route path="kitchen" element={<Kitchen />} />
        <Route path="kitchen/store" element={<KitchenStore />} />
        <Route path="kitchen/store/:slug" element={<KitchenStore />} />
        <Route path="kitchen/cart" element={<KitchenCart />} />
        <Route path="kitchen/pantry" element={<KitchenPantry />} />
        <Route path="kitchen/wallet" element={<KitchenWallet />} />
        <Route path="kitchen/prices" element={<KitchenPrices />} />
        <Route path="kitchen/codex" element={<KitchenCodex />} />
        <Route path="kitchen/codex/:slug" element={<KitchenCodex />} />
        <Route path="kitchen/cook" element={<KitchenCook />} />
        <Route path="kitchen/plan" element={<KitchenPlan />} />
        <Route path="settings" element={<Settings />} />
        <Route path="glossary" element={<Glossary />} />
        <Route path="search" element={<SearchPage />} />
        {REDIRECTS.map((r) => (
          <Route key={r.from} path={r.from.slice(1)} element={<RedirectKeep to={r.to} />} />
        ))}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
