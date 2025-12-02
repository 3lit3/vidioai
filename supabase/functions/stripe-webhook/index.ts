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

interface StripeEvent {
  type: string;
  data: {
    object: {
      id: string;
      customer: string;
      subscription: string;
      status: string;
      metadata?: Record<string, string>;
      [key: string]: any;
    };
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const event: StripeEvent = await req.json();

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdate(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionCancelled(event.data.object);
        break;

      case "payment_method.attached":
        await handlePaymentMethodAttached(event.data.object);
        break;

      case "payment_method.detached":
        await handlePaymentMethodDetached(event.data.object);
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

async function handleSubscriptionUpdate(subscription: any) {
  try {
    const userId = subscription.metadata?.user_id;
    const tier = subscription.metadata?.tier;

    if (!userId || !tier) return;

    const { error: subscriptionError } = await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          tier,
          stripe_subscription_id: subscription.id,
          status: subscription.status === "active" ? "active" : "cancelled",
          current_period_start: new Date(
            subscription.current_period_start * 1000
          ),
          current_period_end: new Date(subscription.current_period_end * 1000),
        },
        { onConflict: "user_id" }
      );

    if (subscriptionError) {
      console.error("Error upserting subscription:", subscriptionError);
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ subscription_tier: tier })
      .eq("id", userId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
    }
  } catch (error) {
    console.error("Error handling subscription update:", error);
  }
}

async function handleSubscriptionCancelled(subscription: any) {
  try {
    const userId = subscription.metadata?.user_id;

    if (!userId) return;

    const { error } = await supabase
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("user_id", userId);

    if (error) {
      console.error("Error cancelling subscription:", error);
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ subscription_tier: "starter" })
      .eq("id", userId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
    }
  } catch (error) {
    console.error("Error handling subscription cancellation:", error);
  }
}

async function handlePaymentMethodAttached(paymentMethod: any) {
  try {
    const userId = paymentMethod.customer;
    const lastFour = paymentMethod.card?.last4 || ""
    const expMonth = paymentMethod.card?.exp_month;
    const expYear = paymentMethod.card?.exp_year;

    const { error } = await supabase.from("payment_methods").insert([
      {
        user_id: userId,
        stripe_payment_method_id: paymentMethod.id,
        type: "card",
        last_four: lastFour,
        expiry_month: expMonth,
        expiry_year: expYear,
        is_default: false,
      },
    ]);

    if (error) {
      console.error("Error storing payment method:", error);
    }
  } catch (error) {
    console.error("Error handling payment method attached:", error);
  }
}

async function handlePaymentMethodDetached(paymentMethod: any) {
  try {
    const { error } = await supabase
      .from("payment_methods")
      .delete()
      .eq("stripe_payment_method_id", paymentMethod.id);

    if (error) {
      console.error("Error deleting payment method:", error);
    }
  } catch (error) {
    console.error("Error handling payment method detached:", error);
  }
}