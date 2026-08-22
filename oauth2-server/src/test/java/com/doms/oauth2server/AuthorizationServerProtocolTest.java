package com.doms.oauth2server;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Exercises the authorization server over HTTP.
 *
 * <p>A context-loads test would pass on an authorization server that starts cleanly and
 * issues nothing. Since replacing Spring Security OAuth2 with Spring Authorization Server
 * changed the endpoint paths, the token format and the supported grants, these assert on
 * the protocol surface a client actually depends on.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class AuthorizationServerProtocolTest {

    @LocalServerPort
    int port;

    @Autowired
    TestRestTemplate rest;

    private String url(String path) {
        return "http://localhost:" + port + "/authserver" + path;
    }

    @Test
    void publishesItsOwnDiscoveryDocument() {
        ResponseEntity<String> response =
                rest.getForEntity(url("/.well-known/oauth-authorization-server"), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody())
                .contains("\"token_endpoint\"")
                .contains("\"jwks_uri\"");
    }

    @Test
    void publishesTheKeysResourceServersNeedToValidateTokens() {
        // The old server issued opaque tokens from an in-memory store, so there was nothing
        // to publish and every resource server had to call back to check a token.
        ResponseEntity<String> response = rest.getForEntity(url("/oauth2/jwks"), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("\"kty\":\"RSA\"");
    }

    @Test
    void issuesAClientCredentialsToken() {
        ResponseEntity<String> response = requestToken("client_credentials", "server");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody())
                .contains("\"access_token\"")
                .contains("\"token_type\":\"Bearer\"");
    }

    @Test
    void refusesThePasswordGrant() {
        // Registered clients used to allow it. OAuth 2.1 removed the grant - it hands the
        // client the user's actual credentials - and Spring Authorization Server does not
        // implement it, so this must fail rather than quietly keep working.
        ResponseEntity<String> response = requestToken("password", "server");

        assertThat(response.getStatusCode().is2xxSuccessful())
                .as("the password grant must not issue a token")
                .isFalse();
    }

    @Test
    void rejectsAnUnknownClientSecret() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.setBasicAuth("client1", "not-the-secret");

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "client_credentials");

        ResponseEntity<String> response = rest.exchange(url("/oauth2/token"), HttpMethod.POST,
                new HttpEntity<>(form, headers), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    private ResponseEntity<String> requestToken(String grantType, String scope) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.setBasicAuth("client1", "client1secret");

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", grantType);
        form.add("scope", scope);

        return rest.exchange(url("/oauth2/token"), HttpMethod.POST,
                new HttpEntity<>(form, headers), String.class);
    }
}
