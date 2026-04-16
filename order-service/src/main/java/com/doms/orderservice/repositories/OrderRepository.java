package com.doms.orderservice.repositories;

import com.doms.orderservice.entities.Order;
import com.doms.orderservice.entities.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {
    long countByStatus(OrderStatus status);
}
