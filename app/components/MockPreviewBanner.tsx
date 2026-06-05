type MockPreviewBannerProps = {
  message?: string;
};

export function MockPreviewBanner({
  message = "Preview layout — sample data below. Real data will appear once this section is wired to the API.",
}: MockPreviewBannerProps) {
  return (
    <s-banner tone="info">
      <s-paragraph>{message}</s-paragraph>
    </s-banner>
  );
}
