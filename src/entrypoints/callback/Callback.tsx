import '@/assets/tailwind.css';

import ReactDOM from 'react-dom/client';

import CallbackErrorPage from '@/components/callback/CallbackErrorPage';
import CallbackSuccessPage from '@/components/callback/CallbackSuccessPage';
import { AUTH_CALLBACK_STATUSES } from '@/lib/constants';

function Callback() {
  const params = new URLSearchParams(window.location.search);
  const authStatus = params.get('status') || 'unknown';

  if (authStatus === AUTH_CALLBACK_STATUSES.SUCCESS) {
    return <CallbackSuccessPage />;
  }

  if (authStatus === AUTH_CALLBACK_STATUSES.FAILURE) {
    return <CallbackErrorPage />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">
        Unknown Authentication Status
      </h2>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Callback />);
