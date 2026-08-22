package com.doms.shoppingcartui.filters;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;
import java.util.UUID;

/**
 * Stamps a correlation header onto every request before the gateway proxies it.
 *
 * <p>This was a {@code ZuulFilter} calling {@code ctx.addZuulRequestHeader}. Zuul 1 was
 * dropped from Spring Cloud in 2020 and that API went with it. Spring Cloud Gateway's MVC
 * flavour builds the outgoing request from the incoming {@link HttpServletRequest}, so a
 * plain servlet filter that wraps the request with an extra header achieves the same thing
 * without any gateway-specific API — and keeps working if the gateway is swapped again.
 *
 * <p>The value is still a per-request UUID, exactly as before. It is a placeholder for a
 * real session token: the original carried a {@code //generate or get AUTH_TOKEN, ex from
 * Spring Session repository} note, and that is still the work outstanding. Nothing
 * downstream authenticates on this header — catalog-service only logs it — so this is a
 * correlation id in all but name, not a security control.
 */
public class AuthHeaderFilter extends OncePerRequestFilter {

    public static final String AUTH_HEADER = "AUTH_HEADER";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        if (request.getHeader(AUTH_HEADER) != null) {
            chain.doFilter(request, response);
            return;
        }
        chain.doFilter(new AuthHeaderRequest(request, UUID.randomUUID().toString()), response);
    }

    /** Presents one extra header to everything downstream of this filter. */
    private static final class AuthHeaderRequest extends HttpServletRequestWrapper {

        private final String value;

        private AuthHeaderRequest(HttpServletRequest request, String value) {
            super(request);
            this.value = value;
        }

        @Override
        public String getHeader(String name) {
            return AUTH_HEADER.equalsIgnoreCase(name) ? value : super.getHeader(name);
        }

        @Override
        public Enumeration<String> getHeaders(String name) {
            return AUTH_HEADER.equalsIgnoreCase(name)
                    ? Collections.enumeration(List.of(value))
                    : super.getHeaders(name);
        }

        @Override
        public Enumeration<String> getHeaderNames() {
            List<String> names = new ArrayList<>(Collections.list(super.getHeaderNames()));
            if (names.stream().noneMatch(AUTH_HEADER::equalsIgnoreCase)) {
                names.add(AUTH_HEADER);
            }
            return Collections.enumeration(names);
        }
    }
}
