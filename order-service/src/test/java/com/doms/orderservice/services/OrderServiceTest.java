package com.doms.orderservice.services;

import com.doms.orderservice.entities.Order;
import com.doms.orderservice.entities.OrderStatus;
import com.doms.orderservice.repositories.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    private OrderService orderService;

    @BeforeEach
    public void setUp() {
        orderService = new OrderService(orderRepository);
    }

    /**
     * createOrder passes save()'s return value on to processOrder, so any test that goes
     * through createOrder needs save() to hand the order back rather than null.
     */
    private void stubSaveToReturnItsArgument() {
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    public void createOrder_setsStatusCreatedBeforePersisting() {
        // order-service processes orders synchronously in this codebase, so
        // the same Order instance is saved multiple times as its status
        // mutates in place. Capturing the live reference would only show
        // its final state, so snapshot the immutable enum at each save
        // instead of the mutable Order.
        List<OrderStatus> statusesAtSaveTime = new ArrayList<>();
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order saved = invocation.getArgument(0);
            statusesAtSaveTime.add(saved.getStatus());
            return saved;
        });
        Order order = new Order();
        order.setCustomerEmail("shopper@example.com");

        orderService.createOrder(order);

        assertThat(statusesAtSaveTime).isNotEmpty();
        assertThat(statusesAtSaveTime.get(0)).isEqualTo(OrderStatus.CREATED);
    }

    @Test
    public void createOrder_swallowsProcessingFailureAndStillReturnsSavedOrder() {
        stubSaveToReturnItsArgument();
        OrderService failingService = new OrderService(orderRepository) {
            @Override
            boolean simulateTransientFailure() {
                return true;
            }
        };
        Order order = new Order();
        order.setId(42L);
        order.setCustomerEmail("shopper@example.com");

        Order result = failingService.createOrder(order);

        assertThat(result).isNotNull();
        assertThat(result.getCustomerEmail()).isEqualTo("shopper@example.com");
    }

    @Test
    public void processOrder_happyPath_transitionsThroughProcessingToShipped() {
        OrderService successfulService = new OrderService(orderRepository) {
            @Override
            boolean simulateTransientFailure() {
                return false;
            }
        };
        Order order = new Order();
        order.setId(7L);

        successfulService.processOrder(order);

        assertThat(order.getStatus()).isEqualTo(OrderStatus.SHIPPED);
        verify(orderRepository, times(2)).save(order);
    }

    @Test
    public void recoverOrder_movesOrderToFailedAndPersists() {
        Order order = new Order();
        order.setId(99L);
        order.setStatus(OrderStatus.PROCESSING);

        orderService.recoverOrder(new RuntimeException("boom"), order);

        assertThat(order.getStatus()).isEqualTo(OrderStatus.FAILED);
        verify(orderRepository).save(order);
    }

    @Test
    public void getOrderById_delegatesToRepository() {
        Order order = new Order();
        order.setId(5L);
        when(orderRepository.findById(5L)).thenReturn(Optional.of(order));

        Optional<Order> found = orderService.getOrderById(5L);

        assertThat(found).contains(order);
    }

    @Test
    public void getOrderMetrics_computesSuccessRateFromCounts() {
        when(orderRepository.count()).thenReturn(20L);
        when(orderRepository.countByStatus(OrderStatus.FAILED)).thenReturn(5L);

        java.util.Map<String, Object> metrics = orderService.getOrderMetrics();

        assertThat(metrics.get("total_orders")).isEqualTo(20L);
        assertThat(metrics.get("failed_orders")).isEqualTo(5L);
        assertThat(metrics.get("success_orders")).isEqualTo(15L);
        assertThat(metrics.get("success_rate")).isEqualTo("75.00%");
    }

    @Test
    public void getOrderMetrics_withNoOrders_reportsZeroRateWithoutDivideByZero() {
        when(orderRepository.count()).thenReturn(0L);
        when(orderRepository.countByStatus(OrderStatus.FAILED)).thenReturn(0L);

        java.util.Map<String, Object> metrics = orderService.getOrderMetrics();

        assertThat(metrics.get("success_rate")).isEqualTo("0.00%");
    }
}
