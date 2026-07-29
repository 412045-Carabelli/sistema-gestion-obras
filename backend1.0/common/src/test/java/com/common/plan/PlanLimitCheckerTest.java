package com.common.plan;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PlanLimitCheckerTest {

    @Test
    void assertFeatureEnabled_pasaSiLaFeatureEstaEnTrue() {
        assertDoesNotThrow(() ->
                PlanLimitChecker.assertFeatureEnabled("{\"facturas\":true,\"agenda\":false}", "facturas"));
    }

    @Test
    void assertFeatureEnabled_lanzaSiLaFeatureEstaEnFalse() {
        assertThrows(FeatureNotAvailableException.class, () ->
                PlanLimitChecker.assertFeatureEnabled("{\"facturas\":true,\"agenda\":false}", "agenda"));
    }

    @Test
    void assertFeatureEnabled_lanzaSiLaFeatureNoEstaEnElJson() {
        assertThrows(FeatureNotAvailableException.class, () ->
                PlanLimitChecker.assertFeatureEnabled("{\"facturas\":true}", "grupos_obras"));
    }

    @Test
    void assertFeatureEnabled_lanzaSiElHeaderEsNull() {
        // Simula el caso de bypass: sin JWT/gateway no llega X-Plan-Features
        assertThrows(FeatureNotAvailableException.class, () ->
                PlanLimitChecker.assertFeatureEnabled(null, "facturas"));
    }

    @Test
    void assertFeatureEnabled_lanzaSiElJsonEsInvalido() {
        assertThrows(FeatureNotAvailableException.class, () ->
                PlanLimitChecker.assertFeatureEnabled("{esto no es json}", "facturas"));
    }

    @Test
    void assertCanCreate_pasaSiElLimiteEsNull_sinLimiteEnterprise() {
        assertDoesNotThrow(() ->
                PlanLimitChecker.assertCanCreate("{\"maxObrasActivas\":null}", "obras", "maxObrasActivas", () -> 999L));
    }

    @Test
    void assertCanCreate_lanzaSiElContadorAlcanzoElLimite() {
        assertThrows(PlanLimitExceededException.class, () ->
                PlanLimitChecker.assertCanCreate("{\"maxObrasActivas\":10}", "obras", "maxObrasActivas", () -> 10L));
    }

    @Test
    void assertCanCreate_pasaSiElContadorEstaPorDebajoDelLimite() {
        assertDoesNotThrow(() ->
                PlanLimitChecker.assertCanCreate("{\"maxObrasActivas\":10}", "obras", "maxObrasActivas", () -> 9L));
    }

    @Test
    void getLimite_devuelveCeroSiNoHayHeader_planSinAccesoPorDefault() {
        assertEquals(0, PlanLimitChecker.getLimite(null, "maxObrasActivas"));
    }
}
