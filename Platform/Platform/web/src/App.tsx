import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Shell } from './shell/Shell.js';
import { SemesterLayout } from './core/sem-context.js';
import { useApp } from './core/app-context.js';
import Dashboard from './pages/Dashboard.js'; // الصفحة الأكثر زيارة: ضمن الحزمة الرئيسية لتقليل جولات الشبكة

const Home = lazy(() => import('./pages/Home.js'));
const Semesters = lazy(() => import('./pages/Semesters.js'));
const Courses = lazy(() => import('./pages/Courses.js'));
const CoursePage = lazy(() => import('./pages/CoursePage.js'));
const Timeline = lazy(() => import('./pages/Timeline.js'));
const Calculator = lazy(() => import('./pages/Calculator.js'));
const Weights = lazy(() => import('./pages/Weights.js'));
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
const LifeSettings = lazy(() => import('./pages/LifeSettings.js'));
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
const LibrarySettings = lazy(() => import('./pages/LibrarySettings.js'));
const LibraryItem = lazy(() => import('./pages/LibraryItem.js'));
const NotFound = lazy(() => import('./pages/NotFound.js'));
const ImportSemester = lazy(() => import('./pages/ImportSemester.js'));
const Week = lazy(() => import('./pages/Week.js'));
const Everything = lazy(() => import('./pages/Everything.js'));
const Inbox = lazy(() => import('./pages/Inbox.js'));
const SiteMap = lazy(() => import('./pages/SiteMap.js'));
const Trash = lazy(() => import('./pages/Trash.js'));
const Activity = lazy(() => import('./pages/Activity.js'));
const Spaces = lazy(() => import('./pages/Spaces.js'));
const SpaceTemplates = lazy(() => import('./pages/Spaces.js').then((m) => ({ default: m.SpaceTemplates })));
const AllAutomations = lazy(() => import('./pages/Spaces.js').then((m) => ({ default: m.AllAutomations })));
const Space = lazy(() => import('./pages/Space.js'));
const ReviewProgress = lazy(() => import('./pages/ReviewProgress.js'));
const PublicShare = lazy(() => import('./pages/PublicShare.js'));

function AcademicIndex() {
  return <Semesters />;
}

export function App() {
  const { activeId } = useApp();
  void activeId;
  return (
    <Routes>
      <Route path="p/:token" element={<Suspense fallback={null}><PublicShare /></Suspense>} />
      <Route element={<Shell />}>
        <Route index element={<Home />} />
        <Route path="academic" element={<AcademicIndex />} />
        <Route path="academic/import" element={<ImportSemester />} />
        <Route path="academic/s/:semId" element={<SemesterLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/:courseId" element={<CoursePage />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="calculator" element={<Calculator />} />
          <Route path="weights" element={<Weights />} />
          <Route path="unknowns" element={<Unknowns />} />
          <Route path="print" element={<PrintSummary />} />
        </Route>
        <Route path="library" element={<Library />} />
        <Route path="library/folders" element={<LibraryFolders />} />
        <Route path="library/youtube" element={<LibraryYoutube />} />
        <Route path="library/settings" element={<LibrarySettings />} />
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
        <Route path="life/glossary" element={<Glossary />} />
        <Route path="review" element={<Review />} />
        <Route path="sports" element={<Sports />} />
        <Route path="sports/templates" element={<SportsTemplates />} />
        <Route path="sports/mine" element={<SportsMine />} />
        <Route path="life/commands" element={<LifeCommands />} />
        <Route path="life/settings" element={<LifeSettings />} />
        <Route path="settings" element={<Settings />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="home" element={<Navigate to="/" replace />} />
        {/* الخطوط الجديدة (docs/design/IA_METRO_MAP.md) */}
        <Route path="week" element={<Week />} />
        <Route path="everything" element={<Everything />} />
        <Route path="inbox" element={<Inbox />} />
        <Route path="map" element={<SiteMap />} />
        <Route path="trash" element={<Trash />} />
        <Route path="activity" element={<Activity />} />
        <Route path="spaces" element={<Spaces />} />
        <Route path="spaces/templates" element={<SpaceTemplates />} />
        <Route path="spaces/automations" element={<AllAutomations />} />
        <Route path="spaces/:id" element={<Space />} />
        <Route path="review/progress" element={<ReviewProgress />} />
        {/* أسماء بديلة مريحة — الروابط القديمة تبقى كما هي (ADR-0006) */}
        <Route path="today" element={<Navigate to="/" replace />} />
        <Route path="study" element={<Navigate to="/academic" replace />} />
        <Route path="settings/trash" element={<Navigate to="/trash" replace />} />
        <Route path="spaces/new" element={<Navigate to="/spaces/templates" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
