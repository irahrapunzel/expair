"use client";

import Link from "next/link";

import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function PrivacyPolicyPage() {
  return (
    <div
      className={`${inter.className} max-w-[950px] mx-auto px-6 py-20 text-white`}
    >
      {/* Section: Privacy Policy */}
      <h4 className="text-3xl font-bold mb-[50px]">Privacy Policy</h4>

      <div className="space-y-[40px] text-white/90 text-base leading-relaxed">
        {/* Introduction */}
        <div>
          <h5 className="text-xl font-semibold mb-[15px]">Introduction</h5>
          <p>
            Your privacy is important to us. This Privacy Policy explains how we
            collect, use, disclose, and protect your personal information when
            you use our platform to request or offer services. By using our
            services, you agree to the terms outlined in this policy.
          </p>
        </div>

        {/* Information We Collect */}
        <div>
          <h5 className="text-xl font-semibold mb-[15px]">
            Information We Collect
          </h5>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Personal Information:</strong> When you register or use
              our platform, we may collect your name, email address, contact
              details, and other information necessary to facilitate service
              requests and exchanges.
            </li>
            <li>
              <strong>Service Information:</strong> Details about the services
              you request or offer, including descriptions, deadlines, and
              communication records.
            </li>
            <li>
              <strong>Usage Data:</strong> Information about your interactions
              with our platform, such as IP address, browser type, pages
              visited, and time spent on the site.
            </li>
          </ul>
        </div>

        {/* How We Use Your Information */}
        <div>
          <h5 className="text-xl font-semibold mb-[15px]">
            How We Use Your Information
          </h5>
          <ol className="list-decimal list-inside space-y-2">
            <li>To provide and manage the services you request or offer.</li>
            <li>
              To communicate with you regarding your requests, offers, updates,
              and support.
            </li>
            <li>
              To improve our platform, including troubleshooting, data analysis,
              and enhancing user experience.
            </li>
            <li>
              To comply with legal obligations and protect against fraud or
              unauthorized activities.
            </li>
          </ol>
        </div>

        {/* Information Sharing and Disclosure */}
        <div>
          <h5 className="text-xl font-semibold mb-[15px]">
            Information Sharing and Disclosure
          </h5>
          <p className="mb-4">
            We do not sell or rent your personal information to third parties.
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              We may share your information with service providers who assist us
              in operating the platform, under strict confidentiality
              agreements.
            </li>
            <li>
              Your information may be shared with other users as necessary to
              facilitate trades and communications.
            </li>
            <li>
              We may disclose information if required by law or to protect our
              rights and safety.
            </li>
          </ul>
        </div>

        {/* Data Security */}
        <div>
          <h5 className="text-xl font-semibold mb-[15px]">Data Security</h5>
          <p>
            We implement reasonable technical and organizational measures to
            protect your personal data from unauthorized access, loss, or
            misuse. However, no online platform can guarantee 100% security.
          </p>
        </div>

        {/* Your Choices and Rights */}
        <div>
          <h5 className="text-xl font-semibold mb-[15px]">
            Your Choices and Rights
          </h5>
          <ul className="list-disc list-inside space-y-2">
            <li>
              You may update or correct your personal information at any time
              through your account settings.
            </li>
            <li>
              You can opt out of receiving marketing communications by following
              the unsubscribe instructions in emails.
            </li>
            <li>
              Depending on your jurisdiction, you may have rights to access,
              delete, or restrict the use of your personal data. Please contact
              us to exercise these rights.
            </li>
          </ul>
        </div>

        {/* Cookies and Tracking Technologies */}
        <div>
          <h5 className="text-xl font-semibold mb-[15px]">
            Cookies and Tracking Technologies
          </h5>
          <p>
            Our platform uses cookies and similar technologies to enhance your
            experience, analyze usage, and deliver personalized content. You can
            manage cookie preferences through your browser settings.
          </p>
        </div>

        {/* Children’s Privacy */}
        <div>
          <h5 className="text-xl font-semibold mb-[15px]">
            Children’s Privacy
          </h5>
          <p>
            Our services are not directed to individuals under the age of 13. We
            do not knowingly collect personal information from children without
            parental consent.
          </p>
        </div>

        {/* Changes to This Privacy Policy */}
        <div>
          <h5 className="text-xl font-semibold mb-[15px]">
            Changes to This Privacy Policy
          </h5>
          <p>
            We may update this Privacy Policy from time to time. We will notify
            you of significant changes by posting the new policy on this page
            and updating the effective date.
          </p>
        </div>
      </div>

      {/* Section: Contact Us */}
      <div className="mt-[100px]">
        <h4 className="text-3xl font-bold mb-[50px]">Contact Us</h4>
        <p className="text-white/90 text-base leading-relaxed max-w-[700px]">
          If you have any questions or concerns about this Privacy Policy or how
          we handle your information, please contact us at{" "}
          <a
            href="mailto:expaircs@gmail.com"
            className="underline text-[#9FA8FF]"
          >
            expaircs@gmail.com
          </a>
          . To send a ticket, visit our{" "}
          <Link href="/help" className="underline text-[#9FA8FF]">
            Help Center
          </Link>
          .
        </p>
      </div>

      {/* Footer Note */}
      <div className="mt-[50px] text-right text-sm text-white/40">
        Effective Date: May 30, 2025
      </div>
    </div>
  );
}
