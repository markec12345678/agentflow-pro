"use client";

import { useState } from "react";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentUIProps {
  reservationId: string;
  totalAmount: number;
  currency?: string;
  onPaymentSuccess?: (paymentId: string) => void;
}

interface PaymentFormProps extends PaymentUIProps {
  clientSecret: string;
  onCancel: () => void;
}

function PaymentForm({
  reservationId,
  totalAmount,
  currency = "EUR",
  clientSecret,
  onCancel,
  onPaymentSuccess,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: {
              name: "Guest Name", // Would get from reservation
            },
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message || "Payment failed");
        toast.error("Plačilo ni uspelo");
        setProcessing(false);
        return;
      }

      if (paymentIntent.status === "succeeded") {
        toast.success("Plačilo uspešno! 🎉");
        onPaymentSuccess?.(paymentIntent.id);
      }
    } catch (err: any) {
      setError(err.message || "Payment failed");
      toast.error("Napaka pri plačilu");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#424770",
                "::placeholder": {
                  color: "#aab7c4",
                },
              },
              invalid: {
                color: "#9e2146",
              },
            },
          }}
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {processing ? "Obdelava..." : `Plačaj ${totalAmount.toFixed(2)} ${currency}`}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          Prekliči
        </button>
      </div>
    </form>
  );
}

export function PaymentUI({
  reservationId,
  totalAmount,
  currency = "EUR",
  onPaymentSuccess,
}: PaymentUIProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreatePaymentIntent = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tourism/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId,
          amount: totalAmount,
          type: "full_payment",
        }),
      });

      if (!res.ok) throw new Error("Failed to create payment intent");

      const data = await res.json();
      setClientSecret(data.clientSecret);
    } catch (error) {
      toast.error("Napaka pri pripravi plačila");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentId: string) => {
    setClientSecret(null);
    onPaymentSuccess?.(paymentId);
  };

  if (clientSecret) {
    return (
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: "stripe",
          },
        }}
      >
        <PaymentForm
          reservationId={reservationId}
          totalAmount={totalAmount}
          currency={currency}
          clientSecret={clientSecret}
          onCancel={() => setClientSecret(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      </Elements>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Znesek:</span>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalAmount.toFixed(2)} {currency}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          Varna plačila s kreditno kartico preko Stripe
        </p>
      </div>

      <button
        onClick={handleCreatePaymentIntent}
        disabled={loading}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
      >
        {loading ? "Priprava plačila..." : "Plačaj rezervacijo"}
      </button>
    </div>
  );
}
