import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
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
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-sm text-slate-300 mb-6">Effective date: 17 April 2026</p>

        <p className="mb-4 text-slate-300">
          This Privacy Policy explains how Transcendence ("we", "us", or "our") collects, uses, and
          shares information when you use our social gaming application, including chat, posts, and
          multiplayer game features.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Information We Collect</h2>
        <p className="text-slate-300 mb-3">
          We collect information you provide directly (account details, profile, avatar), content
          you create (posts, messages), and usage data (logs, device and connection information). We
          may also collect data provided by third-party services if you connect them.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">How We Use Information</h2>
        <p className="text-slate-300 mb-3">
          We use the information to provide and improve the service, enable real-time features like
          chat and game sessions, personalize your experience, communicate with you about your
          account, and detect abuse or security issues.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Sharing and Disclosure</h2>
        <p className="text-slate-300 mb-3">
          We may share data with service providers who perform services on our behalf, in connection
          with a business transfer, or to comply with legal obligations. We do not sell personal
          information.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Your Choices</h2>
        <p className="text-slate-300 mb-3">
          You can review and update your profile information and avatar. You may also request
          account deletion or export of your data by contacting us (see contact below).
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Security</h2>
        <p className="text-slate-300 mb-3">
          We take reasonable measures to protect your data, but no service can be completely secure.
          Please use unique passwords and protect access to your devices.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Children</h2>
        <p className="text-slate-300 mb-3">Our service is not intended for children under 13.</p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Contact</h2>
        <p className="text-slate-300 mb-6">
          For privacy requests or questions, contact: support@transcendence.app
        </p>

        <p className="text-sm text-slate-400">
          We may update this policy; changes will be posted here.
        </p>
      </div>
    </div>
  );
}
