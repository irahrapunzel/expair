"use client";

import Link from "next/link";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function TermsAndConditionsPage() {
  return (
    <div
      className={`${inter.className} max-w-[950px] mx-auto px-6 py-20 text-white`}
    >
      {/* Heading */}
      <h4 className="text-[28px] font-bold mb-[50px]">Terms and Conditions</h4>

      {/* Section 1 */}
      <div className="space-y-[30px]">
        <div>
          <h5 className="text-[20px] font-semibold mb-[15px]">
            1. Acceptance of Terms
          </h5>
          <p className="text-sm text-white/90">
            By accessing or using our platform, you agree to be bound by these
            Terms and Conditions and all applicable laws and regulations. If you
            do not agree with any part of these terms, please do not use our
            services.
          </p>
        </div>

        <div>
          <h5 className="text-[20px] font-semibold mb-[15px]">
            2. Use of the Platform
          </h5>
          <ul className="list-disc list-inside text-sm text-white/90 space-y-1">
            <li>You must be at least 18 years old to use our platform.</li>
            <li>
              You agree to provide accurate, current, and complete information
              when registering and using the platform.
            </li>
            <li>
              You are responsible for maintaining the confidentiality of your
              account credentials and for all activities under your account.
            </li>
          </ul>
        </div>

        <div>
          <h5 className="text-[20px] font-semibold mb-[15px]">
            3. Service Requests and Offers
          </h5>
          <ul className="list-disc list-inside text-sm text-white/90 space-y-1">
            <li>
              Our platform facilitates the exchange of services between users.
              We do not provide the services ourselves and are not responsible
              for the quality, legality, or safety of the services exchanged.
            </li>
            <li>
              Users agree to communicate honestly and fulfill their commitments
              as agreed upon in their trades.
            </li>
            <li>
              Any disputes arising from service exchanges should be resolved
              between the users involved. We may assist in mediation but hold no
              liability.
            </li>
          </ul>
        </div>

        <div>
          <h5 className="text-[20px] font-semibold mb-[15px]">
            4. Prohibited Conduct
          </h5>
          <ul className="list-disc list-inside text-sm text-white/90 space-y-1">
            <li>Use the platform for any unlawful or fraudulent purposes.</li>
            <li>Post false, misleading, or harmful content.</li>
            <li>Violate intellectual property rights or privacy of others.</li>
            <li>
              Attempt to disrupt or interfere with the platform’s operation.
            </li>
          </ul>
        </div>

        <div>
          <h5 className="text-[20px] font-semibold mb-[15px]">
            5. Intellectual Property
          </h5>
          <ul className="list-disc list-inside text-sm text-white/90 space-y-1">
            <li>
              All content provided by users remains their property. By using the
              platform, you grant us a limited license to display and distribute
              your content as necessary to operate the service.
            </li>
            <li>
              You agree not to use any content from the platform without proper
              authorization.
            </li>
          </ul>
        </div>

        <div>
          <h5 className="text-[20px] font-semibold mb-[15px]">6. Privacy</h5>
          <p className="text-sm text-white/90">
            Your use of the platform is also governed by our Privacy Policy,
            which explains how we collect, use, and protect your information.
          </p>
        </div>

        <div>
          <h5 className="text-[20px] font-semibold mb-[15px]">
            7. Limitation of Liability
          </h5>
          <ul className="list-disc list-inside text-sm text-white/90 space-y-1">
            <li>
              The platform is provided “as is” without warranties of any kind.
            </li>
            <li>We do not guarantee uninterrupted or error-free service.</li>
            <li>
              We are not liable for any damages arising from your use of the
              platform or from service exchanges between users.
            </li>
          </ul>
        </div>

        <div>
          <h5 className="text-[20px] font-semibold mb-[15px]">
            8. Indemnification
          </h5>
          <p className="text-sm text-white/90">
            You agree to indemnify and hold harmless the platform, its
            affiliates, and employees from any claims, damages, or losses
            arising from your violation of these Terms or your use of the
            platform.
          </p>
        </div>

        <div>
          <h5 className="text-[20px] font-semibold mb-[15px]">
            9. Termination
          </h5>
          <p className="text-sm text-white/90">
            We reserve the right to suspend or terminate your account at our
            discretion, including for violations of these Terms or illegal
            activities.
          </p>
        </div>

        <div>
          <h5 className="text-[20px] font-semibold mb-[15px]">
            10. Changes to Terms
          </h5>
          <p className="text-sm text-white/90">
            We may update these Terms and Conditions at any time. Continued use
            of the platform after changes constitutes acceptance of the new
            terms.
          </p>
        </div>

        <div>
          <h5 className="text-[20px] font-semibold mb-[15px]">
            11. Governing Law
          </h5>
          <p className="text-sm text-white/90">
            These Terms are governed by the laws of [Your Jurisdiction]. Any
            disputes will be subject to the exclusive jurisdiction of the courts
            in that jurisdiction.
          </p>
        </div>
      </div>

      {/* Contact Us Section */}
      <div className="mt-[100px]">
        <h4 className="text-3xl font-bold mb-[50px]">Contact Us</h4>
        <p className="text-base text-white/90 mb-3">
          If you have any questions or concerns about our terms, please contact
          us at{" "}
          <a
            href="mailto:expaircs@gmail.com"
            className="text-[#9FA8FF] hover:text-white underline transition"
          >
            expaircs@gmail.com
          </a>
          .
        </p>

        <p className="text-base text-white/90 mb-3">
          To send a ticket, visit our{" "}
          <Link
            href="/help"
            className="text-[#9FA8FF] hover:text-white underline transition"
          >
            Help Center
          </Link>
          .
        </p>

        <p className="text-base text-white/90">
          Address: 123 Service Lane, City, Country
        </p>
      </div>

      {/* Effective Date */}
      <div className="mt-[50px] text-right text-white/40 text-sm">
        Effective Date: May 30, 2025
      </div>
    </div>
  );
}
