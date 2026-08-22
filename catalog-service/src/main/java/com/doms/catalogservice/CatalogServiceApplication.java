package com.doms.catalogservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@EnableFeignClients
@SpringBootApplication
public class CatalogServiceApplication {

    /**
     * Hystrix used to bound this call with its own thread timeout. Resilience4j runs the
     * call on the caller's thread, so the timeout belongs on the HTTP client instead -
     * otherwise a hung inventory-service would block a request thread indefinitely and the
     * circuit breaker would never see a failure to count.
     */
    @Bean
    @LoadBalanced
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .connectTimeout(Duration.ofSeconds(2))
                .readTimeout(Duration.ofSeconds(10))
                .build();
    }

    public static void main(String[] args) {
        SpringApplication.run(CatalogServiceApplication.class, args);
    }
}
