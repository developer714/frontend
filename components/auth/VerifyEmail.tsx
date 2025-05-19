"use client";
import Link from 'next/link';

export default function VerifyEmail() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="rounded-md bg-green-50 p-4">
          <div className="text-sm text-green-700">
            Please check your email for a verification link. Once verified, you can log in to your account.
          </div>
          <div className="mt-4 text-center">
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Go to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 