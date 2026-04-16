package com.doms.orderservice.web.controllers;

import com.doms.orderservice.entities.Order;
import com.doms.orderservice.services.OrderService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@Slf4j
public class OrderController {

    private final OrderService orderService;

    @Autowired
    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/orders")
    public Order createOrder(@RequestBody Order order) {
        log.info("API request: Create Order");
        return orderService.createOrder(order);
    }

    @GetMapping("/orders/{id}")
    public Optional<Order> findOrderById(@PathVariable Long id) {
        log.info("API request: Find Order by ID {}", id);
        return orderService.getOrderById(id);
    }

    @GetMapping("/orders/{id}/status")
    public ResponseEntity<Map<String, Object>> getOrderStatus(@PathVariable Long id) {
        log.info("API request: Get Order Status for ID {}", id);
        return orderService.getOrderById(id)
                .map(order -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("orderId", order.getId());
                    response.put("status", order.getStatus());
                    response.put("updatedAt", order.getUpdatedAt());
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/metrics/orders")
    public Map<String, Object> getOrderMetrics() {
        log.info("API request: Get Order Metrics");
        return orderService.getOrderMetrics();
    }

}
