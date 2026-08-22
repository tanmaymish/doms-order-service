package com.doms.catalogservice.services;

import com.doms.catalogservice.utils.MyThreadLocalsHolder;
import com.doms.catalogservice.web.models.ProductInventoryResponse;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Reads inventory levels from inventory-service behind a circuit breaker.
 *
 * <p>Both calls are guarded by Resilience4j rather than Hystrix, which has been out of
 * maintenance since 2018 and is no longer part of Spring Cloud. Two differences matter when
 * reading this against the Hystrix version:
 *
 * <ul>
 *   <li>A Resilience4j fallback takes the same arguments as the guarded method <em>plus</em>
 *       the {@link Throwable} that caused it, so a fallback can tell a timeout from a 500.</li>
 *   <li>Resilience4j runs the call on the caller's thread. Hystrix ran it on its own pool,
 *       which is why this service used to need a HystrixConcurrencyStrategy to copy the
 *       correlation id across the thread boundary. That class is gone: the ThreadLocal is
 *       simply still there.</li>
 * </ul>
 *
 * <p>Hystrix's {@code execution.isolation.thread.timeoutInMilliseconds} has no direct
 * Resilience4j equivalent for a blocking call. The bound now lives where the blocking
 * actually happens - the RestTemplate's read timeout, set in CatalogServiceApplication.
 * Breaker thresholds are in catalog-service.properties under {@code resilience4j.*}.
 */
@Service
@Slf4j
public class InventoryServiceClient {

    private static final String INVENTORY_SERVICE = "inventory-service";
    //TODO; move this to config file
    private static final String INVENTORY_API_PATH = "http://inventory-service/api/";

    private final RestTemplate restTemplate;
    private final InventoryServiceFeignClient inventoryServiceFeignClient;

    @Autowired
    public InventoryServiceClient(RestTemplate restTemplate,
                                  InventoryServiceFeignClient inventoryServiceFeignClient) {
        this.restTemplate = restTemplate;
        this.inventoryServiceFeignClient = inventoryServiceFeignClient;
    }

    @CircuitBreaker(name = INVENTORY_SERVICE, fallbackMethod = "getDefaultProductInventoryLevels")
    public List<ProductInventoryResponse> getProductInventoryLevels() {
        return this.inventoryServiceFeignClient.getInventoryLevels();
    }

    @SuppressWarnings("unused")
    List<ProductInventoryResponse> getDefaultProductInventoryLevels(Throwable cause) {
        log.info("Returning default product inventory levels, cause: {}", cause.toString());
        return new ArrayList<>();
    }

    @CircuitBreaker(name = INVENTORY_SERVICE, fallbackMethod = "getDefaultProductInventoryByCode")
    public Optional<ProductInventoryResponse> getProductInventoryByCode(String productCode) {
        log.info("CorrelationID: " + MyThreadLocalsHolder.getCorrelationId());
        ResponseEntity<ProductInventoryResponse> itemResponseEntity =
                restTemplate.getForEntity(INVENTORY_API_PATH + "inventory/{code}",
                        ProductInventoryResponse.class,
                        productCode);

        if (itemResponseEntity.getStatusCode() == HttpStatus.OK) {
            Integer quantity = itemResponseEntity.getBody().getAvailableQuantity();
            log.info("Available quantity: " + quantity);
            return Optional.ofNullable(itemResponseEntity.getBody());
        } else {
            log.error("Unable to get inventory level for product_code: " + productCode
                    + ", StatusCode: " + itemResponseEntity.getStatusCode());
            return Optional.empty();
        }
    }

    @SuppressWarnings("unused")
    Optional<ProductInventoryResponse> getDefaultProductInventoryByCode(String productCode, Throwable cause) {
        log.info("Returning default ProductInventoryByCode for productCode: " + productCode
                + ", cause: " + cause);
        log.info("CorrelationID: " + MyThreadLocalsHolder.getCorrelationId());
        ProductInventoryResponse response = new ProductInventoryResponse();
        response.setProductCode(productCode);
        response.setAvailableQuantity(50);
        return Optional.of(response);
    }
}
