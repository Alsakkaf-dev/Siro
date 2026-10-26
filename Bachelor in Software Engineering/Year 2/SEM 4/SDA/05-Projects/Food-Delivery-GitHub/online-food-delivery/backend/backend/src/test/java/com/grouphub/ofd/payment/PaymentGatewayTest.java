package com.grouphub.ofd.payment;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Verifies the Factory Method + Adapter (SDD §5.6.4a/b · DT-M3-1): the factory
 * builds a provider adapter and the template rejects invalid amounts / timeouts.
 */
class PaymentGatewayTest {

    @Test
    void stripe_approves_a_normal_token() {
        GatewayResult r = new StripeGatewayFactory().processPayment("tok_ok", 42.50);
        assertEquals("APPROVED", r.status());
        assertTrue(r.gatewayRef().startsWith("ch_"));
    }

    @Test
    void stripe_declines_the_declined_token() {                // DT-M3-1 R2
        GatewayResult r = new StripeGatewayFactory().processPayment("tok_declined", 42.50);
        assertEquals("DECLINED", r.status());
    }

    @Test
    void invalid_amount_is_rejected() {                        // DT-M3-1 R3
        assertThrows(InvalidPaymentException.class,
                () -> new StripeGatewayFactory().processPayment("tok_ok", 0));
    }

    @Test
    void gateway_timeout_propagates() {                        // DT-M3-1 R4
        assertThrows(GatewayTimeoutException.class,
                () -> new StripeGatewayFactory().processPayment("tok_timeout", 10));
    }

    @Test
    void paypal_factory_uses_the_paypal_adapter() {            // Factory Method — 2nd provider
        GatewayResult r = new PayPalGatewayFactory().processPayment("tok_ok", 10);
        assertEquals("APPROVED", r.status());
        assertTrue(r.gatewayRef().startsWith("pp_"));
    }
}
