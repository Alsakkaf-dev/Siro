package com.grouphub.ofd.payment;

/**
 * ── Structural: ADAPTER ── (SDD §5.6.4b, PCI-safe). The «Target» interface our
 * code expects, plus the Stripe/PayPal «Adaptees» and «Adapters» that convert
 * each provider's API to it. Card data never reaches us — only a token/ref.
 */
public interface PaymentGateway {   // UML: «Target»

    GatewayResult chargeCard(String token, double amount, String currency);
}

/** Our normalised charge result (status ∈ APPROVED, DECLINED). */
record GatewayResult(String gatewayRef, String status) {
}

/** Raised on a gateway timeout/error (DT-M3-1 C3 → R4 PENDING). */
class GatewayTimeoutException extends RuntimeException {
}

// ── Stripe ──────────────────────────────────────────────────────────────────
/** «Adaptee» — 3rd-party Stripe API (mocked). token drives the demo outcome. */
class StripeExternalApi {
    StripeResponse createCharge(StripePayload p) {
        if ("tok_timeout".equals(p.token())) throw new GatewayTimeoutException();
        String status = "tok_declined".equals(p.token()) ? "DECLINED" : "APPROVED";
        return new StripeResponse("ch_" + p.amountCents(), status);
    }
}

record StripePayload(String token, long amountCents, String currency) {
}

record StripeResponse(String id, String status) {
}

/** «Adapter» — converts Stripe createCharge() → our chargeCard(). */
class StripeGatewayAdapter implements PaymentGateway {
    private final StripeExternalApi stripeApi;

    StripeGatewayAdapter(StripeExternalApi stripeApi) {
        this.stripeApi = stripeApi;
    }

    @Override
    public GatewayResult chargeCard(String token, double amount, String currency) {
        StripePayload payload = new StripePayload(token, (long) (amount * 100), currency); // smallest unit
        StripeResponse resp = stripeApi.createCharge(payload);                              // card never stored
        return new GatewayResult(resp.id(), resp.status());
    }
}

// ── PayPal (second provider added in the Final Project) ─────────────────────
class PayPalExternalApi {
    String pay(long amountCents, String currency) {
        return "pp_" + amountCents;
    }
}

class PayPalGatewayAdapter implements PaymentGateway {
    private final PayPalExternalApi payPalApi;

    PayPalGatewayAdapter(PayPalExternalApi payPalApi) {
        this.payPalApi = payPalApi;
    }

    @Override
    public GatewayResult chargeCard(String token, double amount, String currency) {
        return new GatewayResult(payPalApi.pay((long) (amount * 100), currency), "APPROVED");
    }
}
