import React from "react";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Privacy Policy
        </h1>
        <p className="text-gray-700 mb-4">
          This Privacy Policy explains how Medi-trap collects, uses, and
          protects your personal information.
        </p>
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Information We Collect
            </h2>
            <p className="text-gray-600">
              We collect information you provide when creating an account,
              signing in, placing requests, or contacting support.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              How We Use Your Data
            </h2>
            <p className="text-gray-600">
              We use your information to deliver the service, manage your
              account, and improve the platform.
            </p>
          </div>
        </div>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
