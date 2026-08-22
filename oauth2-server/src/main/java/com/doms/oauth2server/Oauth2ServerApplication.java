package com.doms.oauth2server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * There is no {@code @EnableAuthorizationServer} or {@code @EnableResourceServer} here any
 * more; both annotations belonged to Spring Security OAuth2 and were removed in Spring
 * Security 6. The equivalent configuration lives in {@link AuthorizationServerConfig}.
 */
@SpringBootApplication
@RestController
public class Oauth2ServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(Oauth2ServerApplication.class, args);
    }

    /**
     * Kept at its original path so anything already calling it does not break.
     *
     * <p>It used to take an {@code OAuth2Authentication} and read the wrapped user
     * authentication. Tokens are JWTs now, so the claims arrive already parsed on the
     * {@link JwtAuthenticationToken}. Note that the standard OIDC userinfo endpoint is
     * available at {@code /userinfo} for clients requesting the {@code openid} scope;
     * this one exists only for backwards compatibility.
     */
    @GetMapping("/userInfo")
    public Map<String, Object> user(JwtAuthenticationToken authentication) {
        Jwt token = authentication.getToken();
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("user", token.getSubject());
        userInfo.put("authorities", AuthorityUtils.authorityListToSet(authentication.getAuthorities()));
        return userInfo;
    }
}
