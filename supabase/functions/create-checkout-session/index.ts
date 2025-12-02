import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

interface CheckoutPayload {
  tier: "creator" | "pro";
  email: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { tier, email }: CheckoutPayload = await req.json();
    const userId = req.headers
      .get("x-user-id") || "";

    if (!tier || !email) {
      return new Response(
        JSON.stringify({ error: "Missing tier or email" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const pricing: Record<string, { priceId: string; name: string }> = {
      creator: {
        priceId: Deno.env.get("STRIPE_CREATOR_PRICE_ID") || "",
        name: "Creator Plan",
      },
      pro: {
        priceId: Deno.env.get("STRIPE_PRO_PRICE_ID") || "",
        name: "Pro Plan",
      },
    };

    const tierInfo = pricing[tier];
    if (!tierInfo?.priceId) {
      return new Response(
        JSON.stringify({ error: "Invalid tier" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const successUrl = `${Deno.env.get("SUPABASE_URL")}/success?tier=${tier}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${Deno.env.get("SUPABASE_URL")}/pricing`;

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "payment_method_types[]": "card",
        "line_items[0][price]": tierInfo.priceId,
        "line_items[0][quantity]": "1",
        "mode": "subscription",
        "success_url": successUrl,
        "cancel_url": cancelUrl,
        "customer_email": email,
        "metadata[user_id]": userId,
        "metadata[tier]": tier,
      }).toString(),
    });

    const session = await response.json();

    if (!response.ok) {
      console.error("Stripe error:", session);
      return new Response(
        JSON.stringify({ error: "Failed to create checkout session" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
