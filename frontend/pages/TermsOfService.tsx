import { useNavigate } from 'react-router-dom';

export default function TermsOfService() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-2 rounded px-3 py-1 text-sm font-semibold text-sky-300 hover:bg-white/5"
        >
          ← Back
        </button>
        <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
        <p className="text-sm text-slate-300 mb-6">Effective date: 17 April 2026</p>

        <p className="mb-4 text-slate-300">
          These Terms of Service ("Terms") govern your access to and use of Transcendence. By using
          the service you agree to these Terms. If you do not agree, do not use the service.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Accounts</h2>
        <p className="text-slate-300 mb-3">
          You are responsible for maintaining the security of your account and for all activity that
          occurs under it. Do not share your password.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">User Conduct</h2>
        <p className="text-slate-300 mb-3">
          You must not use the service to harass, threaten, or infringe the rights of others.
          Content must follow our community guidelines. We reserve the right to remove content and
          suspend accounts that violate these Terms.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Intellectual Property</h2>
        <p className="text-slate-300 mb-3">
          We and our licensors own the platform and its contents. By posting content you grant us a
          license to host and display it as part of the service.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Disclaimers & Limitation of Liability</h2>
        <p className="text-slate-300 mb-3">
          The service is provided "as is". To the maximum extent permitted by law, we disclaim
          warranties and limit our liability for damages.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Termination</h2>
        <p className="text-slate-300 mb-3">
          We may suspend or terminate accounts that violate these Terms.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Governing Law</h2>
        <p className="text-slate-300 mb-3">
          These Terms are governed by applicable law where the service operates.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Contact</h2>
        <p className="text-slate-300 mb-6">Questions or requests: terms@transcendence.app</p>

        <p className="text-sm text-slate-400">Last updated: 17 April 2026</p>
      </div>
    </div>
  );
}
