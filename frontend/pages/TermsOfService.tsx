import { useNavigate } from 'react-router-dom';

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-2 rounded px-3 py-1 text-sm font-semibold text-sky-300 hover:bg-white/5"
        >
          ← Back
        </button>
        <h1 className="mb-4 text-4xl font-bold">Terms of Service</h1>
        <p className="mb-6 text-sm text-slate-300">Effective date: 19 April 2026</p>

        <p className="mb-4 text-slate-300">
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of Transcendence,
          including user profiles, posts, comments, direct messages, file uploads, and multiplayer
          Pong features. By creating an account or using the service, you agree to these Terms. If
          you do not agree, do not use the service.
        </p>

        <h2 className="mb-2 mt-6 text-2xl font-semibold">Accounts and Access</h2>
        <p className="mb-3 text-slate-300">
          You are responsible for the accuracy of the account information you provide and for
          keeping your login credentials confidential. You must not share your account, attempt to
          access another user&apos;s account, or interfere with login, session, or matchmaking
          systems.
        </p>

        <h2 className="mb-2 mt-6 text-2xl font-semibold">Acceptable Use</h2>
        <p className="mb-3 text-slate-300">
          You may use the service only for lawful, normal social and gameplay activity. You must not
          harass other users, impersonate another person, send abusive or threatening messages,
          upload malicious files, attempt to scrape or disrupt the platform, exploit bugs, or use
          the game, chat, or social systems to spam, cheat, or manipulate other users.
        </p>

        <h2 className="mb-2 mt-6 text-2xl font-semibold">User Content and Uploads</h2>
        <p className="mb-3 text-slate-300">
          You remain responsible for the content you post or upload, including avatars, post media,
          chat attachments, comments, and messages. You must have the rights needed to share that
          content. By submitting content, you grant us a limited license to store, process, copy,
          and display it only as needed to operate and improve the service.
        </p>

        <h2 className="mb-2 mt-6 text-2xl font-semibold">Moderation and Enforcement</h2>
        <p className="mb-3 text-slate-300">
          We may review reports, remove content, block file access, restrict features, suspend
          accounts, or terminate access when we believe these Terms have been violated or when doing
          so is necessary to protect users, the service, or our infrastructure. We may also keep
          records related to abuse prevention, moderation, or security investigations.
        </p>

        <h2 className="mb-2 mt-6 text-2xl font-semibold">Service Availability</h2>
        <p className="mb-3 text-slate-300">
          Transcendence is provided for educational and demonstration purposes. Features may change,
          be interrupted, or be removed without notice. Matchmaking, chat delivery, notifications,
          uploads, and gameplay availability may depend on network conditions and system health.
        </p>

        <h2 className="mb-2 mt-6 text-2xl font-semibold">Disclaimer and Liability</h2>
        <p className="mb-3 text-slate-300">
          The service is provided &quot;as is&quot; and &quot;as available&quot; without warranties
          of any kind. To the maximum extent permitted by law, we are not liable for indirect,
          incidental, special, consequential, or punitive damages, or for loss of data, access, or
          content arising from use of the service, interruptions, moderation decisions, or user
          misconduct.
        </p>

        <h2 className="mb-2 mt-6 text-2xl font-semibold">Termination</h2>
        <p className="mb-3 text-slate-300">
          You may stop using the service at any time. We may suspend or terminate access if your
          conduct creates legal, security, operational, or community risk, or if you repeatedly or
          seriously violate these Terms.
        </p>

        <h2 className="mb-2 mt-6 text-2xl font-semibold">Governing Law</h2>
        <p className="mb-3 text-slate-300">
          These Terms are governed by the applicable law of the jurisdiction in which the service is
          operated, unless mandatory law requires otherwise.
        </p>

        <h2 className="mb-2 mt-6 text-2xl font-semibold">Contact</h2>
        <p className="mb-6 text-slate-300">Questions about these Terms: terms@transcendence.app</p>

        <p className="text-sm text-slate-400">
          We may update these Terms from time to time by posting the revised version here.
        </p>
      </div>
    </div>
  );
}
