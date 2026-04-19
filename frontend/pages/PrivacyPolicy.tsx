import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
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
        <h1 className="mb-4 text-4xl font-bold">Privacy Policy</h1>
        <p className="mb-6 text-sm text-slate-300">Effective date: 19 April 2026</p>

        <p className="mb-4 text-slate-300">
          This Privacy Policy explains how Transcendence (&quot;we&quot;, &quot;us&quot;, or
          &quot;our&quot;) collects, uses, stores, and discloses information when you use our social
          gaming application, including accounts, profiles, posts, comments, direct messages, file
          uploads, notifications, and multiplayer Pong features.
        </p>

        <h2 className="mb-2 mt-6 text-2xl font-semibold">Information We Collect</h2>
        <p className="mb-3 text-slate-300">
          We collect information you provide directly, such as username, display name, email
          address, password, profile edits, and any avatar or other files you upload. We also
          collect content you create through the service, including posts, comments, bookmarked or
          shared content, direct messages, friend activity, chat attachments, and gameplay-related
          interactions.
        </p>

        <h2 className="mb-2 mt-6 text-2xl font-semibold">Session and Technical Data</h2>
        <p className="mb-3 text-slate-300">
          We use authentication and refresh cookies to keep you signed in and to protect your
          account session. We also process technical and operational data such as IP-address-related
          connection information, browser and device metadata, request logs, socket connection
          events, and security signals needed to run real-time chat, multiplayer sessions, uploads,
          and abuse prevention tools.
        </p>

        <h2 className="mb-2 mt-6 text-2xl font-semibold">How We Use Information</h2>
        <p className="mb-3 text-slate-300">
          We use personal information and service data to create and secure accounts, authenticate
          sessions, deliver social and gameplay features, display profiles and content, route direct
          messages, store uploaded files, send notifications, maintain service reliability, diagnose
          bugs, enforce our Terms of Service, and detect fraud, abuse, cheating, or other security
          issues.
        </p>

        <h2 className="mb-2 mt-6 text-2xl font-semibold">How Information Is Shared</h2>
        <p className="mb-3 text-slate-300">
          Information you choose to publish through the service may be visible to other users based
          on the feature you use. We may also disclose information to hosting or infrastructure
          providers that support operation of the service, to administrators or moderators handling
          abuse and security matters, in connection with legal obligations, or when necessary to
          protect users, our systems, or our rights. We do not sell personal information.
        </p>

        <h2 className="mb-2 mt-6 text-2xl font-semibold">Data Retention</h2>
        <p className="mb-3 text-slate-300">
          We keep account, content, upload, and technical records for as long as they are needed to
          operate the service, preserve legitimate business or educational records, investigate
          abuse, or comply with legal obligations. Retention periods may vary depending on the type
          of content and the reason it was collected.
        </p>

        <h2 className="mb-2 mt-6 text-2xl font-semibold">Your Choices</h2>
        <p className="mb-3 text-slate-300">
          You can update parts of your profile information inside the application and can stop using
          the service at any time. If you have a privacy request about your account or personal
          data, contact us using the details below. We will review requests in light of the
          functionality we provide and any legal or security obligations that apply.
        </p>

        <h2 className="mb-2 mt-6 text-2xl font-semibold">Security</h2>
        <p className="mb-3 text-slate-300">
          We use reasonable technical and organizational measures to protect account data, session
          handling, and uploaded content. No online service is completely secure, so you should use
          a strong unique password and protect access to your own devices and browser sessions.
        </p>

        <h2 className="mb-2 mt-6 text-2xl font-semibold">Children</h2>
        <p className="mb-3 text-slate-300">
          The service is not intended for children under 13, and we do not knowingly design the
          platform for use by young children.
        </p>

        <h2 className="mb-2 mt-6 text-2xl font-semibold">Contact</h2>
        <p className="mb-6 text-slate-300">
          For privacy questions or requests, contact: support@transcendence.app
        </p>

        <p className="text-sm text-slate-400">
          We may update this Privacy Policy from time to time by posting the revised version here.
        </p>
      </div>
    </div>
  );
}
