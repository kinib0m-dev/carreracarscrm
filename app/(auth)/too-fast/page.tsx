// This page is to prevent from DDOS, appear here from ratelimiting actions.

export default function TooFastPage() {
  return (
    <main className="flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold text-white">
        Whoa, slow down there, speedy!
      </h1>
      <p className="mt-3 max-w-xl text-center text-gray-400">
        Looks like you&apos;ve been a little too eager. We&apos;ve put a
        temporary pause on your excitement. Chill for a bit, and try again
        shortly.
      </p>
    </main>
  );
}
