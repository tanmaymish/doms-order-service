package com.doms.orderservice.services;

import com.doms.orderservice.entities.Order;
import com.doms.orderservice.entities.OrderStatus;
import com.doms.orderservice.repositories.OrderRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@Service
@Transactional
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final Random random = new Random();

    @Autowired
    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public Order createOrder(Order order) {
        log.info("Creating new order for customer: {}", order.getCustomerEmail());
        order.setStatus(OrderStatus.CREATED);
        Order savedOrder = orderRepository.save(order);
        
        try {
            processOrder(savedOrder);
        } catch (Exception e) {
            log.error("Initial processing failed for order {}: {}", savedOrder.getId(), e.getMessage());
        }
        
        return savedOrder;
    }

    @Retryable(
        value = { RuntimeException.class },
        maxAttempts = 3,
        backoff = @Backoff(delay = 2000)
    )
    public void processOrder(Order order) {
        log.info("Processing order {} (Attempting...)", order.getId());
        
        // Simulate potential transient failure
        if (random.nextInt(10) < 3) { // 30% failure rate for demo
            log.warn("Transient failure occurred while processing order {}", order.getId());
            throw new RuntimeException("Service unavailable during order processing");
        }

        order.setStatus(OrderStatus.PROCESSING);
        orderRepository.save(order);
        log.info("Order {} transitioned to PROCESSING state", order.getId());
        
        // Simulating further workflow
        simulateWorkflow(order);
    }

    @Recover
    public void recoverOrder(RuntimeException e, Order order) {
        log.error("Max retries reached for order {}. Moving to FAILED state.", order.getId());
        order.setStatus(OrderStatus.FAILED);
        orderRepository.save(order);
    }

    private void simulateWorkflow(Order order) {
        // In a real system, this would be triggered by asynchronous events
        // For this project, we'll just set it to SHIPPED for demonstration
        order.setStatus(OrderStatus.SHIPPED);
        orderRepository.save(order);
        log.info("Order {} has been SHIPPED", order.getId());
    }

    public Optional<Order> getOrderById(Long id) {
        return orderRepository.findById(id);
    }

    public Map<String, Object> getOrderMetrics() {
        long total = orderRepository.count();
        long failed = orderRepository.countByStatus(OrderStatus.FAILED);
        long success = total - failed;
        double successRate = total > 0 ? (double) success / total * 100 : 0;

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("total_orders", total);
        metrics.put("failed_orders", failed);
        metrics.put("success_orders", success);
        metrics.put("success_rate", String.format("%.2f%%", successRate));
        
        return metrics;
    }
}
