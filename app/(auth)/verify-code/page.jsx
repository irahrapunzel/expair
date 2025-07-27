'use client';

import { useState } from 'react';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import { useRouter } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

export default function VerifyCodePage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      // SKIP validation and API for now
      return true;
    },
    onSuccess: () => {
      setSuccessMessage('Code verified!');
      setTimeout(() => {
        router.push('/reset-password'); // NEXT STEP
      }, 800); // small delay just for feedback
    },
  });

  const handleResend = async () => {
    setSuccessMessage('Code resent!');
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-cover bg-center text-white px-4 ${inter.className}`}
      style={{ backgroundImage: "url('/assets/bg_signin.png')" }}
    >
      <div className="z-10 flex flex-col items-center space-y-6 text-center max-w-md w-full">
        <img
          src="/assets/logos/Colored=Logo S.png"
          alt="Logo"
          className="h-12 w-auto mb-[20px]"
        />

        <h1 className="font-bold text-[25px] mb-[20px]">Password reset</h1>
        <p className="text-[16px] text-white/80 mb-[35px]">
          We’ve sent a code to <strong>yourname@email.com</strong>
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSuccessMessage('');
            mutation.mutate();
          }}
          className="w-full space-y-4 flex flex-col items-center"
        >
          <Input
            placeholder="Enter 6-digit code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mb-[20px] w-[400px] max-w-full text-center tracking-[0.5em] text-[20px]"
            maxLength={6}
          />

          <div className="w-[400px] max-w-full text-left mb-2 min-h-[20px]">
            {successMessage && (
              <p className="text-sm text-[#6DDFFF]">{successMessage}</p>
            )}
          </div>

          <Button
            type="submit"
            className="flex w-[400px] max-w-full h-[50px] justify-center items-center px-[38px] py-[13px] shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] hover:bg-[#1a4dff] text-white text-sm sm:text-[20px] font-normal transition rounded-[15px] mb-[20px]"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Verifying...' : 'Confirm'}
          </Button>
        </form>

        <p className="text-center text-sm mt-4 text-[16px] mb-[35px]">
          Didn’t receive the code?{' '}
          <button
            onClick={handleResend}
            className="text-[#6DDFFF] hover:underline"
          >
            Click to resend
          </button>
        </p>

        <Link
          href="/signin"
          className="text-[#0038FF] hover:underline flex items-center gap-1 text-[20px]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>

        <div className="fixed bottom-[62px] left-0 w-full flex justify-center gap-2 z-10">
          <span className="w-[120px] h-[10px] rounded-[15px] bg-white opacity-50" />
          <span className="w-[120px] h-[10px] rounded-[15px] bg-[#0038FF]" />
          <span className="w-[120px] h-[10px] rounded-[15px] bg-white opacity-50" />
        </div>
      </div>
    </div>
  );
}
