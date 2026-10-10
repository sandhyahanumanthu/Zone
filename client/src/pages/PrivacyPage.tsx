import React from 'react';
import {
  Shield,
  MapPin,
  Lock,
  Clock,
  EyeOff,
  AlertTriangle,
  UserCheck,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <PageHeader
        title="Privacy & Data Policy"
        subtitle="Our core commitment to hyper-local collaboration without surveillance, tracking, or permanent data hoarding."
        badge="Draft Policy"
      />

      {/* Draft Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 shadow-sm">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-900">Draft Policy For Development Prototype</p>
          <p className="leading-relaxed text-amber-800">
            This document outlines the privacy architecture implemented in DropZone Phase 1 and
            Phase 2. This draft requires final legal and regulatory review before commercial
            production deployment.
          </p>
        </div>
      </div>

      {/* Policy Articles */}
      <div className="space-y-6">
        {/* Article 1 */}
        <section className="bg-white rounded-3xl p-6 md:p-8 border border-plum-200 shadow-plum-md space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-plum-100 border border-plum-200 text-rose-600 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-plum-900 brand-font">
                1. Location Permissions & Proximity Verification
              </h2>
              <p className="text-xs text-plum-500">Why your location is requested and how it is processed</p>
            </div>
          </div>
          <p className="text-sm text-plum-700 leading-relaxed">
            DropZone requests device location solely to verify that you are physically positioned
            within the specified radius of an active zone (e.g. 450 meters from a university student
            union or hackathon arena).
          </p>
          <ul className="space-y-2 text-xs text-plum-800 bg-plum-50/70 p-4 rounded-2xl border border-plum-100">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong className="text-plum-900">Verification Only:</strong> Coordinates are evaluated for geofence entry and
                are immediately discarded from ephemeral memory.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong className="text-plum-900">User Revocable:</strong> You can revoke location access in your browser or device
                settings at any time. Revoking permission will restrict posting in geofenced perimeters.
              </span>
            </li>
          </ul>
        </section>

        {/* Article 2 */}
        <section className="bg-white rounded-3xl p-6 md:p-8 border border-plum-200 shadow-plum-md space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-plum-100 border border-plum-200 text-plum-700 flex items-center justify-center">
              <EyeOff className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-plum-900 brand-font">
                2. Non-Display of Precise GPS Coordinates
              </h2>
              <p className="text-xs text-plum-500">Guaranteed protection against physical stalking and triangulation</p>
            </div>
          </div>
          <p className="text-sm text-plum-700 leading-relaxed">
            Precise GPS latitude and longitude values are strictly confidential. Under no
            circumstances are precise user coordinates broadcast across the network or displayed in
            the frontend feed. Other users inside the zone only see the general zone name and the
            public content of your post.
          </p>
        </section>

        {/* Article 3 */}
        <section className="bg-white rounded-3xl p-6 md:p-8 border border-plum-200 shadow-plum-md space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-plum-100 border border-plum-200 text-rose-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-plum-900 brand-font">
                3. Ephemeral Retention & Automatic Content Expiry
              </h2>
              <p className="text-xs text-plum-500">Automated vanishing posts prevent historical profile building</p>
            </div>
          </div>
          <p className="text-sm text-plum-700 leading-relaxed">
            All posts published to DropZone require an expiry duration (1 hour, 6 hours, 12 hours,
            or 24 hours). Once a post's expiration timestamp passes:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
            <div className="p-3.5 rounded-2xl bg-plum-50/70 border border-plum-100 text-plum-700">
              <span className="font-semibold text-plum-900 block mb-1">Excluded from Feeds</span>
              Database queries automatically filter expired posts via indexing.
            </div>
            <div className="p-3.5 rounded-2xl bg-plum-50/70 border border-plum-100 text-plum-700">
              <span className="font-semibold text-plum-900 block mb-1">No Search Indexing</span>
              Expired posts are non-discoverable by search engines and external scrapers.
            </div>
            <div className="p-3.5 rounded-2xl bg-plum-50/70 border border-plum-100 text-plum-700">
              <span className="font-semibold text-plum-900 block mb-1">Scheduled Purge</span>
              Background database tasks safely purge tombstone records.
            </div>
          </div>
        </section>

        {/* Article 4 */}
        <section className="bg-white rounded-3xl p-6 md:p-8 border border-plum-200 shadow-plum-md space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-plum-100 border border-plum-200 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-plum-900 brand-font">
                4. Moderation, Reporting & Block Controls
              </h2>
              <p className="text-xs text-plum-500">Community safety and peer harassment prevention</p>
            </div>
          </div>
          <p className="text-sm text-plum-700 leading-relaxed">
            To prevent abuse, harassment, or non-consensual content:
          </p>
          <ul className="space-y-2 text-xs text-plum-700 list-disc pl-5">
            <li>Users can flag offensive posts for review through our Report model.</li>
            <li>Users can block abusive accounts to hide their submissions permanently.</li>
            <li>Moderators have authority to remove flagged entries across zone boundaries.</li>
            <li>AI-assisted automated toxicity and spam filtering is planned for future iterations.</li>
          </ul>
        </section>

        {/* Article 5 */}
        <section className="bg-white rounded-3xl p-6 md:p-8 border border-plum-200 shadow-plum-md space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-plum-100 border border-plum-200 text-rose-600 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-plum-900 brand-font">
                5. Security of Credentials & Zero Third-Party Selling
              </h2>
              <p className="text-xs text-plum-500">Data integrity and cryptographic isolation</p>
            </div>
          </div>
          <p className="text-sm text-plum-700 leading-relaxed">
            Password hashes are never stored in plain text and are programmatically excluded from all
            API responses. DropZone does not participate in ad tracking networks, does not deploy
            invasive cross-site cookies, and will never sell personal communication logs.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPage;
