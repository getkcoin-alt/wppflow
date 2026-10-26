import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { CheckoutSuccess } from "@/components/CheckoutSuccess";

export const metadata: Metadata = {
  title: "Order confirmation",
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessPage() {
  return (
    <Container className="py-20">
      <CheckoutSuccess />
    </Container>
  );
}
