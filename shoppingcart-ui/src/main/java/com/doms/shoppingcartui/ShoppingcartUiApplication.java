package com.doms.shoppingcartui;

import com.doms.shoppingcartui.filters.AuthHeaderFilter;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;

/**
 * The edge: a Spring Cloud Gateway that also serves the React console from its own jar.
 *
 * <p>There is no {@code @EnableZuulProxy} any more. Zuul 1 was dropped from Spring Cloud in
 * 2020; routes now live in {@code application.yml} under
 * {@code spring.cloud.gateway.server.webmvc.routes} and resolve through Eureka via
 * {@code lb://}.
 *
 * <p>One behaviour deliberately did not carry over. Zuul auto-discovered a route for every
 * service in the registry, so anything that registered became reachable through this
 * gateway without anyone deciding it should be. The three routes are written down now.
 * That is more typing and a much smaller blast radius.
 */
@SpringBootApplication
public class ShoppingcartUiApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShoppingcartUiApplication.class, args);
    }

    /**
     * Scoped to the proxied paths rather than every request, so the console's own static
     * assets are not handed a header nothing will read.
     */
    @Bean
    FilterRegistrationBean<AuthHeaderFilter> authHeaderFilter() {
        FilterRegistrationBean<AuthHeaderFilter> registration =
                new FilterRegistrationBean<>(new AuthHeaderFilter());
        registration.addUrlPatterns("/api/*");
        return registration;
    }
}
