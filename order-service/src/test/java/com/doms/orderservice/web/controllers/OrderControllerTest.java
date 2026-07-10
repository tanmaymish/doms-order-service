package com.doms.orderservice.web.controllers;

import com.doms.orderservice.entities.Order;
import com.doms.orderservice.entities.OrderStatus;
import com.doms.orderservice.services.OrderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@RunWith(MockitoJUnitRunner.class)
public class OrderControllerTest {

    @Mock
    private OrderService orderService;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Before
    public void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new OrderController(orderService)).build();
    }

    @Test
    public void createOrder_delegatesToServiceAndReturnsSavedOrder() throws Exception {
        Order requestOrder = new Order();
        requestOrder.setCustomerEmail("shopper@example.com");
        Order savedOrder = new Order();
        savedOrder.setId(1L);
        savedOrder.setCustomerEmail("shopper@example.com");
        savedOrder.setStatus(OrderStatus.CREATED);
        when(orderService.createOrder(any(Order.class))).thenReturn(savedOrder);

        mockMvc.perform(post("/api/orders")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(requestOrder)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.status").value("CREATED"));
    }

    @Test
    public void findOrderById_returnsOrderWhenPresent() throws Exception {
        Order order = new Order();
        order.setId(3L);
        when(orderService.getOrderById(3L)).thenReturn(Optional.of(order));

        mockMvc.perform(get("/api/orders/3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(3));
    }

    @Test
    public void getOrderStatus_returns404WhenOrderMissing() throws Exception {
        when(orderService.getOrderById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/orders/99/status"))
                .andExpect(status().isNotFound());
    }

    @Test
    public void getOrderStatus_returnsStatusPayloadWhenPresent() throws Exception {
        Order order = new Order();
        order.setId(4L);
        order.setStatus(OrderStatus.SHIPPED);
        order.setUpdatedAt(LocalDateTime.of(2026, 1, 1, 12, 0));
        when(orderService.getOrderById(4L)).thenReturn(Optional.of(order));

        mockMvc.perform(get("/api/orders/4/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value(4))
                .andExpect(jsonPath("$.status").value("SHIPPED"));
    }

    @Test
    public void getOrderMetrics_returnsServiceComputedMetrics() throws Exception {
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("total_orders", 10L);
        metrics.put("success_rate", "90.00%");
        when(orderService.getOrderMetrics()).thenReturn(metrics);

        mockMvc.perform(get("/api/metrics/orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total_orders").value(10))
                .andExpect(jsonPath("$.success_rate").value("90.00%"));

        verify(orderService).getOrderMetrics();
    }
}
