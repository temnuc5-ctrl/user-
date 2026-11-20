import { Link, Navigate, Route, Routes } from 'react-router';
import PageSecteur from './pages/Secteur';
import PageIdentification from './pages/Identification';
import PageVerification from './pages/Verification';

function Introuvable() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-neutral-900">Page introuvable</h1>
      <Link to="/rapport/secteur" className="mt-4 inline-block min-h-11 underline">Revenir au choix du secteur</Link>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/rapport/secteur" replace />} />
      <Route path="/rapport/secteur" element={<PageSecteur />} />
      <Route path="/rapport/identification" element={<PageIdentification />} />
      <Route path="/rapport/verification" element={<PageVerification />} />
      <Route path="*" element={<Introuvable />} />
    </Routes>
  );
}
