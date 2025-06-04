export default function PrivacyPage() {
  return (
    <div className="w-full h-screen">
      <iframe
        src="/docs/privacy.pdf"
        width="100%"
        height="100%"
        style={{ border: "none" }}
      />
    </div>
  );
}
