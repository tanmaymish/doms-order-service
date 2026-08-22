package com.doms.shoppingcartui.gateway;

import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Drives real HTTP through the gateway to a stub backend.
 *
 * <p>Route definitions binding correctly is necessary but not sufficient: the whole point
 * of the Zuul replacement is that the console's existing URLs still reach the same places,
 * and that depends on how StripPrefix interacts with the servlet context path. Asserting
 * on the route beans would not have caught getting that wrong, so this asserts on the
 * path the backend actually receives.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = "eureka.client.enabled=false")
class GatewayRoutingTest {

    private static final MockWebServer BACKEND = new MockWebServer();

    static {
        try {
            BACKEND.start();
        } catch (IOException e) {
            throw new IllegalStateException("could not start the stub backend", e);
        }
    }

    @DynamicPropertySource
    static void registerTheStubAsCatalogService(DynamicPropertyRegistry registry) {
        // The shipped routes are left exactly as they are, including lb://catalog-service.
        // Instead of rewriting the route, the stub is registered *as* catalog-service with
        // the simple discovery client, so the real route definition is what gets exercised.
        //
        // Overriding spring.cloud.gateway.server.webmvc.routes[0].uri here would not work
        // anyway: Boot binds a collection from a single property source rather than merging
        // across them, so supplying one element's uri replaces the whole list and leaves a
        // route with no predicate.
        registry.add("spring.cloud.discovery.client.simple.instances.catalog-service[0].uri",
                () -> "http://localhost:" + BACKEND.getPort());
    }

    @AfterAll
    static void stopBackend() throws IOException {
        BACKEND.shutdown();
    }

    @LocalServerPort
    int port;

    @Autowired
    TestRestTemplate rest;

    @Test
    void proxiesTheConsolesUrlToTheBackendWithTheServicePrefixStripped() throws Exception {
        BACKEND.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody("[{\"code\":\"P001\"}]"));

        ResponseEntity<String> response = rest.getForEntity(
                "http://localhost:" + port + "/ui/api/catalog-service/api/products", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("P001");

        RecordedRequest received = BACKEND.takeRequest(5, TimeUnit.SECONDS);
        assertThat(received).isNotNull();
        assertThat(received.getPath())
                .as("StripPrefix=2 should remove /api/catalog-service, and the /ui context "
                        + "path should never reach the backend")
                .isEqualTo("/api/products");
    }

    @Test
    void stampsTheCorrelationHeaderOnProxiedRequests() throws Exception {
        BACKEND.enqueue(new MockResponse().setResponseCode(200).setBody("[]"));

        rest.getForEntity(
                "http://localhost:" + port + "/ui/api/catalog-service/api/products", String.class);

        RecordedRequest received = BACKEND.takeRequest(5, TimeUnit.SECONDS);
        assertThat(received).isNotNull();
        assertThat(received.getHeader("AUTH_HEADER"))
                .as("the servlet filter replaced ctx.addZuulRequestHeader; the header must "
                        + "still reach the downstream service")
                .isNotBlank();
    }

    @Test
    void doesNotProxyServicesThatHaveNoRoute() {
        // Zuul routed anything registered with Eureka. Only the three declared routes are
        // reachable now, so an unlisted service is a 404 at the edge rather than a proxy.
        ResponseEntity<String> response = rest.getForEntity(
                "http://localhost:" + port + "/ui/api/oauth2-server/api/tokens", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
