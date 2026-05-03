import React from "react";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/50 sm:p-10">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            This Privacy Policy explains how Medi-trap collects, uses, and
            protects your personal information.
          </p>
        </header>

        <section className="space-y-6 text-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Information We Collect
            </h2>
            <p className="mt-3 leading-7">
              We collect information you provide when creating an account,
              signing in, placing requests, or contacting support. This may
              include your name, email address, phone number, business details,
              and other account data.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              How We Use Your Data
            </h2>
            <p className="mt-3 leading-7">
              We use your information to deliver the service, manage your
              account, respond to requests, and improve the platform. We may
              also use data to send important updates or security notifications.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Sharing and Disclosure
            </h2>
            <p className="mt-3 leading-7">
              We do not sell your personal information. We may share data with
              service providers who help operate the platform, or when required
              by law.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Data Security
            </h2>
            <p className="mt-3 leading-7">
              We take reasonable measures to protect your information from
              unauthorized access, loss, or misuse. However, no system is
              completely secure.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Your Rights
            </h2>
            <p className="mt-3 leading-7">
              You may review, update, or request deletion of your personal
              information by contacting support or using the account settings
              provided in the app.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Changes to This Policy
            </h2>
            <p className="mt-3 leading-7">
              We may update this policy from time to time. When we do, we will
              post the updated version here with an effective date.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-lg font-semibold text-slate-900">Contact Us</h3>
            <p className="mt-3 leading-7 text-slate-700">
              If you have questions about this Privacy Policy, please reach out
              to our support team through the application or via the contact
              methods listed on the site.
            </p>
          </div>
        </section>

        <div className="mt-10 text-center">
          <Link
            to="/"
            className="inline-flex rounded-full bg-cyan-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
          >
            Return to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
