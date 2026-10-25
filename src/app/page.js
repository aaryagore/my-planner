import { redirect } from 'next/navigation';

/* The root URL redirects to the dashboard.
   Later we'll add a landing/sign-in page here. */
export default function Home() {
  redirect('/dashboard');
}
