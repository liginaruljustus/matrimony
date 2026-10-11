import Link from "next/link";

/**
 * The Terms of Use text. Shared by the public page (/terms-of-use) and the
 * in-app acceptance page (/terms) so both always show the same wording.
 */
export const TERMS_SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "1. About these terms",
    body: (
      <p>
        Lura Tamil Matrimony (&ldquo;Lura&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is a matrimony
        information service for Tamil families. These terms apply to everyone who registers or uses the
        service. By registering, you agree to them.
      </p>
    ),
  },
  {
    title: "2. Who can register",
    body: (
      <ul>
        <li>Brides must be at least 18 years old and grooms at least 21 years old.</li>
        <li>You must be legally free to marry.</li>
        <li>A profile may be created by the person themselves or by a family member on their behalf, with their consent.</li>
        <li>One email address may be used for more than one profile (for example, for family members). Each profile gets its own Profile ID and password.</li>
      </ul>
    ),
  },
  {
    title: "3. Your account",
    body: (
      <ul>
        <li>You sign in with your Profile ID and password, which are emailed to you when you register. Keep them private.</li>
        <li>You are responsible for activity on your account. Tell us at once if you think someone else has access to it.</li>
      </ul>
    ),
  },
  {
    title: "4. Your profile information",
    body: (
      <ul>
        <li>Everything you enter, including your photo, must be true, current and your own.</li>
        <li>Once you submit your profile it is locked. To change it, send an edit request from your dashboard and our team will unlock it.</li>
        <li>We may ask for clarification, and we may remove or suspend profiles that appear false, misleading or abusive.</li>
      </ul>
    ),
  },
  {
    title: "5. How the service works",
    body: (
      <ul>
        <li>Profiles are browsed by Profile ID. Names, photos and contact details are not shown while browsing.</li>
        <li>A groom sends a proposal to a bride by making the Initial Payment for her profile. After our team verifies the payment, the bride&apos;s family receives the proposal.</li>
        <li>If the bride&apos;s family accepts, the groom can make the Final Payment. After our team verifies it, names and contact details are shared with both families.</li>
        <li>Additional details may become visible only after a waiting period set by us.</li>
      </ul>
    ),
  },
  {
    title: "6. Fees and payments",
    body: (
      <ul>
        <li>Registration and use of the service are free for brides.</li>
        <li>Grooms pay an Initial Payment and a Final Payment for each bride profile. The amounts depend on the bride&apos;s family class and are shown on our home page and on the payment page before you pay.</li>
        <li>Payments are made directly to the account shown on the payment page, by UPI, Google Pay, PayTm or bank transfer. You then enter your transaction reference so our team can verify it.</li>
        <li>We do not use a card payment gateway. We will never ask for your card number, UPI PIN, OTP or bank password.</li>
        <li>A payment counts only after our team has verified and approved it.</li>
      </ul>
    ),
  },
  {
    title: "7. Refunds",
    body: (
      <p>
        Payments are non-refundable once our team has approved them. See our{" "}
        <Link href="/refund-policy">Refund Policy</Link> for details, including what happens if a
        payment cannot be verified.
      </p>
    ),
  },
  {
    title: "8. Conduct",
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>harass, abuse, threaten or discriminate against anyone;</li>
          <li>impersonate another person or give false information;</li>
          <li>ask another member for money, or use the service for any commercial or unlawful purpose;</li>
          <li>copy, share or misuse another member&apos;s details or photos outside the purpose of a marriage proposal.</li>
        </ul>
      </>
    ),
  },
  {
    title: "9. Your own checks",
    body: (
      <ul>
        <li>We do not guarantee a match or a marriage.</li>
        <li>Profile details are provided by members. We do not independently verify them, so please make your own enquiries before any decision.</li>
        <li>Never send money to another member. Involve your family and meet in safe, public places.</li>
      </ul>
    ),
  },
  {
    title: "10. Suspension and closing your account",
    body: (
      <ul>
        <li>You can hide (freeze) your profile at any time from Settings.</li>
        <li>We may suspend or remove an account that breaks these terms or puts other members at risk.</li>
        <li>To close your account or delete your data, contact us using the details on our <Link href="/contact">Contact</Link> page.</li>
      </ul>
    ),
  },
  {
    title: "11. Liability",
    body: (
      <p>
        The service is provided as it is. To the extent the law allows, we are not responsible for
        losses arising from information supplied by members, from decisions you make based on a
        profile, or from dealings between members.
      </p>
    ),
  },
  {
    title: "12. Privacy",
    body: (
      <p>
        Our <Link href="/privacy-policy">Privacy Policy</Link> explains what information we collect and
        who can see it.
      </p>
    ),
  },
  {
    title: "13. Changes and governing law",
    body: (
      <p>
        We may update these terms; the date at the top of the Terms page shows the latest version.
        These terms are governed by the laws of India.
      </p>
    ),
  },
];
