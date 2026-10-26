package com.grouphub.ofd.payment;

/**
 * ── Creational: FACTORY METHOD ── subclasses decide which gateway to build
 * (SDD §5.6.4a · DT-M3-1). A second provider (PayPal) is added without touching
 * PaymentService. processPayment() is the template flow shared by every provider.
 */
public abstract class PaymentGatewayFactory {   // UML: «Factory»

    protected abstract PaymentGateway createGateway();   // factory method (overridden)

    public GatewayResult processPayment(String token, double amount) {
        if (amount <= 0) throw new InvalidPaymentException();   // DT-M3-1 C2 → A3
        PaymentGateway gateway = createGateway();               // Seq SD003
        return gateway.chargeCard(token, amount, "MYR");        // C3/C4
    }
}

class StripeGatewayFactory extends PaymentGatewayFactory {
    @Override
    protected PaymentGateway createGateway() {
        return new StripeGatewayAdapter(new StripeExternalApi());   // wraps 3rd-party (Adapter)
    }
}

class PayPalGatewayFactory extends PaymentGatewayFactory {
    @Override
    protected PaymentGateway createGateway() {
        return new PayPalGatewayAdapter(new PayPalExternalApi());
    }
}

/** DT-M3-1 R3 — amount invalid/zero. */
class InvalidPaymentException extends RuntimeException {
    InvalidPaymentException() {
        super("Invalid payment request");
    }
}
