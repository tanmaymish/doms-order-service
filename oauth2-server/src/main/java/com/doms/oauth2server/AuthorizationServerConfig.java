package com.doms.oauth2server;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.oauth2.server.resource.OAuth2ResourceServerConfigurer;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.authorization.client.InMemoryRegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configuration.OAuth2AuthorizationServerConfiguration;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configurers.OAuth2AuthorizationServerConfigurer;
import org.springframework.security.oauth2.server.authorization.settings.ClientSettings;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.UUID;

/**
 * The authorization server, on Spring Authorization Server.
 *
 * <p>This replaces an {@code AuthorizationServerConfigurerAdapter} and a
 * {@code WebSecurityConfigurerAdapter} built on Spring Security OAuth2. That project
 * reached end of life and its classes were removed outright in Spring Security 6, so this
 * is a rewrite rather than a port. Three differences are behavioural, not cosmetic:
 *
 * <ol>
 *   <li><b>The implicit and password grants are gone.</b> The old client was registered for
 *       {@code authorization_code, implicit, password, client_credentials, refresh_token}.
 *       OAuth 2.1 removes the first two — implicit returns tokens in a URL fragment where
 *       they leak through history and referrers, and password hands the client the user's
 *       actual credentials — and Spring Authorization Server does not implement them. Any
 *       client still asking for those has to move to authorization code with PKCE.</li>
 *   <li><b>Tokens are now signed JWTs</b> with a published JWKS, rather than the opaque
 *       tokens the old in-memory token store issued. Resource servers can validate them
 *       without calling back here.</li>
 *   <li><b>PKCE is required</b> for the authorization code grant.</li>
 * </ol>
 *
 * <p>The signing key is generated fresh at startup, which is correct for a demo and wrong
 * for anything else: every restart invalidates every issued token, and two instances behind
 * a load balancer would reject each other's. A real deployment loads a persistent key.
 */
@Configuration
public class AuthorizationServerConfig {

    @Value("${redirect-uri}")
    private String redirectUri;

    /**
     * The protocol endpoints: /oauth2/authorize, /oauth2/token, /oauth2/jwks and the rest.
     * Ordered first so it claims those paths before the application's own rules.
     */
    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    SecurityFilterChain authorizationServerSecurity(HttpSecurity http) throws Exception {
        OAuth2AuthorizationServerConfiguration.applyDefaultSecurity(http);
        http.getConfigurer(OAuth2AuthorizationServerConfigurer.class)
                .oidc(withDefaults -> { });

        // An unauthenticated browser hitting /oauth2/authorize is sent to the login page
        // rather than handed a 401.
        http.exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(new LoginUrlAuthenticationEntryPoint("/login")))
                .oauth2ResourceServer(OAuth2ResourceServerConfigurer::jwt);

        return http.build();
    }

    /** Everything else: the login page, and /userInfo behind a bearer token. */
    @Bean
    SecurityFilterChain applicationSecurity(HttpSecurity http) throws Exception {
        http
                .authorizeHttpRequests(requests -> requests
                        .requestMatchers("/login", "/error").permitAll()
                        .anyRequest().authenticated())
                .formLogin(login -> login.loginPage("/login").permitAll())
                .oauth2ResourceServer(OAuth2ResourceServerConfigurer::jwt);
        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    UserDetailsService userDetailsService(PasswordEncoder passwordEncoder) {
        return new InMemoryUserDetailsManager(
                User.withUsername("admin")
                        .password(passwordEncoder.encode("admin"))
                        .roles("USER", "ADMIN")
                        .build(),
                User.withUsername("siva")
                        .password(passwordEncoder.encode("siva"))
                        .roles("USER")
                        .build());
    }

    @Bean
    RegisteredClientRepository registeredClientRepository(PasswordEncoder passwordEncoder) {
        RegisteredClient client1 = RegisteredClient.withId(UUID.randomUUID().toString())
                .clientId("client1")
                .clientSecret(passwordEncoder.encode("client1secret"))
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                // implicit and password are deliberately absent - see the class javadoc.
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
                .authorizationGrantType(AuthorizationGrantType.CLIENT_CREDENTIALS)
                .redirectUri(redirectUri)
                .scope("server")
                .scope("openid")
                .clientSettings(ClientSettings.builder()
                        .requireAuthorizationConsent(false)
                        .requireProofKey(true)
                        .build())
                .build();
        return new InMemoryRegisteredClientRepository(client1);
    }

    @Bean
    JWKSource<SecurityContext> jwkSource() {
        KeyPair keyPair = generateRsaKey();
        RSAPublicKey publicKey = (RSAPublicKey) keyPair.getPublic();
        RSAPrivateKey privateKey = (RSAPrivateKey) keyPair.getPrivate();
        RSAKey rsaKey = new RSAKey.Builder(publicKey)
                .privateKey(privateKey)
                .keyID(UUID.randomUUID().toString())
                .build();
        return new ImmutableJWKSet<>(new JWKSet(rsaKey));
    }

    @Bean
    JwtDecoder jwtDecoder(JWKSource<SecurityContext> jwkSource) {
        return OAuth2AuthorizationServerConfiguration.jwtDecoder(jwkSource);
    }

    private static KeyPair generateRsaKey() {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            return generator.generateKeyPair();
        } catch (Exception e) {
            throw new IllegalStateException("could not generate an RSA signing key", e);
        }
    }
}
