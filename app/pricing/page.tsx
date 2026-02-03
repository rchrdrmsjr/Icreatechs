import { Navbar } from "@/components/navbar";
import Link from "next/link";

export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      features: [
        "5 projects",
        "Basic AI completions",
        "Community support",
        "1GB storage",
      ],
    },
    {
      name: "Pro",
      price: "$20",
      features: [
        "Unlimited projects",
        "Advanced AI features",
        "Priority support",
        "50GB storage",
        "Team collaboration",
      ],
    },
    {
      name: "Enterprise",
      price: "Custom",
      features: [
        "Everything in Pro",
        "SSO & SAML",
        "Dedicated support",
        "Unlimited storage",
        "SLA guarantee",
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="px-4 py-16">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold">
              Simple, transparent pricing
            </h1>
            <p className="text-muted-foreground">
              Choose the plan that fits your needs. Upgrade or downgrade
              anytime.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className="flex flex-col rounded-lg border border-border p-6"
              >
                <h3 className="mb-2 text-xl font-semibold">{plan.name}</h3>
                <div className="mb-4 text-3xl font-bold">
                  {plan.price}
                  {plan.price !== "Custom" && (
                    <span className="text-sm text-muted-foreground">
                      /month
                    </span>
                  )}
                </div>
                <ul className="mb-6 flex-1 space-y-3 text-sm text-muted-foreground">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className="text-foreground">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/sign-up"
                  className="rounded-md border border-border px-4 py-2 text-center text-sm hover:bg-accent"
                >
                  Get started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
