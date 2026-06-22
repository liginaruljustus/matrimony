// Registration now requires email verification.
// Use POST /api/register/send-otp then POST /api/register/verify-otp.
export async function POST() {
  return Response.json(
    { message: "Use /api/register/send-otp to begin registration." },
    { status: 410 },
  );
}
